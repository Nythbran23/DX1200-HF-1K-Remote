# Gemini DX1200 Amplifier Monitor

Cross-platform desktop application for remote monitoring and control of DX Shop Gemini amplifiers.

## Installation

1. Install dependencies:
```bash
npm install
```

2. Run the application:
```bash
npm start
```

3. Build for distribution:
```bash
npm run build
```

## Usage

1. Enter your amplifier's IP address, port (9100), and password
2. Click Connect
3. Monitor real-time status and control your amplifier

## Features

- Real-time power, VSWR, current, and temperature monitoring
- Remote control (Run/Standby, Power levels, Band selection)
- Auto-reconnect on connection loss
- Communication log with TX/RX display
- Password authentication

## Protocol

Implements the Gemini Network Protocol as specified in NetworkConnectionProtocol_3.pdf

For more information, visit: thedxshop.com
