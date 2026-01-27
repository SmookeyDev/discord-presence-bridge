# External API

Discord Presence Bridge exposes an API for other extensions to send presence data. This allows third-party extensions to integrate with Discord Rich Presence.

> **Note:** For most use cases, consider creating a [built-in provider](../README.md#adding-providers) instead, which is simpler and doesn't require users to install multiple extensions.

---

## Table of Contents

- [Overview](#overview)
- [Extension IDs](#extension-ids)
- [Registration](#registration)
- [Presence Listener](#presence-listener)
- [Background Script](#background-script)
- [Party Support](#party-support)
- [Examples](#examples)

---

## Overview

The API consists of two parts:

1. **Registration** - Tell Discord Presence Bridge that your extension exists
2. **Presence Listener** - Respond to presence requests with your data

Both must be implemented in your content script.

---

## Extension IDs

You need the Discord Presence Bridge extension ID to communicate with it:

```javascript
// Detect browser and set extension ID
let extensionId = "agnaejlkbiiggajjmnpmeheigkflbnoo"; // Chrome

if (typeof browser !== 'undefined' && typeof chrome !== 'undefined') {
  extensionId = "{57081fef-67b4-482f-bcb0-69296e63ec4f}"; // Firefox
}
```

---

## Registration

Register your extension so Discord Presence Bridge knows it exists:

```javascript
chrome.runtime.sendMessage(extensionId, { mode: 'active' }, (response) => {
  console.log('Presence registered');
});
```

### Registration Modes

| Mode | Description |
|------|-------------|
| `active` | Presence only shows when tab is focused |
| `passive` | Presence shows even when tab is not focused (e.g., music player) |

> **Note:** Active mode presences have priority over passive ones.

### Forcing Updates

Registration only needs to be called once, but you can call it again to force an immediate presence update (normally updates every 15 seconds).

---

## Presence Listener

Respond to presence requests from Discord Presence Bridge:

```javascript
chrome.runtime.onMessage.addListener((info, sender, sendResponse) => {
  console.log('Presence requested', info);

  sendResponse({
    clientId: '606504719212478504',
    presence: {
      details: 'Watching a video',
      state: 'On My Service',
      startTimestamp: Date.now(),
      largeImageKey: 'logo',
      largeImageText: 'My Service',
      smallImageKey: 'play',
      smallImageText: 'Playing',
    }
  });
});
```

### Parameters

| Field | Type | Description |
|-------|------|-------------|
| `clientId` | string | Your Discord Application ID ([create one here](https://discord.com/developers/applications)) |
| `presence` | object | Discord presence object ([see fields](https://discord.com/developers/docs/rich-presence/how-to)) |

### Presence Fields

| Field | Type | Description |
|-------|------|-------------|
| `details` | string | First line of presence (max 128 chars) |
| `state` | string | Second line of presence (max 128 chars) |
| `startTimestamp` | number | Unix timestamp for "elapsed" time |
| `endTimestamp` | number | Unix timestamp for "remaining" time |
| `largeImageKey` | string | Large image asset name |
| `largeImageText` | string | Large image tooltip |
| `smallImageKey` | string | Small image asset name |
| `smallImageText` | string | Small image tooltip |

> **Important:** The listener must always return a response. To keep registration without showing presence, return an empty object `{}`.

---

## Background Script

Add this to your background script to forward requests to content scripts:

```javascript
chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
  if (request.action === 'presence') {
    chrome.tabs.sendMessage(request.tab, request.info, (response) => {
      sendResponse(response);
    });
  }
  return true;
});
```

---

## Party Support

Enable Discord party invitations for multiplayer features.

### Party Registration

Register party support in your background script:

```javascript
chrome.runtime.sendMessage(extensionId, {
  action: 'party',
  clientId: '606504719212478504'
}, (response) => {
  console.log('Party registered', response);
});
```

### Party Presence

Add party fields to your presence:

```javascript
{
  clientId: '606504719212478504',
  presence: {
    details: 'In a party',
    state: 'Playing together',
    partyId: 'unique-party-id',
    partySize: 2,
    partyMax: 4,
    joinSecret: '/room/abc123', // Used to join the party
  }
}
```

### Join Request Handler

Handle when users click "Join" in Discord:

```javascript
chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
  if (request.action === 'join') {
    // Open tab with the join secret
    chrome.tabs.create({
      url: 'https://example.com' + request.secret
    });
  }
  return true;
});
```

> **Security:** Only include the URL path in `joinSecret`, not the full URL. Add the domain in your handler.

---

## Examples

Check the [examples folder](../examples/) for complete working implementations:

- **ActiveTab** - Basic active tab presence
- **PassiveTab** - Background music player style
- **Background** - Background-only extension
- **Party** - Multiplayer party support

---

## Support

- [GitHub Issues](https://github.com/SmookeyDev/discord-presence-bridge/issues) - Bug reports and questions
