# Building from Source

Instructions for building Discord Presence Bridge from source.

---

## Prerequisites

| Requirement | Version |
|-------------|---------|
| [Bun](https://bun.sh/) | 1.1.42+ |
| [Node.js](https://nodejs.org/) | 20+ |

---

## Quick Start

```bash
# Clone repository
git clone https://github.com/SmookeyDev/discord-presence-bridge.git
cd discord-presence-bridge

# Install dependencies
bun install

# Build everything
bun run build
```

---

## Build Commands

| Command | Description |
|---------|-------------|
| `bun run build` | Build all packages (extension + server) |
| `bun run build:extension` | Build only browser extension |
| `bun run build:server` | Build only desktop server |
| `bun run dev` | Development mode with hot reload |

---

## Output Locations

After building, files are located at:

| Package | Output |
|---------|--------|
| Chrome Extension | `apps/extension/.output/chrome-mv3/` |
| Firefox Extension | `apps/extension/.output/firefox-mv2/` |
| Server | `apps/server/dist/` |

---

## Compiling Server Executable

To create a standalone executable:

```bash
cd apps/server
bun run build:compile
```

Executables will be in `apps/server/dist/`:
- `discord-presence-bridge-linux`
- `discord-presence-bridge-win.exe`
- `discord-presence-bridge-macos`

---

## Development Mode

Run both extension and server in development mode:

```bash
# All packages
bun run dev

# Only extension (with hot reload)
bun run dev:extension

# Only server
bun run dev:server
```

---

## Troubleshooting

### Bun not found
Install Bun: `curl -fsSL https://bun.sh/install | bash`

### Node modules issues
```bash
rm -rf node_modules
bun install
```

### Build cache issues
```bash
bun run clean
bun install
bun run build
```
