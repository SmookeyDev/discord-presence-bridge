import type { Presence } from '@discord-rpc/shared-types';

const MAX_STRING_LENGTH = 127;
const VALID_ACTIVITY_TYPES = [0, 2, 3, 5] as const;

type ActivityType = (typeof VALID_ACTIVITY_TYPES)[number];

interface PresenceInput {
	clientId: string;
	presence: Partial<Presence>;
}

interface SanitizedPresence {
	clientId: string;
	presence: Presence;
}

// --- Sanitizers ---

function sanitizeString(value: unknown, maxLength = MAX_STRING_LENGTH): string | undefined {
	if (typeof value !== 'string' || value === '') return undefined;
	return value.slice(0, maxLength);
}

function sanitizeTimestamp(value: unknown): number | undefined {
	if (value === undefined || value === '') return undefined;
	const num = Math.round(Number(value));
	return Number.isFinite(num) ? num : undefined;
}

function sanitizeActivityType(type: unknown): ActivityType | undefined {
	if (typeof type !== 'number') return undefined;
	return VALID_ACTIVITY_TYPES.includes(type as ActivityType) ? (type as ActivityType) : undefined;
}

function sanitizeParty(
	size: unknown,
	max: unknown,
): { partySize: number; partyMax: number } | undefined {
	const sizeNum = Number(size);
	const maxNum = Number(max);

	const isValidSize = /^\d+$/.test(String(size));
	const isValidMax = /^\d+$/.test(String(max));

	if (!isValidSize || !isValidMax || sizeNum > maxNum) return undefined;

	return { partySize: sizeNum, partyMax: maxNum };
}

function sanitizeButtons(buttons: unknown): Array<{ label: string; url: string }> | undefined {
	if (!Array.isArray(buttons) || buttons.length === 0) return undefined;

	const sanitized = buttons
		.slice(0, 2)
		.filter(
			(btn): btn is { label: string; url: string } =>
				typeof btn === 'object' &&
				btn !== null &&
				typeof btn.label === 'string' &&
				typeof btn.url === 'string',
		);

	return sanitized.length > 0 ? sanitized : undefined;
}

function sanitizeSecret(value: unknown): string | undefined {
	if (typeof value !== 'string' || value === '') return undefined;
	return value;
}

// --- Main Function ---

export function sanitizePresence(input: PresenceInput): SanitizedPresence {
	const { presence } = input;
	const result: Presence = {};

	// Text fields
	const details = sanitizeString(presence.details);
	const state = sanitizeString(presence.state);

	if (details) result.details = details;
	if (state) result.state = state;

	// Image fields
	const largeImageKey = sanitizeString(presence.largeImageKey);
	const largeImageText = sanitizeString(presence.largeImageText);
	const smallImageKey = sanitizeString(presence.smallImageKey);
	const smallImageText = sanitizeString(presence.smallImageText);

	if (largeImageKey) result.largeImageKey = largeImageKey;
	if (largeImageText) result.largeImageText = largeImageText;
	if (smallImageKey) result.smallImageKey = smallImageKey;
	if (smallImageText) result.smallImageText = smallImageText;

	// Timestamps
	const startTimestamp = sanitizeTimestamp(presence.startTimestamp);
	const endTimestamp = sanitizeTimestamp(presence.endTimestamp);

	if (startTimestamp !== undefined) result.startTimestamp = startTimestamp;
	if (endTimestamp !== undefined) result.endTimestamp = endTimestamp;

	// Activity type
	const type = sanitizeActivityType(presence.type);
	if (type !== undefined) result.type = type;

	// Party
	const party = sanitizeParty(presence.partySize, presence.partyMax);
	if (party) {
		result.partySize = party.partySize;
		result.partyMax = party.partyMax;
	}

	const partyId = sanitizeSecret(presence.partyId);
	if (partyId) result.partyId = partyId;

	// Secrets
	const matchSecret = sanitizeSecret(presence.matchSecret);
	const joinSecret = sanitizeSecret(presence.joinSecret);
	const spectateSecret = sanitizeSecret(presence.spectateSecret);

	if (matchSecret) result.matchSecret = matchSecret;
	if (joinSecret) result.joinSecret = joinSecret;
	if (spectateSecret) result.spectateSecret = spectateSecret;

	// Buttons
	const buttons = sanitizeButtons(presence.buttons);
	if (buttons) result.buttons = buttons;

	return {
		clientId: input.clientId,
		presence: result,
	};
}
