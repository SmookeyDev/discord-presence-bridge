/**
 * Presence Providers Registry
 *
 * Add new providers here to enable presence detection for more services.
 * Each provider should extend BaseProvider and implement the required methods.
 */

export { BaseProvider, formatDuration, sendPresenceToBackground, clearPresence } from './base.js';
export type { PresenceData, ProviderConfig, ProviderState } from './base.js';

export { YouTubeProvider, youtubeProvider } from './youtube.js';
export { GeoGuessrProvider, geoguessrProvider } from './geoguessr.js';

// Future providers:
// export { TwitchProvider, twitchProvider } from './twitch.js';
// export { SpotifyProvider, spotifyProvider } from './spotify.js';
// export { NetflixProvider, netflixProvider } from './netflix.js';
// export { SoundCloudProvider, soundcloudProvider } from './soundcloud.js';
