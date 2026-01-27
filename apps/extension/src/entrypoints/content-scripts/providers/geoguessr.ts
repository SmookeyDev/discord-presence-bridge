import {
	BaseProvider,
	type PresenceData,
	type ProviderConfig,
	type ProviderState,
	clearPresence,
	sendPresenceToBackground,
} from './base.js';

export class GeoGuessrProvider extends BaseProvider {
	readonly config: ProviderConfig = {
		// GeoGuessr Discord Application ID
		clientId: '1324155732198686820',
		name: 'GeoGuessr',
		matches: ['*://*.geoguessr.com/*'],
	};

	private intervalId: ReturnType<typeof setInterval> | null = null;
	private lastUrl = '';
	private startTime: number | null = null;

	shouldActivate(): boolean {
		// Activate on game pages
		const path = window.location.pathname;
		return (
			path.includes('/game/') ||
			path.includes('/battle-royale/') ||
			path.includes('/duels/') ||
			path.includes('/team-duels/') ||
			path.includes('/bullseye/') ||
			path.includes('/live-challenge/') ||
			path.includes('/streaks/')
		);
	}

	getState(): ProviderState {
		return {
			isActive: this.shouldActivate(),
			isPlaying: this.isInGame(),
		};
	}

	getPresence(): PresenceData | null {
		if (!this.shouldActivate()) return null;

		const gameMode = this.getGameMode();
		const mapName = this.getMapName();
		const roundInfo = this.getRoundInfo();
		const score = this.getScore();
		const health = this.getHealth();
		const streak = this.getStreak();
		const playersInfo = this.getPlayersInfo();
		const timeLimit = this.getTimeLimit();

		const presence: PresenceData = {
			details: gameMode,
			largeImageKey: 'geoguessr',
			largeImageText: 'GeoGuessr',
		};

		// Build state text with available metrics
		const stateParts: string[] = [];

		// Add round info
		if (roundInfo) {
			stateParts.push(roundInfo);
		}

		// Add score if available
		if (score) {
			stateParts.push(`${this.formatScore(score)} pts`);
		}

		// Add streak for Streaks mode
		if (streak !== null && gameMode === 'Streaks') {
			stateParts.push(`Streak: ${streak}`);
		}

		// Add health for Battle Royale
		if (health !== null && gameMode === 'Battle Royale') {
			stateParts.push(`Health: ${health}%`);
		}

		// Add players info for multiplayer
		if (
			playersInfo &&
			(gameMode === 'Battle Royale' || gameMode === 'Duels' || gameMode === 'Team Duels')
		) {
			stateParts.push(playersInfo);
		}

		// Add time limit if available
		if (timeLimit) {
			stateParts.push(`⏱ ${timeLimit}`);
		}

		// Fallback to map name if no other info
		if (stateParts.length === 0 && mapName) {
			stateParts.push(mapName);
		}

		// Join all parts with separator
		if (stateParts.length > 0) {
			presence.state = stateParts.join(' • ').slice(0, 128);
		}

		// Add playing indicator
		if (this.isInGame()) {
			presence.smallImageKey = 'playing';
			presence.smallImageText = 'Playing';

			// Add start timestamp if we have one
			if (this.startTime) {
				presence.startTimestamp = this.startTime;
			}
		} else {
			presence.smallImageKey = 'lobby';
			presence.smallImageText = 'In Lobby';
		}

		return presence;
	}

	private formatScore(score: string): string {
		// Format score with thousands separator
		const num = Number.parseInt(score, 10);
		if (Number.isNaN(num)) return score;
		return num.toLocaleString('en-US');
	}

	init(): void {
		console.log('[GeoGuessr Provider] Initializing');

		// Set start time when entering a game
		if (this.shouldActivate()) {
			this.startTime = Date.now();
		}

		// Initial check after page loads
		setTimeout(() => this.sendUpdate(), 2000);

		// Periodic updates
		this.intervalId = setInterval(() => this.sendUpdate(), 5000);

		// Watch for SPA navigation
		this.watchNavigation();
	}

	cleanup(): void {
		if (this.intervalId) {
			clearInterval(this.intervalId);
			this.intervalId = null;
		}
		this.startTime = null;
	}

	private getGameMode(): string {
		const path = window.location.pathname;

		if (path.includes('/battle-royale/')) {
			return 'Battle Royale';
		}
		if (path.includes('/duels/')) {
			return 'Duels';
		}
		if (path.includes('/team-duels/')) {
			return 'Team Duels';
		}
		if (path.includes('/bullseye/')) {
			return 'Bullseye';
		}
		if (path.includes('/live-challenge/')) {
			return 'Live Challenge';
		}
		if (path.includes('/streaks/')) {
			return 'Streaks';
		}
		if (path.includes('/game/')) {
			return 'Single Player';
		}

		return 'GeoGuessr';
	}

	private getMapName(): string | null {
		// Try to get map name from various elements
		const mapElement = document.querySelector(
			'[data-qa="map-name"], .map-name, .game-info__map-name',
		) as HTMLElement | null;

		if (mapElement?.textContent) {
			return mapElement.textContent.trim();
		}

		// Try header/title elements
		const headerElement = document.querySelector(
			'.header__title, .game-header__title, [class*="map-title"]',
		) as HTMLElement | null;

		if (headerElement?.textContent) {
			return headerElement.textContent.trim();
		}

		return null;
	}

	private getRoundInfo(): string | null {
		// Try to get round info (e.g., "Round 3/5")
		const roundElement = document.querySelector(
			'[data-qa="round-number"], .game-status__round, [class*="round-number"], [class*="game-round"]',
		) as HTMLElement | null;

		if (roundElement?.textContent) {
			let roundText = roundElement.textContent.trim();
			// Fix formatting: ensure space after "Round" (e.g., "Round1" -> "Round 1")
			roundText = roundText.replace(/Round(\d)/i, 'Round $1');
			// Normalize spacing around slashes
			roundText = roundText.replace(/\s*\/\s*/g, ' / ');
			return roundText;
		}

		return null;
	}

	private getScore(): string | null {
		// Try multiple selectors for score
		const scoreSelectors = [
			'[data-qa="score"]',
			'.game-status__score',
			'[class*="score-bar"]',
			'[class*="total-score"]',
			'[class*="points"]',
		];

		for (const selector of scoreSelectors) {
			const element = document.querySelector(selector) as HTMLElement | null;
			if (element?.textContent) {
				const score = element.textContent.trim();
				// Extract numbers from score text
				const match = score.match(/[\d,\.]+/);
				if (match) {
					return match[0].replace(/,/g, '');
				}
			}
		}

		return null;
	}

	private getHealth(): number | null {
		// For Battle Royale mode - get health/lives
		const healthBar = document.querySelector(
			'[class*="health-bar"], [class*="lives"], [class*="hearts"]',
		) as HTMLElement | null;

		if (healthBar) {
			// Try to get from width percentage
			const style = healthBar.getAttribute('style');
			if (style) {
				const widthMatch = style.match(/width:\s*([\d.]+)%/);
				if (widthMatch?.[1]) {
					return Math.round(Number.parseFloat(widthMatch[1]));
				}
			}

			// Try to count heart/life icons
			const hearts = healthBar.querySelectorAll('[class*="heart"], [class*="life"]');
			if (hearts.length > 0) {
				const activeHearts = healthBar.querySelectorAll(
					'[class*="heart"]:not([class*="empty"]), [class*="life"]:not([class*="lost"])',
				);
				return activeHearts.length;
			}
		}

		return null;
	}

	private getStreak(): number | null {
		// For Streaks mode
		const streakElement = document.querySelector(
			'[class*="streak-count"], [class*="streak-number"], [data-qa="streak"]',
		) as HTMLElement | null;

		if (streakElement?.textContent) {
			const match = streakElement.textContent.match(/\d+/);
			if (match) {
				return Number.parseInt(match[0], 10);
			}
		}

		return null;
	}

	private getPlayersInfo(): string | null {
		// For multiplayer modes - get player count or position
		const playersElement = document.querySelector(
			'[class*="player-count"], [class*="players-remaining"], [class*="leaderboard"]',
		) as HTMLElement | null;

		if (playersElement?.textContent) {
			const text = playersElement.textContent.trim();
			const match = text.match(/\d+/);
			if (match) {
				return `${match[0]} players`;
			}
		}

		return null;
	}

	private getTimeLimit(): string | null {
		// Get time limit if visible
		const timerElement = document.querySelector(
			'[class*="timer"], [class*="time-left"], [class*="countdown"]',
		) as HTMLElement | null;

		if (timerElement?.textContent) {
			const text = timerElement.textContent.trim();
			// Check if it looks like a time (contains numbers and possibly colons)
			if (/\d/.test(text) && (text.includes(':') || text.includes('s'))) {
				return text;
			}
		}

		return null;
	}

	private isInGame(): boolean {
		// Check if we're actively in a game (not in results/summary)
		const gameCanvas = document.querySelector(
			'.game-layout__canvas, [class*="panorama"], .game_canvas',
		);
		const resultsScreen = document.querySelector(
			'.result-layout, [class*="result"], .game-summary',
		);

		return !!gameCanvas && !resultsScreen;
	}

	private sendUpdate(): void {
		if (!this.shouldActivate()) {
			clearPresence();
			this.startTime = null;
			return;
		}

		// Set start time if not set
		if (!this.startTime) {
			this.startTime = Date.now();
		}

		const presence = this.getPresence();
		if (!presence) return;

		const state = this.getState();
		sendPresenceToBackground(this.config.clientId, presence, state.isPlaying ?? false);
	}

	private watchNavigation(): void {
		this.lastUrl = location.href;

		new MutationObserver(() => {
			if (location.href !== this.lastUrl) {
				this.lastUrl = location.href;
				console.log('[GeoGuessr Provider] Navigation detected');

				// Reset start time on navigation
				if (this.shouldActivate()) {
					this.startTime = Date.now();
				} else {
					this.startTime = null;
				}

				setTimeout(() => this.sendUpdate(), 1500);
			}
		}).observe(document.body, { childList: true, subtree: true });
	}
}

// Export singleton instance
export const geoguessrProvider = new GeoGuessrProvider();
