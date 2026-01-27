/**
 * Base interface for presence providers
 * Each provider (YouTube, Twitch, Spotify, etc.) should implement this interface
 */

export interface PresenceData {
	details: string;
	state?: string;
	largeImageKey: string;
	largeImageText: string;
	smallImageKey?: string;
	smallImageText?: string;
	startTimestamp?: number;
	endTimestamp?: number;
	buttons?: Array<{ label: string; url: string }>;
}

export interface ProviderConfig {
	/** Discord Application ID for this provider */
	clientId: string;
	/** Display name of the provider */
	name: string;
	/** URL patterns this provider handles */
	matches: string[];
}

export interface ProviderState {
	isActive: boolean;
	isPlaying?: boolean;
	currentTime?: number;
	duration?: number;
}

/**
 * Base class for presence providers
 */
export abstract class BaseProvider {
	abstract readonly config: ProviderConfig;

	/** Check if the current page should be handled by this provider */
	abstract shouldActivate(): boolean;

	/** Get the current presence data */
	abstract getPresence(): PresenceData | null;

	/** Get the current state (playing, paused, etc.) */
	abstract getState(): ProviderState;

	/** Initialize the provider (setup listeners, etc.) */
	abstract init(): void;

	/** Cleanup when provider is deactivated */
	cleanup?(): void;
}

/**
 * Helper to format duration as MM:SS or HH:MM:SS
 */
export function formatDuration(seconds: number): string {
	if (!Number.isFinite(seconds) || seconds < 0) return '0:00';

	const hours = Math.floor(seconds / 3600);
	const mins = Math.floor((seconds % 3600) / 60);
	const secs = Math.floor(seconds % 60);

	if (hours > 0) {
		return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
	}
	return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Send presence to background script
 */
export function sendPresenceToBackground(
	clientId: string,
	presence: PresenceData,
	isPlaying: boolean,
): void {
	chrome.runtime.sendMessage({
		type: 'presence-update',
		clientId,
		presence,
		isPlaying,
	});
}

/**
 * Send clear signal to background script
 */
export function clearPresence(): void {
	chrome.runtime.sendMessage({
		type: 'presence-clear',
	});
}
