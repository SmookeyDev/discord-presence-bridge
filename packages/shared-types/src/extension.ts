import { type Static, Type } from '@sinclair/typebox';
import { Presence } from './presence.js';

/**
 * Tab types for presence tracking
 */
export const TabType = Type.Union([
	Type.Literal('active'),
	Type.Literal('passive'),
	Type.Literal('background'),
]);

export type TabType = Static<typeof TabType>;

/**
 * Tab information for presence tracking
 */
export const TabInfo = Type.Object({
	type: TabType,
	domain: Type.String(),
	extId: Type.String(),
	tabId: Type.Union([Type.String(), Type.Number()]),
	usingTime: Type.Optional(Type.Number()),
});

export type TabInfo = Static<typeof TabInfo>;

/**
 * Registration modes
 */
export const RegistrationMode = Type.Union([Type.Literal('active'), Type.Literal('passive')]);

export type RegistrationMode = Static<typeof RegistrationMode>;

/**
 * Register message from third-party extension
 */
export const RegisterMessage = Type.Object({
	mode: RegistrationMode,
});

export type RegisterMessage = Static<typeof RegisterMessage>;

/**
 * Party action from third-party extension
 */
export const ExtensionPartyAction = Type.Object({
	action: Type.Literal('party'),
	clientId: Type.String(),
});

export type ExtensionPartyAction = Static<typeof ExtensionPartyAction>;

/**
 * State request from third-party extension
 */
export const ExtensionStateAction = Type.Object({
	action: Type.Literal('state'),
});

export type ExtensionStateAction = Static<typeof ExtensionStateAction>;

/**
 * Presence request action
 */
export const PresenceRequestAction = Type.Object({
	action: Type.Literal('presence'),
	tab: Type.Union([Type.String(), Type.Number()]),
	info: Type.Object({
		active: Type.Boolean(),
	}),
});

export type PresenceRequestAction = Static<typeof PresenceRequestAction>;

/**
 * Presence response from third-party extension
 */
export const PresenceResponse = Type.Object({
	clientId: Type.String(),
	presence: Presence,
});

export type PresenceResponse = Static<typeof PresenceResponse>;

/**
 * State response
 */
export const StateResponse = Type.Object({
	connected: Type.Boolean(),
	upToDate: Type.Boolean(),
	error: Type.Union([
		Type.Literal(false),
		Type.Object({
			code: Type.Number(),
			message: Type.String(),
			url: Type.Optional(Type.String()),
		}),
	]),
});

export type StateResponse = Static<typeof StateResponse>;

/**
 * Current presence state
 */
export const CurrentState = Type.Object({
	presence: Presence,
	tabInfo: TabInfo,
});

export type CurrentState = Static<typeof CurrentState>;

/**
 * Popup response
 */
export const PopupResponse = Type.Object({
	websocket: Type.Boolean(),
	clientIsUpToDate: Type.Boolean(),
	state: Type.Union([CurrentState, Type.Null()]),
});

export type PopupResponse = Static<typeof PopupResponse>;
