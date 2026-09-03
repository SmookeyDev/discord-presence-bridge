/**
 * Spotify Content Script
 *
 * This content script uses the Spotify provider to detect
 * music playback and send presence updates to the background script.
 */

import { spotifyProvider } from './content-scripts/providers/index.js';

export default defineContentScript({
	matches: ['*://open.spotify.com/*'],
	runAt: 'document_idle',
	main() {
		spotifyProvider.init();
	},
});
