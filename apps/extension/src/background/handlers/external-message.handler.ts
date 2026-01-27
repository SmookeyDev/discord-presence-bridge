import type { TabInfo } from '../../common/types/index.js';
import { presenceService } from '../services/presence.service.js';
import { tabManager } from '../services/tab-manager.service.js';
import { websocketService } from '../services/websocket.service.js';

interface PartyListener {
	clientId: string;
	extId: string;
}

const partyListeners = new Map<string, PartyListener>();

function getDomain(url: string): string {
	let domain = url.split('/')[2] ?? '';
	domain = domain.replace(/www\.?\./i, '');
	return domain;
}

export function updatePartyListeners(): void {
	const listeners = Array.from(partyListeners.values());
	if (listeners.length > 0) {
		websocketService.send({ action: 'party', listener: listeners });
	} else {
		console.log('[Handler] No party listeners to send');
	}
}

export function handleExternalMessage(
	request: unknown,
	sender: chrome.runtime.MessageSender,
	sendResponse: (response?: unknown) => void,
): boolean {
	const req = request as Record<string, unknown>;

	// Registration message
	if (typeof req.mode === 'string') {
		console.log('[Handler] Register:', req, sender);

		if (!sender.tab) {
			// Background extension
			const tabInfo: TabInfo = {
				type: 'background',
				domain: sender.id!,
				extId: sender.id!,
				tabId: sender.id!,
			};
			tabManager.setBackgroundTab(sender.id!, tabInfo);
		} else if (req.mode === 'passive') {
			const tabInfo: TabInfo = {
				type: 'passive',
				domain: getDomain(sender.url!),
				extId: sender.id!,
				tabId: sender.tab.id!,
			};
			tabManager.setPassiveTab(sender.tab.id!, tabInfo);
		} else {
			const tabInfo: TabInfo = {
				type: 'active',
				domain: getDomain(sender.url!),
				extId: sender.id!,
				tabId: sender.tab.id!,
			};
			tabManager.setActiveTab(sender.tab.id!, tabInfo);
		}

		sendResponse({ status: true });

		if (sender.tab?.active) {
			presenceService.checkActiveTab(sender.tab.id!);
		}

		return false;
	}

	// Action messages
	if (typeof req.action === 'string') {
		switch (req.action) {
			case 'party': {
				console.log('[Handler] Party:', req);
				const clientId = req.clientId as string;
				partyListeners.set(clientId, {
					clientId,
					extId: sender.id!,
				});
				updatePartyListeners();
				break;
			}

			case 'state': {
				console.log('[Handler] State request');
				const state: {
					connected: boolean;
					upToDate: boolean;
					error: false | { code: number; message: string; url?: string };
				} = {
					connected: false,
					upToDate: false,
					error: false,
				};

				state.connected = websocketService.isConnected();
				state.upToDate = websocketService.isUpToDate();

				if (!state.connected) {
					state.error = {
						code: 901,
						message: 'Application is not running or is not installed',
						url: 'https://github.com/SmookeyDev/discord-presence-bridge/releases/latest',
					};
				}

				sendResponse(state);
				websocketService.ensureConnected().catch(console.error);
				break;
			}

			default:
				console.error('[Handler] Unknown action:', req, sender);
		}

		return false;
	}

	console.error('[Handler] Unknown message:', req, sender);
	return false;
}
