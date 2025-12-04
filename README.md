# DX1200/HF-1K Remote Monitor v1.0α

**Professional remote monitoring and control application for Linear Amp UK DX1200 and HF-1K amplifiers.**

![Build Status](https://img.shields.io/badge/version-1.0.0--alpha-orange)
![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-blue)

---

## 📥 Download

**[Download Latest Release →](https://github.com/LinearAmpUK/DX1200-HF1K-Remote/releases/latest)**

Choose the file for your operating system:

### macOS
- **Apple Silicon (M1/M2/M3)**: `LinearAmpUK-DX1200-Monitor-*-arm64.dmg`
- **Intel Mac**: `LinearAmpUK-DX1200-Monitor-*-x64.dmg`

### Windows
- **Installer**: `LinearAmpUK-DX1200-Monitor-Setup-*.exe`
- **Portable** (no install): `LinearAmpUK-DX1200-Monitor-*.exe`

### Linux
- **Universal**: `LinearAmpUK-DX1200-Monitor-*.AppImage`
- **Debian/Ubuntu**: `linearampuk-dx1200-monitor_*_amd64.deb`

---

## 🚀 Quick Start

1. **Download** the appropriate file for your system
2. **Install/Run** the application
3. Click the **settings gear (⚙)** in the top right
4. Enter your amplifier's **IP address** and **password** (default: 1234)
5. Click **CONNECT**

The settings button will change from red to blue when connected!

---

## ✨ Features

### Real-Time Monitoring
- **RF Output Power** (0-1250W) with LED-style meter
- **PA Current** (0-42A) 
- **SWR** with color-coded bar graph (blue/amber/red)
- **Temperature** with warning thresholds

### Remote Control
- **Operate/Standby** mode switching
- **Band Selection** (160m to 4m)
- **Power Levels** (Low/Medium/High)
- **Antenna Selection** (A/B/C)

### User Interface
- **Minimize Mode** - compact view showing only essentials
- **TX/RX Status** - prominent indicator in header
- **Trip Alerts** - full-screen notifications for protection events
- **Connection Status** - visual indicator with settings access

---

## 💻 System Requirements

- **macOS**: 10.13 (High Sierra) or later
- **Windows**: Windows 10 or later (64-bit)
- **Linux**: Ubuntu 18.04 or equivalent
- **Network**: TCP connection to amplifier on port 9100

---

## 🔧 Installation

### macOS
1. Download the `.dmg` file
2. Open it and drag the app to Applications
3. Right-click and select "Open" (first time only)
4. Launch from Applications

### Windows
1. Download and run the installer
2. Follow the prompts
3. Launch from Start Menu

### Linux
```bash
chmod +x LinearAmpUK-DX1200-Monitor-*.AppImage
./LinearAmpUK-DX1200-Monitor-*.AppImage
```

---

## 📖 Usage

1. Ensure amplifier is on your network
2. Click settings gear (⚙)
3. Enter IP address, port (9100), password (1234)
4. Click CONNECT
5. Monitor and control your amplifier!

Click the **▲** arrow to minimize the interface.

---

## 🐛 Troubleshooting

### Cannot Connect
- Verify amplifier IP address
- Check port 9100 is not blocked
- Use "TEST CONNECTION" button

### App Won't Open
- **macOS**: Right-click → "Open"
- **Windows**: Click "More info" → "Run anyway"

---

## 📞 Support

- **Website**: https://www.thedxshop.co.uk
- **Email**: support@linearampuk.com
- **Issues**: [GitHub Issues](https://github.com/LinearAmpUK/DX1200-HF1K-Remote/issues)

---

## 🏗️ Building from Source
```bash
git clone https://github.com/LinearAmpUK/DX1200-HF1K-Remote.git
cd DX1200-HF1K-Remote
npm install
npm start
```

See [BUILD.md](BUILD.md) for details.

---

## 📄 License

Copyright © 2025 Linear Amp UK - The DX Shop

---

**Made with ❤️ for the amateur radio community**
