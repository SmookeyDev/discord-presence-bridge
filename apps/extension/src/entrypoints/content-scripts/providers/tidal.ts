import {
	BaseProvider,
	type PresenceData,
	type ProviderConfig,
	type ProviderState,
	clearPresence,
	sendPresenceToBackground,
} from './base.js';

// PreMiD public CDN assets (Discord RPC accepts external URLs as image keys)
const LOGO_URL = 'https://cdn.rcd.gg/PreMiD/websites/T/Tidal/assets/logo.png';
const PLAY_URL = 'https://cdn.rcd.gg/PreMiD/resources/play.png';
const PAUSE_URL = 'https://cdn.rcd.gg/PreMiD/resources/pause.png';
const REPEAT_URL = 'https://cdn.rcd.gg/PreMiD/resources/repeat.png';
const REPEAT_ONE_URL = 'https://cdn.rcd.gg/PreMiD/resources/repeat-one.png';

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

export class TidalProvider extends BaseProvider {
	readonly config: ProviderConfig = {
		// Official "Tidal" Discord application (same used by the PreMiD presence)
		clientId: '901591802342150174',
		name: 'TIDAL',
		matches: ['*://*.tidal.com/*'],
	};

	private intervalId: ReturnType<typeof setInterval> | null = null;

	shouldActivate(): boolean {
		// The player footer exists on every page of listen.tidal.com / tidal.com
		return !!document.querySelector('[data-test="track-info"]');
	}

	getState(): ProviderState {
		const trackInfo = document.querySelector('[data-test="track-info"]');
		if (!trackInfo) {
			return { isActive: false };
		}

		// When playing, the pause button is visible; when paused, the play button is
		const isPlaying = !!document.querySelector('button[data-test="pause"]');

		const currentTime = parseTime(
			document.querySelector<HTMLElement>('time[data-test="current-time"]')?.textContent,
		);
		const duration = parseTime(
			document.querySelector<HTMLElement>('time[data-test="duration-time"]')?.textContent ||
				document.querySelector<HTMLElement>('time[data-test="duration"]')?.textContent,
		);

		return { isActive: true, isPlaying, currentTime, duration };
	}

	getPresence(): PresenceData | null {
		if (!this.shouldActivate()) return null;

		const title = document
			.querySelector<HTMLAnchorElement>('[data-test="footer-track-title"] a')
			?.textContent?.trim();
		if (!title) return null;

		const artists = Array.from(
			document.querySelectorAll<HTMLAnchorElement>('[data-test="footer-artist-name"] a'),
		)
			.map((a) => a.textContent?.trim())
			.filter((name): name is string => !!name && name.length > 0)
			.join(', ');

		const state = this.getState();

		const presence: PresenceData = {
			details: title.slice(0, 128),
			largeImageKey: LOGO_URL,
			largeImageText: 'TIDAL',
			type: 2, // Listening
		};

		if (artists) presence.state = artists.slice(0, 128);

		// Track cover as the large image (upgrade 80x80 thumb to 640x640)
		const cover = document
			.querySelector<HTMLImageElement>('figure[data-test="current-media-imagery"] img')
			?.getAttribute('src')
			?.replace('80x80', '640x640');
		if (cover) presence.largeImageKey = cover;

		const isRepeat =
			document.querySelector('button[data-test="repeat"]')?.getAttribute('aria-checked') === 'true';

		if (state.isPlaying) {
			if (isRepeat) {
				const isRepeatOne = !!document.querySelector('[data-test="icon--player__repeat-once"]');
				presence.smallImageKey = isRepeatOne ? REPEAT_ONE_URL : REPEAT_URL;
				presence.smallImageText = isRepeatOne ? 'On loop' : 'Playlist on loop';
			} else {
				presence.smallImageKey = PLAY_URL;
				presence.smallImageText = 'Playing';
			}

			// End timestamp makes Discord count down the remaining time
			const { duration } = state;
			if (duration !== undefined && duration > 0 && state.currentTime !== undefined) {
				presence.startTimestamp = Date.now() - state.currentTime * 1000;
				presence.endTimestamp = Date.now() + (duration - state.currentTime) * 1000;
			}
		} else {
			presence.smallImageKey = PAUSE_URL;
			presence.smallImageText = 'Paused';
		}

		// Button linking to the current track
		const trackLink = document.querySelector<HTMLAnchorElement>(
			'[data-test="footer-track-title"] a',
		)?.href;
		if (trackLink) {
			presence.buttons = [{ label: 'Listen on TIDAL', url: trackLink }];
		}

		return presence;
	}

	init(): void {
		console.log('[TIDAL Provider] Initializing');

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
			clearPresence();
			return;
		}

		const presence = this.getPresence();
		if (!presence) {
			// Player metadata not ready yet - keep the last good presence
			console.log('[TIDAL Provider] Metadata not ready, skipping update');
			return;
		}

		const state = this.getState();
		sendPresenceToBackground(this.config.clientId, presence, state.isPlaying ?? false);
	}
}

// Export singleton instance
export const tidalProvider = new TidalProvider();
