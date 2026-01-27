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
				presence.startTimestamp = Date.now();
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
			this.video = document.querySelector('video');
		}
		return this.video;
	}

	private getVideoTitle(): string {
		const titleElement = document.querySelector(
			'h1.ytd-video-primary-info-renderer yt-formatted-string, h1.ytd-watch-metadata yt-formatted-string',
		) as HTMLElement | null;
		return titleElement?.textContent?.trim() ?? 'Unknown Video';
	}

	private getChannelName(): string {
		const channelElement = document.querySelector(
			'#channel-name yt-formatted-string a, ytd-channel-name yt-formatted-string a',
		) as HTMLAnchorElement | null;
		return channelElement?.textContent?.trim() ?? 'Unknown Channel';
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
		if (!presence) return;

		const state = this.getState();
		sendPresenceToBackground(this.config.clientId, presence, state.isPlaying ?? false);
	}

	private setupVideoListeners(): void {
		const setup = () => {
			const video = this.getVideo();
			if (video) {
				video.addEventListener('play', () => this.sendUpdate());
				video.addEventListener('pause', () => this.sendUpdate());
				video.addEventListener('seeked', () => this.sendUpdate());
				console.log('[YouTube Provider] Video listeners attached');
			} else {
				setTimeout(setup, 1000);
			}
		};
		setup();
	}

	private watchNavigation(): void {
		this.lastUrl = location.href;

		new MutationObserver(() => {
			if (location.href !== this.lastUrl) {
				this.lastUrl = location.href;
				console.log('[YouTube Provider] Navigation detected');

				// Reset video reference
				this.video = null;

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
