import { FOCUS_TIMEOUT } from '../common/constants.js';
import { sanitizePresence } from '../common/utils/sanitizer.js';
import {
	handleExternalMessage,
	updatePartyListeners,
} from './handlers/external-message.handler.js';
import { handleWebSocketMessage } from './handlers/websocket-message.handler.js';
import { presenceService } from './services/presence.service.js';
import { websocketService } from './services/websocket.service.js';

let focusTimeout: ReturnType<typeof setTimeout> | null = null;

// Handle presence from content scripts (YouTube, Twitch, etc.)
async function handlePresenceUpdate(
	request: { clientId: string; presence: Record<string, unknown>; isPlaying?: boolean },
	sender: chrome.runtime.MessageSender,
): Promise<void> {
	console.log('[Background] Presence update received:', request.clientId);

	try {
		await websocketService.ensureConnected();

		const message = sanitizePresence({
			clientId: request.clientId,
			presence: request.presence,
		});

		websocketService.send({
			...message,
			extId: chrome.runtime.id,
		});

		// Extract domain from sender URL
		const domain = sender.tab?.url
			? new URL(sender.tab.url).hostname.replace('www.', '')
			: 'unknown';

		// Update internal state for popup display
		presenceService.setInternalPresence({
			presence: message.presence,
			tabInfo: {
				type: 'active',
				domain,
				extId: chrome.runtime.id,
				tabId: sender.tab?.id ?? 0,
			},
		});

		console.log('[Background] Presence sent to server');
	} catch (error) {
		console.error('[Background] Failed to send presence:', error);
	}
}

// Initialize
async function init(): Promise<void> {
	console.log('[Background] Initializing Discord RPC Extension');

	// Clear presence storage on startup
	await chrome.storage.local.set({ presence: null });

	// Setup WebSocket handlers
	websocketService.onMessage(handleWebSocketMessage);
	websocketService.onStatusChange((connected) => {
		if (connected) {
			updatePartyListeners();
		}
	});

	// Connect to WebSocket server
	try {
		await websocketService.connect();
	} catch (error) {
		console.log('[Background] Initial connection failed:', error);
	}

	setupListeners();
}

function setupListeners(): void {
	// Handle installation
	chrome.runtime.onInstalled.addListener((details) => {
		if (details.reason === 'install') {
			chrome.tabs.create({ url: chrome.runtime.getURL('install.html') }, () => {
				console.log('[Background] Opened install page');
			});
		}
	});

	// Handle window focus changes
	chrome.windows.onFocusChanged.addListener((activeWindowId) => {
		if (focusTimeout) {
			clearTimeout(focusTimeout);
			focusTimeout = null;
		}

		console.log('[Background] Window focus changed:', activeWindowId);

		if (activeWindowId >= 0) {
			chrome.tabs.query({ active: true, windowId: activeWindowId }, (tabs) => {
				if (tabs.length > 0 && tabs[0]?.id) {
					presenceService.checkActiveTab(tabs[0].id);
				}
			});
		} else {
			console.log('[Background] Browser not focused');
			focusTimeout = setTimeout(() => {
				console.log('[Background] Focus timeout');
				presenceService.checkActiveTab(0);
			}, FOCUS_TIMEOUT);
		}
	});

	// Handle tab activation
	chrome.tabs.onActivated.addListener((activeInfo) => {
		console.log('[Background] Tab activated:', activeInfo.tabId);
		presenceService.checkActiveTab(activeInfo.tabId);
	});

	// Handle external messages (from third-party extensions)
	chrome.runtime.onMessageExternal.addListener(handleExternalMessage);

	// Handle internal messages (from popup and content scripts)
	chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
		// Handle presence update from content scripts (YouTube, Twitch, etc.)
		if (request?.type === 'presence-update') {
			handlePresenceUpdate(request, sender);
			sendResponse({ ok: true });
			return false;
		}

		// Handle presence clear (navigated away from video/stream)
		if (request?.type === 'presence-clear') {
			console.log('[Background] Presence cleared');
			presenceService.clearInternalPresence();
			websocketService.send({ action: 'disconnect' });
			sendResponse({ ok: true });
			return false;
		}

		// Default: return status for popup
		sendResponse({
			websocket: websocketService.isConnected(),
			clientIsUpToDate: websocketService.isUpToDate(),
			state: presenceService.getCurrentState(),
		});
		return false;
	});
}

// Entry point
init().catch(console.error);

export default {};
