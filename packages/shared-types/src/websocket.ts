import { type Static, Type } from '@sinclair/typebox';
import { Presence } from './presence.js';

/**
 * Server version message (sent on connection)
 */
export const ServerVersionMessage = Type.Object({
	version: Type.String(),
});

export type ServerVersionMessage = Static<typeof ServerVersionMessage>;

/**
 * Disconnect action message
 */
export const DisconnectAction = Type.Object({
	action: Type.Literal('disconnect'),
});

export type DisconnectAction = Static<typeof DisconnectAction>;

/**
 * Party listener item
 */
export const PartyListenerItem = Type.Object({
	clientId: Type.String(),
	extId: Type.String(),
});

export type PartyListenerItem = Static<typeof PartyListenerItem>;

/**
 * Party action message
 */
export const PartyAction = Type.Object({
	action: Type.Literal('party'),
	listener: Type.Array(PartyListenerItem),
});

export type PartyAction = Static<typeof PartyAction>;

/**
 * Reply action message (join request response)
 */
export const ReplyAction = Type.Object({
	action: Type.Literal('reply'),
	user: Type.Unknown(),
	clientId: Type.String(),
	response: Type.Union([Type.Literal('YES'), Type.Literal('NO'), Type.Literal('IGNORE')]),
});

export type ReplyAction = Static<typeof ReplyAction>;

/**
 * Presence update message (no action field)
 */
export const PresenceUpdateMessage = Type.Object({
	clientId: Type.String(),
	presence: Presence,
	extId: Type.String(),
});

export type PresenceUpdateMessage = Static<typeof PresenceUpdateMessage>;

/**
 * All possible incoming WebSocket messages
 */
export const IncomingMessage = Type.Union([
	DisconnectAction,
	PartyAction,
	ReplyAction,
	PresenceUpdateMessage,
]);

export type IncomingMessage = Static<typeof IncomingMessage>;

/**
 * Join action (server to extension)
 */
export const JoinAction = Type.Object({
	action: Type.Literal('join'),
	clientId: Type.String(),
	extId: Type.String(),
	secret: Type.String(),
});

export type JoinAction = Static<typeof JoinAction>;

/**
 * Spectate action (server to extension)
 */
export const SpectateAction = Type.Object({
	action: Type.Literal('spectate'),
	clientId: Type.String(),
	extId: Type.String(),
	secret: Type.String(),
});

export type SpectateAction = Static<typeof SpectateAction>;

/**
 * Join request action (server to extension)
 */
export const JoinRequestAction = Type.Object({
	action: Type.Literal('joinRequest'),
	clientId: Type.String(),
	extId: Type.String(),
	user: Type.Unknown(),
});

export type JoinRequestAction = Static<typeof JoinRequestAction>;

/**
 * All possible outgoing WebSocket messages (server to extension)
 */
export const OutgoingMessage = Type.Union([
	ServerVersionMessage,
	JoinAction,
	SpectateAction,
	JoinRequestAction,
]);

export type OutgoingMessage = Static<typeof OutgoingMessage>;
