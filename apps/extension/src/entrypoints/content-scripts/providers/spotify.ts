import {
	BaseProvider,
	type PresenceData,
	type ProviderConfig,
	type ProviderState,
	clearPresence,
	sendPresenceToBackground,
} from './base.js';

// PreMiD public CDN assets (Discord RPC accepts external URLs as image keys)
const LOGO_URL = 'https://cdn.rcd.gg/PreMiD/websites/S/Spotify/assets/logo.png';
const PLAY_URL = 'https://cdn.rcd.gg/PreMiD/resources/play.png';

/** Parses "m:ss" or "h:mm:ss" into seconds */
function parseTime(text: string | null | undefined): number {
	if (!text) return 0;
	const parts = text
		.trim()
		.split(':')
		.map((p) => Number.parseInt(p, 10));
	if (parts.some((p) => Number.isNaN(p))) return 0;
	return parts.reduce((total, part) => total * 60 + part, 0);
}

export class SpotifyProvider extends BaseProvider {
	readonly config: ProviderConfig = {
		// Official "Spotify" Discord application (same used by the PreMiD presence)
		clientId: '1458014647193047042',
		name: 'Spotify',
		matches: ['*://open.spotify.com/*'],
	};

	private intervalId: ReturnType<typeof setInterval> | null = null;

	shouldActivate(): boolean {
		// The web player footer is always mounted on open.spotify.com
		return !!document.querySelector('[data-testid="control-button-playpause"]');
	}

	getState(): ProviderState {
		const playPauseButton = document.querySelector('[data-testid="control-button-playpause"]');
		if (!playPauseButton) {
			return { isActive: false };
		}

		// While playing, the button's aria-label contains "pause"/"pausar"
		const isPlaying =
			playPauseButton.getAttribute('aria-label')?.toLowerCase().includes('pause') ?? false;

		const currentTime = parseTime(
			document.querySelector<HTMLElement>('[data-testid="playback-position"]')?.textContent,
		);
		const duration = parseTime(
			document.querySelector<HTMLElement>('[data-testid="playback-duration"]')?.textContent,
		);

		return { isActive: true, isPlaying, currentTime, duration };
	}

	getPresence(): PresenceData | null {
		if (!this.shouldActivate()) return null;

		const state = this.getState();

		// Only show presence when content is actually playing (matches PreMiD behavior)
		if (!state.isPlaying) return null;

		const trackName = document
			.querySelector<HTMLElement>(
				'[data-testid="context-item-link"], [data-testid="nowplaying-track-link"]',
			)
			?.textContent?.trim();
		if (!trackName) return null;

		const artistName = document
			.querySelector<HTMLElement>(
				'[data-testid="context-item-info-artist"], [data-testid="track-info-artists"]',
			)
			?.textContent?.trim();

		const presence: PresenceData = {
			details: trackName.slice(0, 128),
			largeImageKey: LOGO_URL,
			largeImageText: 'Spotify',
			type: 2, // Listening
		};

		if (artistName) presence.state = artistName.slice(0, 128);

		// Cover art as the large image
		const albumCover = document.querySelector<HTMLAnchorElement>(
			'a[data-testid="cover-art-link"], a[data-testid="context-link"]',
		);
		const coverImg = albumCover?.querySelector('img')?.src;
		if (coverImg) {
			presence.largeImageKey = coverImg;
		}

		presence.smallImageKey = PLAY_URL;
		presence.smallImageText = 'Playing';

		// Timestamps: end timestamp makes Discord count down the remaining time
		const { duration } = state;
		if (duration !== undefined && duration > 0 && state.currentTime !== undefined) {
			presence.startTimestamp = Date.now() - state.currentTime * 1000;
			presence.endTimestamp = Date.now() + (duration - state.currentTime) * 1000;
		}

		// Button linking to the current page (track/album/playlist)
		presence.buttons = [{ label: 'Listen on Spotify', url: document.location.href }];

		return presence;
	}

	init(): void {
		console.log('[Spotify Provider] Initializing');

		// Initial check after page loads
		setTimeout(() => this.sendUpdate(), 2000);

		// Periodic updates
		this.intervalId = setInterval(() => this.sendUpdate(), 5000);
	}

	cleanup(): void {
		if (this.intervalId) {
			clearInterval(this.intervalId);
			this.intervalId = null;
		}
	}

	private sendUpdate(): void {
		if (!this.shouldActivate()) {
			return;
		}

		const presence = this.getPresence();
		if (!presence) {
			// Not playing or metadata not ready - clear so Discord drops the activity
			clearPresence();
			return;
		}

		const state = this.getState();
		sendPresenceToBackground(this.config.clientId, presence, state.isPlaying ?? false);
	}
}

// Export singleton instance
export const spotifyProvider = new SpotifyProvider();
