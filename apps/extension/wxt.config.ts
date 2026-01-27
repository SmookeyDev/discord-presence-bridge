import { defineConfig } from 'wxt';

export default defineConfig({
	srcDir: 'src',
	outDir: '.output',
	manifest: {
		name: 'Discord Presence Bridge',
		description: 'Discord rich presence extension with open API.',
		version: '0.4.0',
		permissions: ['tabs', 'storage'],
		// Firefox-specific settings - ID fixo para desenvolvimento e produção
		browser_specific_settings: {
			gecko: {
				id: '{57081fef-67b4-482f-bcb0-69296e63ec4f}',
				strict_min_version: '109.0',
			},
		},
		action: {
			default_icon: {
				'16': '/icons/icon16.png',
				'32': '/icons/icon32.png',
				'48': '/icons/icon48.png',
				'128': '/icons/icon128.png',
			},
			default_popup: 'popup.html',
		},
		icons: {
			'16': '/icons/icon16.png',
			'32': '/icons/icon32.png',
			'48': '/icons/icon48.png',
			'128': '/icons/icon128.png',
			'512': '/icons/icon512.png',
		},
		content_security_policy: {
			extension_pages: "script-src 'self'; object-src 'self';",
		},
	},
	runner: {
		startUrls: ['https://example.com'],
	},
});
