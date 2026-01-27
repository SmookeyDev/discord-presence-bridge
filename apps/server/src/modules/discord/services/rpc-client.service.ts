import { EventEmitter } from 'node:events';
import type { Presence } from '@discord-rpc/shared-types';
import { Client as DiscordClient } from '@xhayper/discord-rpc';
import { createLogger } from '../../../common/utils/logger.js';

const logger = createLogger('RpcClient');

export type RpcClientEvent =
	| 'connected'
	| 'disconnected'
	| 'error'
	| 'join'
	| 'spectate'
	| 'joinRequest';

export interface RpcClientEventMap {
	connected: [];
	disconnected: [error?: Error];
	error: [error: Error];
	join: [secret: string];
	spectate: [secret: string];
	joinRequest: [user: unknown];
}

/**
 * Converts our Presence format to Discord RPC activity format.
 * The @xhayper/discord-rpc library expects camelCase properties.
 */
function toDiscordActivity(presence: Presence): Record<string, unknown> {
	const activity: Record<string, unknown> = {};

	if (presence.details) activity.details = presence.details;
	if (presence.state) activity.state = presence.state;

	// Activity type (Playing, Listening, Watching, Competing)
	if (presence.type !== undefined) activity.type = presence.type;

	// Timestamps - library expects startTimestamp/endTimestamp at root level
	if (presence.startTimestamp) activity.startTimestamp = presence.startTimestamp;
	if (presence.endTimestamp) activity.endTimestamp = presence.endTimestamp;

	// Assets (images) - library expects camelCase at root level
	if (presence.largeImageKey) activity.largeImageKey = presence.largeImageKey;
	if (presence.largeImageText) activity.largeImageText = presence.largeImageText;
	if (presence.smallImageKey) activity.smallImageKey = presence.smallImageKey;
	if (presence.smallImageText) activity.smallImageText = presence.smallImageText;

	// Party - library expects partyId, partySize, partyMax at root level
	if (presence.partyId) activity.partyId = presence.partyId;
	if (presence.partySize) activity.partySize = presence.partySize;
	if (presence.partyMax) activity.partyMax = presence.partyMax;

	// Secrets
	if (presence.matchSecret) activity.matchSecret = presence.matchSecret;
	if (presence.joinSecret) activity.joinSecret = presence.joinSecret;
	if (presence.spectateSecret) activity.spectateSecret = presence.spectateSecret;

	// Buttons
	if (presence.buttons && presence.buttons.length > 0) {
		activity.buttons = presence.buttons;
	}

	// Instance flag (required for party features)
	if (presence.joinSecret || presence.spectateSecret || presence.partyId) {
		activity.instance = true;
	}

	return activity;
}

export class RpcClientService extends EventEmitter {
	private readonly rpc: DiscordClient;
	private connected = false;
	private activityCache: Presence | null = null;

	constructor(private readonly clientId: string) {
		super();
		this.rpc = new DiscordClient({ clientId });
		this.setupEventHandlers();
		this.connect();
	}

	private setupEventHandlers(): void {
		// Listen for the 'ready' event which fires when connected to Discord
		this.rpc.on('ready', () => {
			this.connected = true;
			logger.info(
				`RPC ready for client ${this.clientId} - Discord user: ${this.rpc.user?.username ?? 'unknown'}`,
			);

			// Subscribe to activity events
			this.subscribeToEvents();

			// Send cached activity if any
			if (this.activityCache) {
				logger.debug(`Sending cached activity for client ${this.clientId}`);
				this.setActivity(this.activityCache);
				this.activityCache = null;
			}

			this.emit('connected');
		});

		this.rpc.on('error', (error) => {
			logger.error(`RPC error for client ${this.clientId}:`, error);
			this.connected = false;
			this.emit('error', error instanceof Error ? error : new Error(String(error)));
		});

		this.rpc.on('disconnected', () => {
			this.connected = false;
			logger.info(`RPC disconnected for client ${this.clientId}`);
			this.emit('disconnected');
		});
	}

	private subscribeToEvents(): void {
		try {
			this.rpc.subscribe('ACTIVITY_JOIN', (data: { secret: string }) => {
				logger.debug('Activity join:', data.secret);
				this.emit('join', data.secret);
			});

			this.rpc.subscribe('ACTIVITY_SPECTATE', (data: { secret: string }) => {
				logger.debug('Activity spectate:', data.secret);
				this.emit('spectate', data.secret);
			});

			this.rpc.subscribe('ACTIVITY_JOIN_REQUEST', (data: { user: unknown }) => {
				logger.debug('Activity join request:', data.user);
				this.emit('joinRequest', data.user);
			});
		} catch (error) {
			logger.warn('Failed to subscribe to activity events (may not be supported):', error);
		}
	}

	private async connect(): Promise<void> {
		try {
			logger.info(`Attempting to connect RPC for client ${this.clientId}...`);
			await this.rpc.login();
			// Note: 'ready' event handler will set connected = true and emit 'connected'
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);

			// Provide more helpful error messages for common issues
			if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('Could not connect')) {
				logger.error(
					'RPC login failed: Could not connect to Discord. Make sure Discord is running and RPC is enabled.',
				);
			} else if (errorMessage.includes('Invalid Client ID')) {
				logger.error(
					`RPC login failed: Invalid Client ID "${this.clientId}". Check your Discord Application ID.`,
				);
			} else {
				logger.error('RPC login failed:', error);
			}

			this.connected = false;
			this.emit('error', error instanceof Error ? error : new Error(String(error)));
		}
	}

	private async setActivity(presence: Presence): Promise<void> {
		try {
			if (!this.rpc.user) {
				logger.warn('Cannot set activity: RPC user not available. Is Discord running?');
				return;
			}
			const activity = toDiscordActivity(presence);
			logger.debug('Setting activity:', activity);
			await this.rpc.user.setActivity(activity);
			logger.debug('Activity set successfully');
		} catch (error) {
			logger.error('Failed to set activity:', error);
			this.emit('error', error instanceof Error ? error : new Error(String(error)));
		}
	}

	updatePresence(presence: Presence): void {
		if (this.connected) {
			this.setActivity(presence);
		} else {
			logger.debug(`Client ${this.clientId} not connected yet, caching presence`);
			this.activityCache = presence;
		}
	}

	async clearPresence(): Promise<void> {
		if (this.connected) {
			try {
				if (!this.rpc.user) {
					logger.warn('Cannot clear activity: RPC user not available');
					return;
				}
				await this.rpc.user.clearActivity();
				logger.debug('Activity cleared successfully');
			} catch (error) {
				logger.error('Failed to clear activity:', error);
				this.emit('error', error instanceof Error ? error : new Error(String(error)));
			}
		} else {
			this.activityCache = null;
		}
	}

	async reply(user: unknown, response: 'YES' | 'NO' | 'IGNORE'): Promise<void> {
		try {
			if (!this.rpc.user) {
				logger.warn('Cannot reply: RPC user not available');
				return;
			}
			const userStr = user as string;
			switch (response) {
				case 'YES':
					await this.rpc.user.sendJoinInvite(userStr);
					break;
				case 'NO':
				case 'IGNORE':
					await this.rpc.user.closeJoinRequest(userStr);
					break;
				default:
					logger.error('Unknown response type:', response);
			}
		} catch (error) {
			logger.error('Failed to reply:', error);
			this.emit('error', error instanceof Error ? error : new Error(String(error)));
		}
	}

	async destroy(): Promise<void> {
		try {
			await this.rpc.destroy();
		} catch (error) {
			logger.error('Failed to destroy RPC client:', error);
			this.emit('error', error instanceof Error ? error : new Error(String(error)));
		}
	}

	isConnected(): boolean {
		return this.connected;
	}
}
