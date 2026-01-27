import type { ClientState, Presence } from '@discord-rpc/shared-types';
import type { WebSocket } from 'ws';
import { createLogger } from '../../../common/utils/logger.js';
import { RetryableOperation } from '../../../common/utils/retry.js';
import { config } from '../../../config/env.config.js';
import { RpcClientService } from './rpc-client.service.js';

const logger = createLogger('ClientManager');

interface ClientInfo {
	clientId: string;
	extId: string;
	state: ClientState;
	client: RpcClientService;
	createdAt: number;
}

export class ClientManagerService {
	private readonly clients = new Map<string, ClientInfo>();
	private currentId: string | null = null;
	private websocket: WebSocket | null = null;
	private timeoutId: ReturnType<typeof setTimeout> | null = null;
	private reconnectOperation: RetryableOperation | null = null;

	setWebSocket(ws: WebSocket): void {
		this.websocket = ws;
	}

	connect(clientId: string, extId: string): RpcClientService | undefined {
		const existing = this.clients.get(clientId);

		if (existing && existing.state !== 'disconnected') {
			return existing.client;
		}

		if (existing?.state === 'disconnected') {
			logger.info(`Reconnecting client ${clientId}`);
		} else {
			// Enforce max clients limit to prevent memory leaks
			this.enforceClientLimit();
			logger.info(`Creating new client ${clientId} for extension ${extId}`);
		}

		const client = new RpcClientService(clientId);
		const clientInfo: ClientInfo = {
			clientId,
			extId,
			state: 'waiting',
			client,
			createdAt: Date.now(),
		};

		this.setupClientHandlers(clientInfo);
		this.clients.set(clientId, clientInfo);

		return client;
	}

	private setupClientHandlers(clientInfo: ClientInfo): void {
		const { client, clientId, extId } = clientInfo;

		client.on('connected', () => {
			clientInfo.state = 'connected';
			logger.info(`Client ${clientId} connected`);
			this.onDiscordConnected();
		});

		client.on('disconnected', () => {
			clientInfo.state = 'disconnected';
			logger.info(`Client ${clientId} disconnected`);
			this.onDiscordDisconnected();
		});

		client.on('error', (error) => {
			clientInfo.state = 'disconnected';
			logger.error(`Client ${clientId} error:`, error);
			this.onDiscordDisconnected();
		});

		client.on('join', (secret) => {
			logger.debug(`Join event for ${clientId}:`, secret);
			this.sendToExtension({ action: 'join', clientId, extId, secret });
		});

		client.on('spectate', (secret) => {
			logger.debug(`Spectate event for ${clientId}:`, secret);
			this.sendToExtension({ action: 'spectate', clientId, extId, secret });
		});

		client.on('joinRequest', (user) => {
			logger.debug(`Join request for ${clientId}:`, user);
			this.sendToExtension({ action: 'joinRequest', clientId, extId, user });
		});
	}

	private sendToExtension(message: unknown): void {
		if (this.websocket?.readyState === 1) {
			this.websocket.send(JSON.stringify(message));
		}
	}

	send(clientId: string, presence: Presence, extId: string): void {
		const client = this.connect(clientId, extId);
		if (!client) {
			logger.error(`Failed to get client for ${clientId}`);
			return;
		}

		const clientInfo = this.clients.get(clientId);
		logger.debug(
			`Sending presence to client ${clientId} (state: ${clientInfo?.state ?? 'unknown'})`,
		);

		if (this.currentId && this.currentId !== clientId) {
			this.disconnect();
		}

		this.currentId = clientId;
		client.updatePresence(presence);
		this.resetTimeout();
	}

	disconnect(): void {
		this.clearTimeout();

		if (this.currentId) {
			const clientInfo = this.clients.get(this.currentId);
			if (clientInfo) {
				clientInfo.client.clearPresence();
				logger.info(`Disconnected: ${this.currentId}`);
			}
		} else {
			logger.info('Could not disconnect: not connected');
		}

		this.currentId = null;
	}

	reply(user: unknown, clientId: string, response: 'YES' | 'NO' | 'IGNORE'): void {
		logger.debug('Reply:', { user, clientId, response });
		const clientInfo = this.clients.get(clientId);
		if (clientInfo) {
			clientInfo.client.reply(user, response);
		}
	}

	private resetTimeout(): void {
		this.clearTimeout();
		this.timeoutId = setTimeout(() => {
			logger.info('Timeout! Disconnecting');
			this.disconnect();
		}, config.timeoutMs);
	}

	private clearTimeout(): void {
		if (this.timeoutId) {
			clearTimeout(this.timeoutId);
			this.timeoutId = null;
		}
	}

	private onDiscordDisconnected(): void {
		this.stopReconnect();
		this.reconnectOperation = new RetryableOperation(
			async () => {
				const disconnected = this.getDisconnectedClients();
				if (disconnected.length > 0) {
					const client = disconnected[Math.floor(Math.random() * disconnected.length)];
					if (client) {
						logger.info('Trying to reconnect:', client.clientId);
						this.connect(client.clientId, client.extId);
					}
				} else {
					this.stopReconnect();
				}
			},
			config.reconnectIntervalMs,
			'Reconnect',
		);
		this.reconnectOperation.start();
	}

	private onDiscordConnected(): void {
		this.stopReconnect();
		const disconnected = this.getDisconnectedClients();
		if (disconnected.length > 0) {
			logger.info(`Reconnecting all clients: ${disconnected.length}`);
			for (const client of disconnected) {
				this.connect(client.clientId, client.extId);
			}
		}
	}

	private stopReconnect(): void {
		if (this.reconnectOperation) {
			this.reconnectOperation.stop();
			this.reconnectOperation = null;
		}
	}

	private getDisconnectedClients(): ClientInfo[] {
		return Array.from(this.clients.values()).filter((c) => c.state === 'disconnected');
	}

	private enforceClientLimit(): void {
		if (this.clients.size >= config.maxClients) {
			// Remove oldest disconnected clients first
			const disconnected = this.getDisconnectedClients().sort((a, b) => a.createdAt - b.createdAt);

			for (const client of disconnected) {
				if (this.clients.size < config.maxClients) break;
				logger.info(`Removing old client: ${client.clientId}`);
				this.clients.delete(client.clientId);
			}

			// If still over limit, remove oldest clients regardless of state
			if (this.clients.size >= config.maxClients) {
				const allClients = Array.from(this.clients.entries()).sort(
					([, a], [, b]) => a.createdAt - b.createdAt,
				);

				for (const [clientId] of allClients) {
					if (this.clients.size < config.maxClients) break;
					if (clientId !== this.currentId) {
						logger.info(`Removing old client: ${clientId}`);
						this.clients.delete(clientId);
					}
				}
			}
		}
	}

	async destroy(): Promise<void> {
		this.clearTimeout();
		this.stopReconnect();
		for (const [, clientInfo] of this.clients) {
			await clientInfo.client.destroy();
		}
		this.clients.clear();
	}
}
