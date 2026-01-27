/**
 * YouTube Content Script
 *
 * This content script uses the YouTube provider to detect
 * video playback and send presence updates to the background script.
 */

import { youtubeProvider } from './content-scripts/providers/index.js';

export default defineContentScript({
	matches: ['*://*.youtube.com/*'],
	runAt: 'document_idle',
	main() {
		youtubeProvider.init();
	},
});
