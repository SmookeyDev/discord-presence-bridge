/**
 * Qobuz Content Script
 *
 * This content script uses the Qobuz provider to detect
 * music playback and send presence updates to the background script.
 */

import { qobuzProvider } from './content-scripts/providers/index.js';

export default defineContentScript({
	matches: ['*://play.qobuz.com/*'],
	runAt: 'document_idle',
	main() {
		qobuzProvider.init();
	},
});
