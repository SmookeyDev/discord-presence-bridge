import {
	DEFAULT_PORT,
	FOCUS_TIMEOUT_MS,
	PRESENCE_UPDATE_INTERVAL_MS,
} from '@discord-rpc/shared-types';

export const WEBSOCKET_URL = `ws://localhost:${DEFAULT_PORT}`;
export const EXPECTED_VERSION = '0.1.0';
export const PRESENCE_INTERVAL = PRESENCE_UPDATE_INTERVAL_MS;
export const FOCUS_TIMEOUT = FOCUS_TIMEOUT_MS;
export const TAB_PERSIST_DEBOUNCE_MS = 1000;
export const USING_TIME_THRESHOLD_MS = 2 * 60 * 1000; // 2 minutes
