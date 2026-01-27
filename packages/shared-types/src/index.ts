// Re-export all types
export * from './presence.js';
export * from './websocket.js';
export * from './extension.js';

// Export constants
export const VERSION = '0.4.0';
export const DEFAULT_PORT = 6969;
export const DEFAULT_TIMEOUT_MS = 30_000;
export const RECONNECT_INTERVAL_MS = 30_000;
export const PRESENCE_UPDATE_INTERVAL_MS = 15_000;
export const FOCUS_TIMEOUT_MS = 60_000;
