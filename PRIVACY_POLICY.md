# Privacy Policy — Discord Presence Bridge

**Last updated:** March 25, 2026

## Overview

Discord Presence Bridge is a browser extension that displays your current browser activity as Discord Rich Presence status. This policy explains what data the extension accesses, how it is used, and your rights.

## Data Accessed

The extension accesses the following data **locally on your device**:

- **Active tab URL and title** — used to determine what site you are visiting and whether a supported presence is available.
- **Media playback state** — on supported sites (YouTube, GeoGuessr), content scripts detect video/game details such as title, channel name, and playback status.
- **User preferences** — your list of disabled domains is stored in Chrome sync storage.

## How Data Is Used

All accessed data is used **exclusively** to display your current activity as Discord Rich Presence. Activity data is sent only to a **local companion application** running on your machine (`localhost`) via WebSocket. No data is transmitted to any external server, third party, or cloud service.

## Data Collection

This extension **does not collect, store, or transmit** any personal data externally. Specifically:

- No analytics or telemetry
- No tracking or advertising
- No data sold or shared with third parties
- No accounts or authentication required
- No cookies used

## Permissions

| Permission | Purpose |
|---|---|
| `tabs` | Detect the active tab's URL and title for presence display |
| `storage` | Save user preferences (disabled domains) |
| Host access (YouTube, GeoGuessr) | Run content scripts to detect media/game activity on supported sites |

## Data Retention

No user data is retained. Activity state exists only in memory while the extension is running and is discarded when the browser closes or the extension is disabled.

## Your Control

- You can disable presence for specific domains via the extension popup.
- You can uninstall the extension at any time to stop all data access.

## Changes

If this policy changes, the updated version will be posted in the GitHub repository.

## Contact

For questions or concerns, open an issue at: https://github.com/SmookeyDev/discord-presence-bridge/issues

## Source Code

This extension is open source: https://github.com/SmookeyDev/discord-presence-bridge
