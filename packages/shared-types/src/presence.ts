import { type Static, Type } from '@sinclair/typebox';

/**
 * Discord Activity Types
 * @see https://discord.com/developers/docs/topics/gateway-events#activity-object-activity-types
 */
export const ActivityType = Type.Union([
	Type.Literal(0), // Playing
	Type.Literal(2), // Listening
	Type.Literal(3), // Watching
	Type.Literal(5), // Competing
]);

export type ActivityType = Static<typeof ActivityType>;

/**
 * Discord Rich Presence Button
 */
export const PresenceButton = Type.Object({
	label: Type.String({ minLength: 1, maxLength: 32 }),
	url: Type.String(),
});

export type PresenceButton = Static<typeof PresenceButton>;

/**
 * Discord Rich Presence Data
 */
export const Presence = Type.Object({
	details: Type.Optional(Type.String({ maxLength: 128 })),
	state: Type.Optional(Type.String({ maxLength: 128 })),
	largeImageKey: Type.Optional(Type.String()),
	largeImageText: Type.Optional(Type.String({ maxLength: 128 })),
	smallImageKey: Type.Optional(Type.String()),
	smallImageText: Type.Optional(Type.String({ maxLength: 128 })),
	startTimestamp: Type.Optional(Type.Integer()),
	endTimestamp: Type.Optional(Type.Integer()),
	partyId: Type.Optional(Type.String()),
	partySize: Type.Optional(Type.Integer({ minimum: 1 })),
	partyMax: Type.Optional(Type.Integer({ minimum: 1 })),
	matchSecret: Type.Optional(Type.String()),
	joinSecret: Type.Optional(Type.String()),
	spectateSecret: Type.Optional(Type.String()),
	buttons: Type.Optional(Type.Array(PresenceButton, { maxItems: 2 })),
	type: Type.Optional(ActivityType),
});

export type Presence = Static<typeof Presence>;

/**
 * Presence message from extension to server
 */
export const PresenceMessage = Type.Object({
	clientId: Type.String(),
	presence: Presence,
	extId: Type.String(),
});

export type PresenceMessage = Static<typeof PresenceMessage>;

/**
 * Client state enum
 */
export const ClientState = Type.Union([
	Type.Literal('waiting'),
	Type.Literal('connected'),
	Type.Literal('disconnected'),
]);

export type ClientState = Static<typeof ClientState>;
