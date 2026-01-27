import { createLogger } from './logger.js';

const logger = createLogger('Retry');

export class RetryableOperation {
	private running = false;
	private timeoutId: ReturnType<typeof setTimeout> | null = null;

	constructor(
		private readonly operation: () => Promise<void>,
		private readonly intervalMs: number,
		private readonly name: string,
	) {}

	start(): void {
		if (this.running) return;
		this.running = true;
		this.scheduleNext();
	}

	stop(): void {
		this.running = false;
		if (this.timeoutId) {
			clearTimeout(this.timeoutId);
			this.timeoutId = null;
		}
	}

	private scheduleNext(): void {
		if (!this.running) return;

		this.timeoutId = setTimeout(async () => {
			try {
				await this.operation();
			} catch (error) {
				logger.error(`${this.name} operation failed:`, error);
			}
			this.scheduleNext();
		}, this.intervalMs);
	}
}
