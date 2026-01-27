import { DEFAULT_PORT, DEFAULT_TIMEOUT_MS, RECONNECT_INTERVAL_MS } from '@discord-rpc/shared-types';

export interface EnvConfig {
	port: number;
	timeoutMs: number;
	reconnectIntervalMs: number;
	debug: boolean;
	maxClients: number;
}

function getEnvNumber(key: string, defaultValue: number): number {
	const value = process.env[key];
	if (value === undefined) return defaultValue;
	const parsed = Number.parseInt(value, 10);
	return Number.isNaN(parsed) ? defaultValue : parsed;
}

function getEnvBoolean(key: string, defaultValue: boolean): boolean {
	const value = process.env[key];
	if (value === undefined) return defaultValue;
	return value.toLowerCase() === 'true' || value === '1';
}

export const config: EnvConfig = {
	port: getEnvNumber('PORT', DEFAULT_PORT),
	timeoutMs: getEnvNumber('TIMEOUT_MS', DEFAULT_TIMEOUT_MS),
	reconnectIntervalMs: getEnvNumber('RECONNECT_INTERVAL_MS', RECONNECT_INTERVAL_MS),
	debug: getEnvBoolean('DEBUG', false),
	maxClients: getEnvNumber('MAX_CLIENTS', 100),
};
