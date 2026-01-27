import {
	DisconnectAction,
	PartyAction,
	PresenceUpdateMessage,
	ReplyAction,
	VERSION,
} from '@discord-rpc/shared-types';
import { Value } from '@sinclair/typebox/value';
import { type WebSocket, WebSocketServer } from 'ws';
import { createLogger } from '../../common/utils/logger.js';
import { config } from '../../config/env.config.js';
import { ClientManagerService } from '../discord/services/client-manager.service.js';

const logger = createLogger('WebSocket');

export class WebSocketController {
	private readonly wss: WebSocketServer;
	private readonly clientManager: ClientManagerService;

	constructor() {
		this.clientManager = new ClientManagerService();
		this.wss = new WebSocketServer({ port: config.port });
		this.setupServer();
	}

	private setupServer(): void {
		this.wss.on('connection', (ws) => {
			logger.info('Client connected');
			this.handleConnection(ws);
		});

		this.wss.on('error', (error) => {
			logger.error('WebSocket server error:', error);
		});

		logger.info(`WebSocket server listening on port ${config.port}`);
	}

	private handleConnection(ws: WebSocket): void {
		this.clientManager.setWebSocket(ws);

		// Send version on connect
		ws.send(JSON.stringify({ version: VERSION }));

		ws.on('message', (data) => {
			this.handleMessage(ws, data);
		});

		ws.on('close', () => {
			logger.info('Client disconnected');
		});

		ws.on('error', (error) => {
			logger.error('WebSocket connection error:', error);
		});
	}

	private handleMessage(_ws: WebSocket, rawData: unknown): void {
		try {
			const data = JSON.parse(String(rawData));
			logger.info('Received message:', JSON.stringify(data));

			// Check for action-based messages first
			if (typeof data.action === 'string') {
				logger.info(`Processing action: ${data.action}`);
				this.handleActionMessage(data);
			} else if (Value.Check(PresenceUpdateMessage, data)) {
				// Presence update message (no action field)
				logger.info(`Processing presence update for client: ${data.clientId}`);
				this.clientManager.send(data.clientId, data.presence, data.extId);
			} else {
				logger.warn('Unknown message format:', data);
			}
		} catch (error) {
			logger.error('Failed to parse message:', error);
		}
	}

	private handleActionMessage(data: unknown): void {
		if (Value.Check(DisconnectAction, data)) {
			this.clientManager.disconnect();
			return;
		}

		if (Value.Check(PartyAction, data)) {
			for (const item of data.listener) {
				this.clientManager.connect(item.clientId, item.extId);
			}
			return;
		}

		if (Value.Check(ReplyAction, data)) {
			this.clientManager.reply(data.user, data.clientId, data.response);
			return;
		}

		logger.warn('Unknown action:', data);
	}

	async close(): Promise<void> {
		await this.clientManager.destroy();
		return new Promise((resolve, reject) => {
			this.wss.close((err) => {
				if (err) reject(err);
				else resolve();
			});
		});
	}
}
