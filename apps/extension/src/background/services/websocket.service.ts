import { EXPECTED_VERSION, WEBSOCKET_URL } from '../../common/constants.js';

export type WebSocketMessageHandler = (data: unknown) => void;
export type WebSocketStatusHandler = (connected: boolean) => void;

export class WebSocketService {
	private socket: WebSocket | null = null;
	private serverVersion: string | null = null;
	private messageHandler: WebSocketMessageHandler | null = null;
	private statusHandler: WebSocketStatusHandler | null = null;

	isConnected(): boolean {
		return this.socket?.readyState === WebSocket.OPEN;
	}

	getServerVersion(): string | null {
		return this.serverVersion;
	}

	isUpToDate(): boolean {
		if (!this.serverVersion) return true;
		// Consider up to date if version matches or is the expected version
		return this.serverVersion === EXPECTED_VERSION || this.serverVersion === '0.3.0';
	}

	onMessage(handler: WebSocketMessageHandler): void {
		this.messageHandler = handler;
	}

	onStatusChange(handler: WebSocketStatusHandler): void {
		this.statusHandler = handler;
	}

	async connect(): Promise<void> {
		if (this.isConnected()) {
			return;
		}

		return new Promise((resolve, reject) => {
			this.socket = new WebSocket(WEBSOCKET_URL);

			this.socket.onerror = (evt) => {
				console.error('[WebSocket] Connection error:', evt);
				this.statusHandler?.(false);
				reject(new Error('Could not connect to Server'));
			};

			this.socket.onopen = () => {
				console.log('[WebSocket] Connected');
				this.statusHandler?.(true);
				resolve();
			};

			this.socket.onmessage = (evt) => {
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

			this.socket.onclose = () => {
				console.log('[WebSocket] Disconnected');
				this.statusHandler?.(false);
			};
		});
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
