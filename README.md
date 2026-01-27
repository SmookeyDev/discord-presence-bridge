<div align="center">

# Discord Presence Bridge

Browser extension that bridges your web activity to Discord Rich Presence.

[![License](https://img.shields.io/badge/license-GPL--3.0-blue.svg)](LICENSE)
[![Bun](https://img.shields.io/badge/Bun-1.1.42+-black.svg)](https://bun.sh/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-blue.svg)](https://www.typescriptlang.org/)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)](#-installation)

</div>

---

## Table of Contents

- [About](#-about)
- [Features](#-features)
- [Requirements](#-requirements)
- [Installation](#-installation)
- [Usage](#-usage)
- [Development](#-development)
- [Adding Providers](#-adding-providers)
- [Support](#-support)

---

## About

Discord Presence Bridge allows you to display your browser activity as Discord Rich Presence. It consists of two parts:

1. **Browser Extension** - Detects activity on supported websites
2. **Desktop Server** - Bridges the extension to Discord's IPC

The extension uses a provider system that makes it easy to add support for new websites.

---

## Features

| Feature | Status |
|---------|--------|
| YouTube presence (video title, channel, progress) | ✅ |
| GeoGuessr presence (game mode, round, score) | ✅ |
| Live stream detection | ✅ |
| Play/Pause status | ✅ |
| Elapsed time tracking | ✅ |
| Per-site enable/disable | ✅ |
| Chrome & Firefox support | ✅ |
| Cross-platform server | ✅ |

---

## Requirements

### System Requirements

| Platform | Requirement |
|----------|-------------|
| Windows | Windows 10+ |
| macOS | macOS 10.15+ |
| Linux | Most distributions |
| Browser | Chrome, Firefox, or Chromium-based |

### Prerequisites

- [Discord](https://discord.com/) desktop app running
- Browser extension installed
- Desktop server running

---

## Installation

### 1. Browser Extension

#### Chrome / Chromium
1. Download the latest release from [Releases](https://github.com/SmookeyDev/discord-presence-bridge/releases/latest)
2. Extract `chrome-mv3.zip`
3. Go to `chrome://extensions`
4. Enable "Developer mode"
5. Click "Load unpacked" and select the extracted folder

#### Firefox
1. Download the latest release from [Releases](https://github.com/SmookeyDev/discord-presence-bridge/releases/latest)
2. Extract `firefox-mv2.zip`
3. Go to `about:debugging#/runtime/this-firefox`
4. Click "Load Temporary Add-on"
5. Select the `manifest.json` file

### 2. Desktop Server

Download the appropriate executable for your platform from [Releases](https://github.com/SmookeyDev/discord-presence-bridge/releases/latest).

| Platform | File |
|----------|------|
| Windows | `discord-presence-bridge-win.exe` |
| macOS | `discord-presence-bridge-macos` |
| Linux | `discord-presence-bridge-linux` |

> **Note:** Make sure Discord is running before starting the server.

---

## Usage

1. Start Discord
2. Run the desktop server (it will appear in your system tray)
3. Open a supported website (YouTube, GeoGuessr, etc.)
4. Your activity will appear on Discord!

### Extension Popup

Click the extension icon to:
- View connection status
- See current presence
- Enable/disable presence for specific sites

### Server Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 6969 | WebSocket server port |
| `TIMEOUT_MS` | 30000 | Presence timeout in milliseconds |
| `DEBUG` | false | Enable debug logging |
| `NO_TRAY` | false | Disable system tray |

---

## Development

### Prerequisites

- [Bun](https://bun.sh/) 1.1.42+
- [Node.js](https://nodejs.org/) 20+

### Setup

```bash
# Clone the repository
git clone https://github.com/SmookeyDev/discord-presence-bridge.git
cd discord-presence-bridge

# Install dependencies
bun install

# Build all packages
bun run build

# Development mode
bun run dev
```

### Project Structure

```
discord-presence-bridge/
├── apps/
│   ├── server/              # Desktop server application
│   └── extension/           # Browser extension (WXT)
├── packages/
│   └── shared-types/        # Shared TypeScript types
├── examples/                # Example integrations
└── docs/                    # Documentation
```

### Build Commands

| Command | Description |
|---------|-------------|
| `bun run build` | Build all packages (Chrome + Firefox) |
| `bun run build:server` | Build only server |
| `bun run build:extension` | Build only extension |
| `bun run dev` | Development mode with hot reload |
| `bun run lint` | Run linter |
| `bun run typecheck` | Type check all packages |

---

## Adding Providers

To add support for a new website, create a provider in `apps/extension/src/entrypoints/content-scripts/providers/`:

```typescript
import { BaseProvider, type PresenceData, type ProviderConfig } from './base.js';

export class MyProvider extends BaseProvider {
  readonly config: ProviderConfig = {
    clientId: 'YOUR_DISCORD_APP_ID',
    name: 'My Service',
    matches: ['*://*.myservice.com/*'],
  };

  shouldActivate(): boolean {
    return window.location.pathname.includes('/watch');
  }

  getPresence(): PresenceData | null {
    return {
      details: 'Watching something',
      state: 'On My Service',
      largeImageKey: 'myservice',
      largeImageText: 'My Service',
    };
  }

  // ... implement other methods
}
```

Then register it in `providers/index.ts` and create a content script entry point.

---

## Support

- [GitHub Issues](https://github.com/SmookeyDev/discord-presence-bridge/issues) - Bug reports and feature requests
- [API Documentation](https://github.com/SmookeyDev/discord-presence-bridge/blob/master/docs/api.md) - For extension developers

---

<div align="center">

Made with ❤️ by [SmookeyDev](https://github.com/SmookeyDev)

Inspired by [Discord-RPC-Extension](https://github.com/lolamtisch/Discord-RPC-Extension)

</div>
