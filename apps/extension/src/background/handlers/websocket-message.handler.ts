import type { JoinAction, JoinRequestAction, SpectateAction } from '@discord-rpc/shared-types';
import { presenceService } from '../services/presence.service.js';
import { websocketService } from '../services/websocket.service.js';

type WebSocketAction = JoinAction | JoinRequestAction | SpectateAction;

function isAction(data: unknown): data is WebSocketAction {
	return typeof data === 'object' && data !== null && 'action' in data;
}

export function handleWebSocketMessage(data: unknown): void {
	if (!isAction(data)) {
		console.error('[WSHandler] Unknown message format:', data);
		return;
	}

	const currentState = presenceService.getCurrentState();

	switch (data.action) {
		case 'join': {
			console.log('[WSHandler] Join:', data);
			chrome.runtime.sendMessage(
				data.extId,
				{
					action: 'join',
					clientId: data.clientId,
					secret: data.secret,
				},
				(response) => {
					console.log('[WSHandler] Join redirected:', response);
				},
			);
			break;
		}

		case 'joinRequest': {
			console.log('[WSHandler] Join request:', data);
			chrome.runtime.sendMessage(
				data.extId,
				{
					action: 'joinRequest',
					clientId: data.clientId,
					user: data.user,
					tab: currentState?.tabInfo.tabId,
				},
				(replyResponse: 'YES' | 'NO' | 'IGNORE') => {
					console.log('[WSHandler] Join request response:', replyResponse);
					websocketService.send({
						action: 'reply',
						user: data.user,
						clientId: data.clientId,
						response: replyResponse,
					});
				},
			);
			break;
		}

		case 'spectate': {
			console.log('[WSHandler] Spectate:', data);
			chrome.runtime.sendMessage(
				data.extId,
				{
					action: 'spectate',
					clientId: data.clientId,
					secret: data.secret,
				},
				(response) => {
					console.log('[WSHandler] Spectate redirected:', response);
				},
			);
			break;
		}

		default:
			console.error('[WSHandler] Unknown action:', data);
	}
}
