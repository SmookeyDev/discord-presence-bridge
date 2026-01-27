import { config } from '../../config/env.config.js';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_COLORS = {
	debug: '\x1b[90m',
	info: '\x1b[36m',
	warn: '\x1b[33m',
	error: '\x1b[31m',
	reset: '\x1b[0m',
} as const;

function formatTimestamp(): string {
	return new Date().toISOString();
}

function log(level: LogLevel, prefix: string, ...args: unknown[]): void {
	if (level === 'debug' && !config.debug) return;

	const color = LOG_COLORS[level];
	const reset = LOG_COLORS.reset;
	const timestamp = formatTimestamp();

	console[level](`${color}[${timestamp}] [${prefix}] [${level.toUpperCase()}]${reset}`, ...args);
}

export function createLogger(prefix: string) {
	return {
		debug: (...args: unknown[]) => log('debug', prefix, ...args),
		info: (...args: unknown[]) => log('info', prefix, ...args),
		warn: (...args: unknown[]) => log('warn', prefix, ...args),
		error: (...args: unknown[]) => log('error', prefix, ...args),
	};
}

export const logger = createLogger('Server');
