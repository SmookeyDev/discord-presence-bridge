import type { CurrentState, Presence, TabInfo } from '@discord-rpc/shared-types';

export interface ApiState {
	disabledDomains: string[];
}

export interface StoredTabInfo {
	activeTab: Record<string, TabInfo>;
	passiveTab: Record<string, TabInfo>;
	backgroundTab: Record<string, TabInfo>;
}

export interface PresenceResponse {
	clientId: string;
	presence: Presence;
}

export interface InternalState {
	websocketOk: boolean;
	serverVersion: string | null;
	currentState: CurrentState | null;
}

export interface PopupResponseData {
	websocket: boolean;
	clientIsUpToDate: boolean;
	state: CurrentState | null;
}

export interface StateError {
	code: number;
	message: string;
	url?: string;
}

export interface StateResponseData {
	connected: boolean;
	upToDate: boolean;
	error: false | StateError;
}

export type { TabInfo, Presence, CurrentState };
