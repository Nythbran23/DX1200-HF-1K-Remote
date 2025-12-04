# GitHub Repository Setup

## Repository Information

- **GitHub Username**: LinearAmpUK
- **Repository Name**: DX1200-HF1K-Remote
- **Repository URL**: https://github.com/LinearAmpUK/DX1200-HF1K-Remote

## Initial Setup

### 1. Create Repository on GitHub (if not done already)

Go to https://github.com/new
- Repository name: **DX1200-HF1K-Remote**
- Description: `Remote monitoring and control for Linear Amp UK DX1200 Gemini amplifiers`
- Choose Public or Private
- Do NOT check "Add a README file"
- Click **Create repository**

### 2. Push Your Code
```bash
cd ~/gemini-monitor
git init
git add .
git commit -m "Initial release v1.0.0-alpha"
git branch -M main
git remote add origin https://github.com/LinearAmpUK/DX1200-HF1K-Remote.git
git push -u origin main
```

You'll need a Personal Access Token:
1. Go to https://github.com/settings/tokens
2. Generate new token (classic)
3. Check "repo" permissions
4. Use token as password when git asks

### 3. Create Release (triggers automatic builds)
```bash
git tag v1.0.0-alpha
git push origin v1.0.0-alpha
```

### 4. Watch Build Progress

1. Go to https://github.com/LinearAmpUK/DX1200-HF1K-Remote
2. Click **Actions** tab
3. Wait ~10-15 minutes for builds to complete
4. Click **Releases** tab
5. Edit draft release and publish

## Download Links

**Public download page:**
```
https://github.com/LinearAmpUK/DX1200-HF1K-Remote/releases/latest
```

**Direct links to installers:**
```
https://github.com/LinearAmpUK/DX1200-HF1K-Remote/releases/download/v1.0.0-alpha/Gemini-DX1200-Monitor-1.0.0-alpha-arm64.dmg
https://github.com/LinearAmpUK/DX1200-HF1K-Remote/releases/download/v1.0.0-alpha/Gemini-DX1200-Monitor-1.0.0-alpha-x64.dmg
```

## Future Updates

To release a new version:
```bash
cd ~/gemini-monitor

# Make your code changes, then:
git add .
git commit -m "Version 1.1 - Bug fixes and improvements"
git push

# Create new version tag
git tag v1.1.0
git push origin v1.1.0
```

GitHub Actions will automatically build and create a new release!

## Website Integration

Add download button to your website:
```html
<a href="https://github.com/LinearAmpUK/DX1200-HF1K-Remote/releases/latest" 
   class="download-btn">
  Download Gemini DX1200 Monitor
</a>
```

## Manual Build (Alternative)

If you prefer to build locally instead of using GitHub Actions:
```bash
cd ~/gemini-monitor

# Build for Mac only
npm run build:mac

# Or build all platforms
npm run build
```

Then manually upload files from `dist/` folder to GitHub Releases.
