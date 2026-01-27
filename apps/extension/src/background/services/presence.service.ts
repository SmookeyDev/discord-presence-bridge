import { PRESENCE_INTERVAL, USING_TIME_THRESHOLD_MS } from '../../common/constants.js';
import type {
	ApiState,
	CurrentState,
	PresenceResponse,
	TabInfo,
} from '../../common/types/index.js';
import { sanitizePresence } from '../../common/utils/sanitizer.js';
import { tabManager } from './tab-manager.service.js';
import { websocketService } from './websocket.service.js';

export class PresenceService {
	private currentState: CurrentState | null = null;
	private activeInterval: ReturnType<typeof setInterval> | null = null;
	private apiState: ApiState = { disabledDomains: [] };
	// Internal presence state (from content scripts like YouTube, Twitch, etc.)
	private internalPresence: CurrentState | null = null;
	private internalLastUpdate = 0;
	private readonly INTERNAL_TIMEOUT_MS = 15000; // 15 seconds without update = disconnected

	constructor() {
		this.loadApiState();
	}

	private async loadApiState(): Promise<void> {
		const result = (await chrome.storage.sync.get(['disabledDomains'])) ?? {};
		this.apiState = {
			disabledDomains: result?.disabledDomains ?? [],
		};

		chrome.storage.onChanged.addListener((changes, namespace) => {
			if (namespace === 'sync') {
				for (const key in changes) {
					if (key === 'disabledDomains') {
						this.apiState.disabledDomains = changes[key]?.newValue ?? [];
					}
				}
			}
		});
	}

	getCurrentState(): CurrentState | null {
		// Prioritize internal presence (from content scripts) if active
		if (this.isInternalPresenceActive()) {
			return this.internalPresence;
		}
		return this.currentState;
	}

	// Check if internal presence is still active (received update recently)
	isInternalPresenceActive(): boolean {
		if (!this.internalPresence) return false;
		return Date.now() - this.internalLastUpdate < this.INTERNAL_TIMEOUT_MS;
	}

	// Set state from internal content scripts (YouTube, Twitch, etc.)
	setInternalPresence(state: CurrentState): void {
		this.internalPresence = state;
		this.internalLastUpdate = Date.now();
		this.updateIcon();
	}

	// Clear internal presence (when tab closes or video stops)
	clearInternalPresence(): void {
		this.internalPresence = null;
		this.internalLastUpdate = 0;
		this.updateIcon();
	}

	isDomainDisabled(domain: string): boolean {
		return this.apiState.disabledDomains.includes(domain);
	}

	async checkActiveTab(tabId: number): Promise<void> {
		console.log('[Presence] Checking tab:', tabId);

		if (tabId !== 0) {
			this.clearInterval();
		}

		const currentTime = Date.now();
		const usingActive = Array.from(tabManager.getAllActiveTabs().values()).filter(
			(el) => el.usingTime && el.usingTime > currentTime - USING_TIME_THRESHOLD_MS,
		);

		const activeTabInfo = tabManager.getActiveTab(tabId);

		if (activeTabInfo) {
			console.log('[Presence] Active script found:', activeTabInfo);
			this.startPolling(
				activeTabInfo,
				{ active: true },
				() => tabManager.deleteActiveTab(tabId),
				() => this.checkActiveTab(0),
			);
		} else if (
			tabManager.passiveTabSize() > 0 ||
			tabManager.getAllBackgroundTabs().size > 0 ||
			usingActive.length > 0
		) {
			// Reprioritize current passive tab if exists
			if (tabManager.hasPassiveTab(tabId)) {
				tabManager.reprioritizePassiveTab(tabId);
			}

			// Combine background, passive, and using active tabs
			const allTabs = [
				...Array.from(tabManager.getAllBackgroundTabs().values()),
				...Array.from(tabManager.getPassiveTabs()),
				...usingActive,
			];

			this.processPassiveTabs(allTabs, tabId);
		} else {
			await this.disconnect();
		}
	}

	private processPassiveTabs(tabs: TabInfo[], currentTabId: number): void {
		if (tabs.length === 0) {
			this.disconnect();
			return;
		}

		if (currentTabId !== 0) {
			this.clearInterval();
		}

		const tab = tabs.pop();
		if (!tab) {
			this.disconnect();
			return;
		}

		console.log('[Presence] Passive tab found:', tab);

		const isBackground = tab.domain === tab.tabId;
		const removeTab = isBackground
			? () => tabManager.deleteBackgroundTab(tab.tabId)
			: () => tabManager.deletePassiveTab(tab.tabId);

		const continueProcessing = () => this.processPassiveTabs(tabs, currentTabId);

		this.startPolling(
			tab,
			{ active: tab.tabId === currentTabId },
			removeTab,
			continueProcessing,
			true,
		);
	}

	private startPolling(
		tabInfo: TabInfo,
		info: { active: boolean },
		removeTab: () => void,
		onDisconnect: () => void,
		passive = false,
	): void {
		const poll = () => {
			this.requestPresence(tabInfo, info, removeTab, onDisconnect, passive);
		};

		if (!this.activeInterval) {
			this.activeInterval = setInterval(poll, PRESENCE_INTERVAL);
		}
		poll();
	}

	private requestPresence(
		tabInfo: TabInfo,
		info: { active: boolean },
		removeTab: () => void,
		onDisconnect: () => void,
		passive: boolean,
	): void {
		if (this.isDomainDisabled(tabInfo.domain)) {
			console.log('[Presence] Domain disabled:', tabInfo.domain);
			if (this.currentState && this.currentState.tabInfo.tabId === tabInfo.tabId) {
				this.disconnect();
			}
			onDisconnect();
			return;
		}

		chrome.runtime.sendMessage(
			tabInfo.extId,
			{ action: 'presence', tab: tabInfo.tabId, info },
			(response: PresenceResponse | undefined) => {
				if (chrome.runtime.lastError) {
					console.log('[Presence] Extension not responding, unregistering:', tabInfo.extId);
					removeTab();
					this.clearInterval();
					this.disconnect();
					this.checkActiveTab(Number(tabInfo.tabId));
					return;
				}

				console.log('[Presence] Response:', response);

				if (response?.clientId !== undefined) {
					const isUsing = this.isUsingPresence(response, tabInfo.type);

					if (!passive || isUsing) {
						this.sendPresence(response, tabInfo);

						if (tabInfo.type === 'active' && isUsing) {
							const activeTab = tabManager.getActiveTab(tabInfo.tabId);
							if (activeTab) {
								activeTab.usingTime = Date.now();
								tabManager.setActiveTab(tabInfo.tabId, activeTab);
							}
						}
					} else {
						if (this.currentState && this.currentState.tabInfo.tabId === tabInfo.tabId) {
							this.disconnect();
						}
						onDisconnect();
					}
				} else {
					console.log('[Presence] Unregistering tab:', tabInfo.tabId);
					removeTab();
					this.clearInterval();
					this.disconnect();
					this.checkActiveTab(Number(tabInfo.tabId));
				}
			},
		);
	}

	private isUsingPresence(response: PresenceResponse, type: string): boolean {
		if (type !== 'active') {
			return true;
		}

		const { presence } = response;
		if (
			presence.smallImageKey &&
			presence.smallImageText &&
			(presence.smallImageKey + presence.smallImageText).toLowerCase().includes('play')
		) {
			return true;
		}

		return false;
	}

	private async sendPresence(presenceResponse: PresenceResponse, tabInfo: TabInfo): Promise<void> {
		try {
			await websocketService.ensureConnected();

			const sanitized = sanitizePresence(presenceResponse);
			const message = {
				...sanitized,
				extId: tabInfo.extId,
			};

			websocketService.send(message);

			this.currentState = {
				presence: sanitized.presence,
				tabInfo,
			};

			this.updateIcon();
		} catch (error) {
			console.error('[Presence] Failed to send presence:', error);
		}
	}

	async disconnect(): Promise<void> {
		// Don't disconnect if internal presence (YouTube, Twitch, etc.) is active
		if (this.isInternalPresenceActive()) {
			console.log('[Presence] Skipping disconnect - internal presence is active');
			return;
		}

		try {
			await websocketService.ensureConnected();
			websocketService.send({ action: 'disconnect' });
			this.currentState = null;
			this.updateIcon();
		} catch (error) {
			console.error('[Presence] Failed to disconnect:', error);
		}
	}

	private clearInterval(): void {
		if (this.activeInterval) {
			clearInterval(this.activeInterval);
			this.activeInterval = null;
		}
	}

	private async updateIcon(): Promise<void> {
		const isConnected = websocketService.isConnected();

		// Cross-browser compatibility: chrome.action (MV3) or browser.browserAction (MV2)
		const actionApi =
			(globalThis as unknown as { browser?: { browserAction?: unknown } }).browser?.browserAction ??
			chrome.action;
		if (!actionApi) {
			console.warn('[Presence] No action API available');
			return;
		}

		if (this.currentState || !isConnected) {
			const canvas = new OffscreenCanvas(19, 19);
			const context = canvas.getContext('2d');
			if (!context) return;

			const imgBlob = await fetch(chrome.runtime.getURL('icons/icon16.png')).then((r) => r.blob());
			const img = await createImageBitmap(imgBlob);

			context.drawImage(img, 0, 0, 19, 19);
			context.beginPath();
			context.arc(14, 14, 5, 0, 2 * Math.PI);

			context.fillStyle = isConnected ? 'lime' : 'red';
			context.fill();
			context.lineWidth = 1;
			context.strokeStyle = isConnected ? 'green' : 'red';
			context.stroke();

			(actionApi as typeof chrome.action).setIcon({
				imageData: context.getImageData(0, 0, 19, 19),
			});
		} else {
			(actionApi as typeof chrome.action).setIcon({
				path: 'icons/icon16.png',
			});
		}
	}
}

export const presenceService = new PresenceService();
