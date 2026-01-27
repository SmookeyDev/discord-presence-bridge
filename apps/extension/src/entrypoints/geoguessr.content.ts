/**
 * GeoGuessr Content Script
 *
 * This content script uses the GeoGuessr provider to detect
 * game activity and send presence updates to the background script.
 */

import { geoguessrProvider } from './content-scripts/providers/index.js';

export default defineContentScript({
	matches: ['*://*.geoguessr.com/*'],
	runAt: 'document_idle',
	main() {
		geoguessrProvider.init();
	},
});
