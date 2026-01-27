import { TAB_PERSIST_DEBOUNCE_MS } from '../../common/constants.js';
import type { StoredTabInfo, TabInfo } from '../../common/types/index.js';

type TabId = string | number;

export class TabManagerService {
	private activeTab: Map<string, TabInfo> = new Map();
	private passiveTab: Map<string, TabInfo> = new Map();
	private backgroundTab: Map<string, TabInfo> = new Map();
	private persistDebounceTimer: ReturnType<typeof setTimeout> | null = null;

	constructor() {
		this.loadFromStorage();
	}

	private async loadFromStorage(): Promise<void> {
		const result = (await chrome.storage.local.get(['tabInfo'])) ?? {};
		const tabInfo = result?.tabInfo as StoredTabInfo | undefined;

		if (tabInfo) {
			console.log('[TabManager] Loading tab info from storage:', tabInfo);

			if (tabInfo.activeTab) {
				for (const [key, value] of Object.entries(tabInfo.activeTab)) {
					this.activeTab.set(key, value);
				}
			}
			if (tabInfo.passiveTab) {
				for (const [key, value] of Object.entries(tabInfo.passiveTab)) {
					this.passiveTab.set(key, value);
				}
			}
			if (tabInfo.backgroundTab) {
				for (const [key, value] of Object.entries(tabInfo.backgroundTab)) {
					this.backgroundTab.set(key, value);
				}
			}
		}
	}

	private persistToStorage(): void {
		if (this.persistDebounceTimer) {
			clearTimeout(this.persistDebounceTimer);
		}

		this.persistDebounceTimer = setTimeout(() => {
			const tabInfo: StoredTabInfo = {
				activeTab: Object.fromEntries(this.activeTab.entries()),
				passiveTab: Object.fromEntries(this.passiveTab.entries()),
				backgroundTab: Object.fromEntries(this.backgroundTab.entries()),
			};
			chrome.storage.local.set({ tabInfo });
		}, TAB_PERSIST_DEBOUNCE_MS);
	}

	// Active tab methods
	getActiveTab(tabId: TabId): TabInfo | undefined {
		return this.activeTab.get(String(tabId));
	}

	getAllActiveTabs(): Map<string, TabInfo> {
		return this.activeTab;
	}

	setActiveTab(tabId: TabId, info: TabInfo): void {
		this.activeTab.set(String(tabId), info);
		this.persistToStorage();
	}

	deleteActiveTab(tabId: TabId): void {
		this.activeTab.delete(String(tabId));
		this.persistToStorage();
	}

	// Passive tab methods
	getPassiveTab(tabId: TabId): TabInfo | undefined {
		return this.passiveTab.get(String(tabId));
	}

	hasPassiveTab(tabId: TabId): boolean {
		return this.passiveTab.has(String(tabId));
	}

	getPassiveTabs(): IterableIterator<TabInfo> {
		return this.passiveTab.values();
	}

	passiveTabSize(): number {
		return this.passiveTab.size;
	}

	setPassiveTab(tabId: TabId, info: TabInfo): void {
		this.passiveTab.set(String(tabId), info);
		this.persistToStorage();
	}

	deletePassiveTab(tabId: TabId): void {
		this.passiveTab.delete(String(tabId));
		this.persistToStorage();
	}

	// Re-prioritize passive tab (move to end of iteration)
	reprioritizePassiveTab(tabId: TabId): void {
		const info = this.passiveTab.get(String(tabId));
		if (info) {
			this.passiveTab.delete(String(tabId));
			this.passiveTab.set(String(tabId), info);
		}
	}

	// Background tab methods
	getBackgroundTab(tabId: TabId): TabInfo | undefined {
		return this.backgroundTab.get(String(tabId));
	}

	getAllBackgroundTabs(): Map<string, TabInfo> {
		return this.backgroundTab;
	}

	setBackgroundTab(tabId: TabId, info: TabInfo): void {
		this.backgroundTab.set(String(tabId), info);
		this.persistToStorage();
	}

	deleteBackgroundTab(tabId: TabId): void {
		this.backgroundTab.delete(String(tabId));
		this.persistToStorage();
	}

	hasAnyTabs(): boolean {
		return this.activeTab.size > 0 || this.passiveTab.size > 0 || this.backgroundTab.size > 0;
	}
}

export const tabManager = new TabManagerService();
