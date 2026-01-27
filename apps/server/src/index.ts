import { VERSION } from '@discord-rpc/shared-types';
import { logger } from './common/utils/logger.js';
import { config } from './config/env.config.js';
import { createTrayService } from './modules/tray/services/tray.service.js';
import { WebSocketController } from './modules/websocket/websocket.controller.js';

logger.info(`Starting Discord RPC Server v${VERSION}`);
logger.debug('Configuration:', config);

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
	logger.error('Uncaught Exception:', error);
	setTimeout(() => {
		process.exit(99);
	}, 10000);
});

process.on('unhandledRejection', (reason) => {
	logger.error('Unhandled Rejection:', reason);
});

// Initialize WebSocket server
const wsController = new WebSocketController();

// Initialize system tray
const tray = createTrayService({
	onExit: async () => {
		logger.info('Shutting down...');
		await wsController.close();
		process.exit(0);
	},
});

tray.start();

// Handle graceful shutdown
async function shutdown(): Promise<void> {
	logger.info('Shutting down gracefully...');
	await tray.stop();
	await wsController.close();
	process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Keep process alive
process.stdin.resume();

logger.info(`WebSocket server ready on port ${config.port}`);
