/**
 * TIDAL Content Script
 *
 * This content script uses the TIDAL provider to detect
 * music playback and send presence updates to the background script.
 */

import { tidalProvider } from './content-scripts/providers/index.js';

export default defineContentScript({
	matches: ['*://*.tidal.com/*'],
	runAt: 'document_idle',
	main() {
		tidalProvider.init();
	},
});
