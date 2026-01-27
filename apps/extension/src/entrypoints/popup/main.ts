import type { PopupResponseData, Presence } from '../../common/types/index.js';

// Lucide Icons as SVG strings
const icons = {
	// Services
	youtube: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><path d="m10 15 5-3-5-3z"/></svg>`,
	globe: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>`,
	tv: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="15" x="2" y="7" rx="2" ry="2"/><polyline points="17 2 12 7 7 2"/></svg>`,
	music: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`,
	film: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 3v18"/><path d="M3 7.5h4"/><path d="M3 12h18"/><path d="M3 16.5h4"/><path d="M17 3v18"/><path d="M17 7.5h4"/><path d="M17 16.5h4"/></svg>`,
	headphones: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/></svg>`,
	gamepad: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="6" x2="10" y1="12" y2="12"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="15" x2="15.01" y1="13" y2="13"/><line x1="18" x2="18.01" y1="11" y2="11"/><rect width="20" height="12" x="2" y="6" rx="2"/></svg>`,

	// Status icons
	play: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="6 3 20 12 6 21 6 3"/></svg>`,
	pause: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`,
	live: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"/><circle cx="12" cy="12" r="2" fill="currentColor"/><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"/><path d="M19.1 4.9C23 8.8 23 15.1 19.1 19"/></svg>`,
	playing: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8" fill="currentColor"/></svg>`,
	lobby: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,

	// UI icons
	clock: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
	plug: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z"/></svg>`,
	moon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`,
	eyeOff: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"/><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"/><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"/><path d="m2 2 20 20"/></svg>`,
	eye: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>`,
	download: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>`,
	github: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>`,
	warning: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`,
	discord: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>`,
};

interface ApiState {
	disabledDomains: string[];
}

let api: ApiState = { disabledDomains: [] };

function escapeHtml(str: string): string {
	const div = document.createElement('div');
	div.textContent = str;
	return div.innerHTML;
}

function formatElapsedTime(startTimestamp: number): string {
	const elapsed = Math.floor((Date.now() - startTimestamp) / 1000);
	const hours = Math.floor(elapsed / 3600);
	const minutes = Math.floor((elapsed % 3600) / 60);
	const seconds = elapsed % 60;

	if (hours > 0) {
		return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
	}
	return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function getServiceIcon(domain: string): string {
	const serviceIcons: Record<string, string> = {
		'youtube.com': icons.youtube,
		'geoguessr.com': icons.globe,
		'twitch.tv': icons.tv,
		'spotify.com': icons.music,
		'netflix.com': icons.film,
		'soundcloud.com': icons.headphones,
	};

	for (const [key, icon] of Object.entries(serviceIcons)) {
		if (domain.includes(key)) return icon;
	}
	return icons.gamepad;
}

function getSmallImageIcon(key?: string): string {
	const statusIcons: Record<string, string> = {
		play: icons.play,
		pause: icons.pause,
		live: icons.live,
		playing: icons.playing,
		lobby: icons.lobby,
	};
	return statusIcons[key || ''] || icons.playing;
}

function getServiceName(domain: string, presenceDetails?: string): string {
	const services: Record<string, string> = {
		'youtube.com': 'YouTube',
		'geoguessr.com': 'GeoGuessr',
		'twitch.tv': 'Twitch',
		'spotify.com': 'Spotify',
		'netflix.com': 'Netflix',
		'soundcloud.com': 'SoundCloud',
	};

	for (const [key, name] of Object.entries(services)) {
		if (domain.includes(key)) return name;
	}
	return presenceDetails || domain;
}

function renderDisabledSites(domains: string[], currentDomain: string): string {
	const otherDomains = domains.filter((d) => d !== currentDomain);
	if (otherDomains.length === 0) return '';

	const chips = otherDomains
		.map(
			(domain) => `
		<button class="site-chip disabled" data-domain="${escapeHtml(domain)}" title="Click to enable ${escapeHtml(domain)}">
			<img src="https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32" alt="">
			<span>${escapeHtml(domain.replace('www.', '').split('/')[0] ?? domain)}</span>
		</button>
	`,
		)
		.join('');

	return `
		<div class="disabled-sites">
			<div class="disabled-sites-header">Disabled Sites</div>
			<div class="disabled-sites-list">${chips}</div>
		</div>
	`;
}

function fillUi(): void {
	chrome.runtime.sendMessage('', (presence: PopupResponseData) => {
		console.log('Fill UI:', presence);

		const mainEl = document.getElementById('main');
		if (!mainEl) return;

		let domain = '';
		if (presence.state) {
			domain = presence.state.tabInfo.domain;
		}

		let html = '';

		// Outdated client warning
		if (!presence.clientIsUpToDate) {
			html += `
				<div class="alert alert-warning">
					<span class="alert-icon">${icons.warning}</span>
					<div class="alert-content">
						<div class="alert-title">Update Available</div>
						<div class="alert-text">
							Desktop client is outdated.
							<a href="https://github.com/SmookeyDev/discord-presence-bridge/releases/latest" target="_blank">Download latest version</a>
						</div>
					</div>
				</div>
			`;
		}

		// Connection status
		if (!presence.websocket) {
			html += `
				<div class="status">
					<div class="status-dot disconnected"></div>
					<span class="status-text"><strong>Disconnected</strong> - Server not running</span>
				</div>
				<div class="no-presence">
					<div class="no-presence-icon">${icons.plug}</div>
					<h3>No Connection</h3>
					<p>Download and run the desktop app to enable Rich Presence</p>
				</div>
				<a class="btn" href="https://github.com/SmookeyDev/discord-presence-bridge/releases/latest" target="_blank">
					${icons.download}
					Download Desktop App
				</a>
			`;
		} else if (presence.state) {
			const presenceData = presence.state.presence as Presence;
			const isDisabled = api.disabledDomains.includes(domain);
			const serviceName = getServiceName(domain, presenceData.largeImageText);
			const serviceIcon = getServiceIcon(domain);

			html += `
				<div class="status">
					<div class="status-dot connected"></div>
					<span class="status-text"><strong>Connected</strong> - Showing activity</span>
				</div>
			`;

			// Presence card
			html += `
				<div class="presence-card">
					<div class="presence-header">
						<span class="presence-title">Current Activity</span>
						<button class="toggle-btn ${isDisabled ? 'inactive' : 'active'}" data-domain="${escapeHtml(domain)}" title="${isDisabled ? 'Enable' : 'Disable'} presence for ${escapeHtml(domain)}">
							${isDisabled ? icons.eyeOff : icons.eye}
						</button>
					</div>
					<div class="presence-body">
						<div class="presence-image">
							<span class="fallback-icon">${serviceIcon}</span>
							${presenceData.smallImageText ? `<div class="small-image" title="${escapeHtml(presenceData.smallImageText)}">${getSmallImageIcon(presenceData.smallImageKey)}</div>` : ''}
						</div>
						<div class="presence-info">
							<div class="presence-name">${escapeHtml(serviceName)}</div>
							${presenceData.details ? `<div class="presence-details" title="${escapeHtml(presenceData.details)}">${escapeHtml(presenceData.details)}</div>` : ''}
							${presenceData.state ? `<div class="presence-state" title="${escapeHtml(presenceData.state)}">${escapeHtml(presenceData.state)}</div>` : ''}
							${
								presenceData.startTimestamp
									? `
								<div class="presence-time" data-start="${presenceData.startTimestamp}">
									${icons.clock}
									<span class="elapsed-time">${formatElapsedTime(presenceData.startTimestamp)}</span> elapsed
								</div>
							`
									: ''
							}
						</div>
					</div>
				</div>
			`;

			// Disabled sites
			html += renderDisabledSites(api.disabledDomains, domain);
		} else {
			html += `
				<div class="status">
					<div class="status-dot connected"></div>
					<span class="status-text"><strong>Connected</strong> - Ready</span>
				</div>
				<div class="no-presence">
					<div class="no-presence-icon">${icons.moon}</div>
					<h3>No Presence Active</h3>
					<p>Visit a supported site to show your activity</p>
				</div>
			`;

			// Disabled sites
			html += renderDisabledSites(api.disabledDomains, '');
		}

		mainEl.innerHTML = html;

		// Update elapsed time every second
		const elapsedEl = mainEl.querySelector('.elapsed-time');
		const timeContainer = mainEl.querySelector('.presence-time');
		if (elapsedEl && timeContainer) {
			const startTimestamp = Number.parseInt(timeContainer.getAttribute('data-start') || '0', 10);
			if (startTimestamp > 0) {
				setInterval(() => {
					elapsedEl.textContent = formatElapsedTime(startTimestamp);
				}, 1000);
			}
		}
	});
}

function toggleDomain(domain: string): void {
	if (api.disabledDomains.includes(domain)) {
		api.disabledDomains = api.disabledDomains.filter((e) => e !== domain);
	} else {
		api.disabledDomains.push(domain);
	}
	chrome.storage.sync.set({ disabledDomains: api.disabledDomains });
}

// Initialize
chrome.storage.sync.get(['disabledDomains'], (result = {}) => {
	api = {
		disabledDomains: result?.disabledDomains ?? [],
	};

	chrome.storage.onChanged.addListener((changes, namespace) => {
		console.log('Storage changed:', changes);
		if (namespace === 'sync') {
			for (const key in changes) {
				if (key === 'disabledDomains') {
					api.disabledDomains = changes[key]?.newValue ?? [];
				}
			}
		}
		fillUi();
	});

	console.log('Disabled domains:', api.disabledDomains);
	fillUi();

	document.addEventListener('click', (e) => {
		const target = e.target as HTMLElement;

		// Handle toggle button
		const toggleBtn = target.closest('.toggle-btn') as HTMLButtonElement | null;
		if (toggleBtn) {
			const domain = toggleBtn.dataset.domain;
			if (domain) toggleDomain(domain);
			return;
		}

		// Handle site chip
		const siteChip = target.closest('.site-chip') as HTMLButtonElement | null;
		if (siteChip) {
			const domain = siteChip.dataset.domain;
			if (domain) toggleDomain(domain);
		}
	});
});
