# Building Gemini DX1200 Monitor for Distribution

## Quick Build Commands

### On Mac (builds all Mac versions)
```bash
cd ~/gemini-monitor
npm install
npm run build:mac
```

Outputs in `dist/`:
- Gemini DX1200 Monitor-1.0.0-alpha-arm64.dmg (Apple Silicon)
- Gemini DX1200 Monitor-1.0.0-alpha-x64.dmg (Intel)

### Build All Platforms
```bash
npm run build
```

Creates packages for macOS, Windows, and Linux.
