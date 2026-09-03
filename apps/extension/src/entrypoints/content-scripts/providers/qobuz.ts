import {
	BaseProvider,
	type PresenceData,
	type ProviderConfig,
	type ProviderState,
	sendPresenceToBackground,
} from './base.js';

// PreMiD public CDN assets (Discord RPC accepts external URLs as image keys)
const LOGO_URL = 'https://cdn.rcd.gg/PreMiD/websites/Q/Qobuz/assets/logo.png';
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

export class QobuzProvider extends BaseProvider {
	readonly config: ProviderConfig = {
		// Official "Qobuz" Discord application (same used by the PreMiD presence)
		clientId: '921861694190407730',
		name: 'Qobuz',
		matches: ['*://play.qobuz.com/*'],
	};

	private intervalId: ReturnType<typeof setInterval> | null = null;

	shouldActivate(): boolean {
		// The player footer is present once the web app has loaded
		return !!document.querySelector('#root') && !!document.querySelector('.player__track-name');
	}

	getState(): ProviderState {
		const trackName = document.querySelector<HTMLAnchorElement>('a[class="player__track-name"]');
		if (!trackName) {
			return { isActive: false };
		}

		// When paused, the play button is visible in the footer
		const isPlaying = !document.querySelector('span[class="player__action-play"]');

		const timeTexts = document.querySelectorAll<HTMLElement>(
			'span[class="player__track-time-text"]',
		);
		const currentTime = parseTime(timeTexts[0]?.textContent);
		const duration = parseTime(timeTexts[1]?.textContent);

		return { isActive: true, isPlaying, currentTime, duration };
	}

	getPresence(): PresenceData | null {
		if (!this.shouldActivate()) return null;

		const songTitle = document.querySelector<HTMLAnchorElement>('a[class="player__track-name"]');
		const title = songTitle?.textContent?.trim();
		if (!title) return null;

		const albumLinks = document.querySelectorAll<HTMLAnchorElement>(
			'div[class="player__track-album"] a',
		);

		// First link is the artist, second is the album, third (if any) is the playlist
		const artist = albumLinks[0]?.textContent?.trim();
		const album = albumLinks[1]?.textContent?.trim();
		const playlist = albumLinks[2];

		const state = this.getState();

		const presence: PresenceData = {
			details: title.slice(0, 128),
			largeImageKey: LOGO_URL,
			largeImageText: 'Qobuz',
			type: 2, // Listening
		};
		const stateParts: string[] = [];
		if (artist) stateParts.push(artist);
		if (album && album !== artist) stateParts.push(album);
		if (playlist) stateParts.push(`From: ${playlist.textContent?.trim()}`);
		if (stateParts.length > 0) {
			presence.state = stateParts.join(' • ').slice(0, 128);
		}

		// Cover art as the large image (upgrade 230px thumb to 600px)
		const cover = document
			.querySelector<HTMLImageElement>('div[class="player__track-cover"] img')
			?.getAttribute('src')
			?.replace('230', '600');
		if (cover) presence.largeImageKey = cover;

		if (state.isPlaying) {
			presence.smallImageKey = PLAY_URL;
			presence.smallImageText = 'Playing';

			// End timestamp makes Discord count down the remaining time
			const { duration } = state;
			if (duration !== undefined && duration > 0 && state.currentTime !== undefined) {
				presence.startTimestamp = Date.now() - state.currentTime * 1000;
				presence.endTimestamp = Date.now() + (duration - state.currentTime) * 1000;
			}

			// Repeat indicators
			const repeatEl = document.querySelector('.player__action-repeat.pct');
			if (repeatEl?.classList.contains('pct-repeat-once')) {
				presence.smallImageKey = REPEAT_ONE_URL;
				presence.smallImageText = 'On loop';
			} else if (repeatEl?.classList.contains('player__action-repeat--active')) {
				presence.smallImageKey = REPEAT_URL;
				presence.smallImageText = 'Queue on loop';
			}
		} else {
			presence.smallImageKey = PAUSE_URL;
			presence.smallImageText = 'Paused';
		}

		// Buttons: album link (and playlist link when playing from a playlist)
		if (songTitle?.href) {
			presence.buttons = [{ label: 'View Album', url: songTitle.href }];
			if (playlist?.href) {
				presence.buttons.push({ label: 'View Playlist', url: playlist.href });
			}
		}

		return presence;
	}

	init(): void {
		console.log('[Qobuz Provider] Initializing');

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
			// Metadata not ready yet - keep the last good presence
			console.log('[Qobuz Provider] Metadata not ready, skipping update');
			return;
		}

		const state = this.getState();
		sendPresenceToBackground(this.config.clientId, presence, state.isPlaying ?? false);
	}
}

// Export singleton instance
export const qobuzProvider = new QobuzProvider();
