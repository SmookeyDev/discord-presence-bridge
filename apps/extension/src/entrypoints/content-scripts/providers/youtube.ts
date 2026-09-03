import {
	BaseProvider,
	type PresenceData,
	type ProviderConfig,
	type ProviderState,
	clearPresence,
	formatDuration,
	sendPresenceToBackground,
} from './base.js';

export class YouTubeProvider extends BaseProvider {
	readonly config: ProviderConfig = {
		clientId: '463097721130188830',
		name: 'YouTube',
		matches: ['*://*.youtube.com/*'],
	};

	private video: HTMLVideoElement | null = null;
	private intervalId: ReturnType<typeof setInterval> | null = null;
	private lastUrl = '';
	private liveStartTime: number | null = null;

	shouldActivate(): boolean {
		return window.location.pathname.startsWith('/watch');
	}

	getState(): ProviderState {
		const video = this.getVideo();
		if (!video) {
			return { isActive: false };
		}

		return {
			isActive: true,
			isPlaying: !video.paused,
			currentTime: Math.floor(video.currentTime),
			duration: Math.floor(video.duration) || 0,
		};
	}

	getPresence(): PresenceData | null {
		if (!this.shouldActivate()) return null;

		const video = this.getVideo();
		if (!video) return null;

		const title = this.getVideoTitle();
		const channel = this.getChannelName();

		// During SPA transitions the watch metadata hasn't rendered yet.
		// Return null so the caller skips this update and keeps the last
		// known presence instead of flashing placeholder text on Discord.
		if (!title || !channel) return null;

		const isLive = this.isLiveStream();
		const state = this.getState();

		const presence: PresenceData = {
			details: title.slice(0, 128),
			largeImageKey: 'youtube',
			largeImageText: 'YouTube',
		};

		// Build state with channel and time info
		let stateText = channel;
		if (!isLive && state.duration && state.duration > 0) {
			stateText = `${channel} • ${formatDuration(state.currentTime || 0)} / ${formatDuration(state.duration)}`;
		}
		presence.state = stateText.slice(0, 128);

		if (state.isPlaying) {
			presence.smallImageKey = 'play';
			presence.smallImageText = 'Playing';

			if (isLive) {
				presence.smallImageKey = 'live';
				presence.smallImageText = 'LIVE';
				// Keep a stable start time so the "elapsed" counter doesn't reset on every update
				if (!this.liveStartTime) {
					this.liveStartTime = Date.now();
				}
				presence.startTimestamp = this.liveStartTime;
			} else if (state.duration && state.duration > 0 && state.currentTime !== undefined) {
				// Calculate when the video "started" based on current position
				const videoStartTime = Date.now() - state.currentTime * 1000;
				presence.startTimestamp = videoStartTime;
			}
		} else {
			presence.smallImageKey = 'pause';
			presence.smallImageText = 'Paused';
		}

		return presence;
	}

	init(): void {
		console.log('[YouTube Provider] Initializing');

		// Initial check after page loads
		setTimeout(() => this.sendUpdate(), 2000);

		// Periodic updates
		this.intervalId = setInterval(() => this.sendUpdate(), 5000);

		// Setup video event listeners
		this.setupVideoListeners();

		// Watch for SPA navigation
		this.watchNavigation();
	}

	cleanup(): void {
		if (this.intervalId) {
			clearInterval(this.intervalId);
			this.intervalId = null;
		}
	}

	private getVideo(): HTMLVideoElement | null {
		if (!this.video || !document.contains(this.video)) {
			if (this.video) {
				this.video.removeEventListener('play', this.onVideoEvent);
				this.video.removeEventListener('pause', this.onVideoEvent);
				this.video.removeEventListener('seeked', this.onVideoEvent);
			}
			this.video = document.querySelector('video');
		}
		return this.video;
	}

	private getVideoTitle(): string | null {
		const titleElement = document.querySelector(
			'h1.ytd-video-primary-info-renderer yt-formatted-string, h1.ytd-watch-metadata yt-formatted-string',
		) as HTMLElement | null;
		const title = titleElement?.textContent?.trim();
		if (title) return title;

		// Fallback: document.title updates early during SPA navigation
		// ("Video Title - YouTube"), and is always present once the page settled.
		const docTitle = document.title.replace(/\s*-\s*YouTube\s*$/i, '').trim();
		return docTitle.length > 0 ? docTitle : null;
	}

	private getChannelName(): string | null {
		const channelElement = document.querySelector(
			'#channel-name yt-formatted-string a, ytd-channel-name yt-formatted-string a',
		) as HTMLAnchorElement | null;
		const channel = channelElement?.textContent?.trim();
		return channel && channel.length > 0 ? channel : null;
	}

	private isLiveStream(): boolean {
		return !!document.querySelector('.ytp-live-badge[disabled]');
	}

	private sendUpdate(): void {
		if (!this.shouldActivate()) {
			clearPresence();
			return;
		}

		const presence = this.getPresence();
		if (!presence) {
			// Metadata not ready yet (SPA transition) - keep the last good presence
			console.log('[YouTube Provider] Metadata not ready, skipping update');
			return;
		}

		const state = this.getState();
		sendPresenceToBackground(this.config.clientId, presence, state.isPlaying ?? false);
	}

	private setupVideoListeners(): void {
		const setup = () => {
			const video = this.getVideo();
			if (video) {
				video.addEventListener('play', this.onVideoEvent);
				video.addEventListener('pause', this.onVideoEvent);
				video.addEventListener('seeked', this.onVideoEvent);
				console.log('[YouTube Provider] Video listeners attached');
			} else {
				setTimeout(setup, 1000);
			}
		};
		setup();
	}

	private readonly onVideoEvent = (): void => {
		this.sendUpdate();
	};

	private watchNavigation(): void {
		this.lastUrl = location.href;

		new MutationObserver(() => {
			if (location.href !== this.lastUrl) {
				this.lastUrl = location.href;
				console.log('[YouTube Provider] Navigation detected');

				// Reset video reference and live start time
				this.video = null;
				this.liveStartTime = null;

				setTimeout(() => {
					this.setupVideoListeners();
					this.sendUpdate();
				}, 1500);
			}
		}).observe(document.body, { childList: true, subtree: true });
	}
}

// Export singleton instance
export const youtubeProvider = new YouTubeProvider();
