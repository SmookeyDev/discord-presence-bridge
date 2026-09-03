import { EXPECTED_VERSION, WEBSOCKET_URL } from '../../common/constants.js';

export type WebSocketMessageHandler = (data: unknown) => void;
export type WebSocketStatusHandler = (connected: boolean) => void;

export class WebSocketService {
	private socket: WebSocket | null = null;
	private serverVersion: string | null = null;
	private messageHandler: WebSocketMessageHandler | null = null;
	private statusHandler: WebSocketStatusHandler | null = null;
	private connecting: Promise<void> | null = null;

	isConnected(): boolean {
		return this.socket?.readyState === WebSocket.OPEN;
	}

	getServerVersion(): string | null {
		return this.serverVersion;
	}

	isUpToDate(): boolean {
		if (!this.serverVersion) return true;
		return this.serverVersion === EXPECTED_VERSION;
	}

	onMessage(handler: WebSocketMessageHandler): void {
		this.messageHandler = handler;
	}

	onStatusChange(handler: WebSocketStatusHandler): void {
		this.statusHandler = handler;
	}

	connect(): Promise<void> {
		if (this.isConnected()) {
			return Promise.resolve();
		}

		// Prevent concurrent connections from racing each other
		if (this.connecting) {
			return this.connecting;
		}

		this.connecting = new Promise((resolve, reject) => {
			const socket = new WebSocket(WEBSOCKET_URL);
			this.socket = socket;

			socket.onerror = (evt) => {
				console.error('[WebSocket] Connection error:', evt);
				// Only report status/failure if this is still the current connection attempt
				if (this.socket === socket) {
					this.statusHandler?.(false);
					this.socket = null;
					this.connecting = null;
					reject(new Error('Could not connect to Server'));
				}
			};

			socket.onopen = () => {
				if (this.socket === socket) {
					console.log('[WebSocket] Connected');
					this.statusHandler?.(true);
					this.connecting = null;
					resolve();
				}
			};

			socket.onmessage = (evt) => {
				if (this.socket !== socket) return;
				try {
					const data = JSON.parse(evt.data);

					if (typeof data.version === 'string') {
						console.log('[WebSocket] Server version:', data.version);
						this.serverVersion = data.version;
						return;
					}

					this.messageHandler?.(data);
				} catch (error) {
					console.error('[WebSocket] Failed to parse message:', error);
				}
			};

			socket.onclose = () => {
				console.log('[WebSocket] Disconnected');
				if (this.socket === socket) {
					this.socket = null;
					this.statusHandler?.(false);
				}
			};
		});

		return this.connecting;
	}

	send(data: unknown): void {
		if (!this.isConnected()) {
			console.warn('[WebSocket] Cannot send: not connected');
			return;
		}
		this.socket?.send(JSON.stringify(data));
	}

	async ensureConnected(): Promise<void> {
		if (!this.isConnected()) {
			await this.connect();
		}
	}

	disconnect(): void {
		if (this.socket) {
			this.socket.close();
			this.socket = null;
		}
	}
}

export const websocketService = new WebSocketService();
