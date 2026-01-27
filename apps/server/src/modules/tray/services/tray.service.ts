import { createLogger } from '../../../common/utils/logger.js';

const logger = createLogger('Tray');

// Base64 encoded PNG icon for Linux/macOS
const ICON_PNG_BASE64 =
	'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';

// Base64 encoded ICO icon for Windows (same as from original code, truncated for display)
const ICON_ICO_BASE64 =
	'AAABAAEAMDAAAAEAIACoJQAAFgAAACgAAAAwAAAAYAAAAAEAIAAAAAAAACQAAMMOAADDDgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

export interface TrayServiceOptions {
	onExit?: (() => void) | undefined;
}

export interface ITrayService {
	start(): Promise<void>;
	stop(): Promise<void>;
}

class NullTrayService implements ITrayService {
	async start(): Promise<void> {
		logger.info('Tray not available on this platform');
	}
	async stop(): Promise<void> {}
}

class SystemTrayService implements ITrayService {
	private systray: unknown = null;
	private onExit: (() => void) | undefined;

	constructor(options: TrayServiceOptions = {}) {
		this.onExit = options.onExit;
	}

	async start(): Promise<void> {
		try {
			// Dynamic import to avoid issues on platforms without systray support
			const { default: SysTray } = await import('systray2');

			const isWindows = process.platform === 'win32';
			const icon = isWindows ? ICON_ICO_BASE64 : ICON_PNG_BASE64;

			this.systray = new SysTray({
				menu: {
					icon,
					title: isWindows ? 'Discord Presence Bridge' : 'DPB',
					tooltip: 'Discord Presence Bridge',
					items: [
						{
							title: 'Exit',
							tooltip: 'Exit',
							checked: false,
							enabled: true,
						},
					],
				},
				debug: false,
				copyDir: true,
			});

			(this.systray as { onClick: (cb: (action: { seq_id: number }) => void) => void }).onClick(
				(action) => {
					if (action.seq_id === 0) {
						logger.info('Exit requested from tray');
						if (this.onExit) {
							this.onExit();
						}
						this.stop();
					}
				},
			);

			logger.info('System tray created');
		} catch (error) {
			logger.warn('Failed to create system tray:', error);
		}
	}

	async stop(): Promise<void> {
		if (this.systray) {
			try {
				(this.systray as { kill: () => void }).kill();
			} catch (error) {
				logger.warn('Failed to kill systray:', error);
			}
		}
	}
}

export function createTrayService(options: TrayServiceOptions = {}): ITrayService {
	// Check if we're in a headless environment
	if (process.env.HEADLESS === 'true' || process.env.NO_TRAY === 'true') {
		return new NullTrayService();
	}

	return new SystemTrayService(options);
}
