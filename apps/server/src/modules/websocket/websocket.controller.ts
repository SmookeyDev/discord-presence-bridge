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

/** Allowed origins for extension WebSocket connections (chrome-extension://<id>, moz-extension://<id>) */
const EXTENSION_ORIGIN_REGEX = /^(chrome|moz)-extension:\/\//;

/** Max incoming message size (1 MB) */
const MAX_PAYLOAD_BYTES = 1024 * 1024;

function isAllowedOrigin(origin: string | undefined): boolean {
	if (!origin) return false;
	return EXTENSION_ORIGIN_REGEX.test(origin);
}

function messageSize(data: unknown): number {
	if (Array.isArray(data)) {
		let total = 0;
		for (const chunk of data) {
			total += typeof chunk === 'string' ? chunk.length : (chunk as Buffer).length;
		}
		return total;
	}
	if (typeof data === 'string') return data.length;
	return (data as Buffer).length;
}

export class WebSocketController {
	private readonly wss: WebSocketServer;
	private readonly clientManager: ClientManagerService;

	constructor() {
		this.clientManager = new ClientManagerService();
		this.wss = new WebSocketServer({
			port: config.port,
			// Guard against oversized payloads (memory exhaustion)
			maxPayload: 1024 * 1024,
		});
		this.setupServer();
	}

	private setupServer(): void {
		this.wss.on('connection', (ws, request) => {
			const origin = request.headers.origin;
			if (!isAllowedOrigin(origin)) {
				logger.warn(
					`Rejecting WebSocket connection from unauthorized origin: ${origin ?? '(none)'}`,
				);
				ws.close(1008, 'Unauthorized origin');
				return;
			}

			logger.info(`Client connected (origin: ${origin})`);
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

		// Drop any stale reference from a previous connection
		ws.on('close', () => {
			this.clientManager.clearWebSocket(ws);
			logger.info('Client disconnected');
		});

		ws.on('message', (data) => {
			// ws maxPayload is ignored under the Bun runtime, enforce the limit manually
			if (messageSize(data) > MAX_PAYLOAD_BYTES) {
				logger.warn(`Message too large (${messageSize(data)} bytes), closing connection with 1009`);
				ws.close(1009, 'Message too large');
				return;
			}
			this.handleMessage(ws, data);
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
