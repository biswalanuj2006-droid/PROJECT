# ♛ Grandmaster Chess — Complete Setup & Deployment Guide

## 📁 Project Structure
```
chess-game/
├── index.html          ← Main entry point
├── style.css           ← Ultra-premium dark UI styles
├── app.js              ← Game logic, UI, rendering
├── engine.js           ← Chess engine (rules + AI)
├── manifest.json       ← PWA manifest
├── sw.js               ← Service worker (offline)
├── icons/              ← App icons (generate below)
├── screenshots/        ← Store screenshots
└── README.md
```

---

## ▶️ METHOD 1 — INSTANT PLAY (Browser, Zero Setup)

### Option A: VS Code Live Server
```bash
# 1. Install VS Code + Live Server extension, then:
cd chess-game
code .
# Right-click index.html → "Open with Live Server"
# Opens at http://localhost:5500
```

### Option B: Python HTTP Server
```bash
cd chess-game
python3 -m http.server 8080
# Open: http://localhost:8080
```

### Option C: Node.js
```bash
cd chess-game
npx serve .
# Or: npx http-server . -p 8080
```

### Option D: Double-Click (Limited)
Open `index.html` directly in Chrome/Firefox/Edge.
> Note: Some features (Service Worker, clipboard) need a proper server.

---

## 📱 METHOD 2 — ANDROID APP (.apk)

### Option A: Capacitor (Recommended — Free)

**Prerequisites:**
```bash
node --version    # need v16+
java --version    # need JDK 17+
# Install Android Studio from https://developer.android.com/studio
```

**Steps:**
```bash
# 1. Install Capacitor
npm init -y
npm install @capacitor/core @capacitor/cli @capacitor/android

# 2. Initialize
npx cap init "Grandmaster Chess" "com.grandmaster.chess" --web-dir .

# 3. Add Android platform
npx cap add android

# 4. Copy web files to native
npx cap copy android
npx cap sync android

# 5. Open in Android Studio
npx cap open android

# 6. In Android Studio:
#    Build → Generate Signed Bundle/APK → APK
#    OR press Shift+F10 to run on emulator/device
```

**Build APK via command line:**
```bash
cd android
./gradlew assembleDebug
# APK will be at: android/app/build/outputs/apk/debug/app-debug.apk
```

**Build Release APK:**
```bash
cd android
./gradlew assembleRelease
# Output: android/app/build/outputs/apk/release/app-release-unsigned.apk
```

---

### Option B: PWABuilder (Easiest — No code)

1. Start local server: `python3 -m http.server 8080`
2. Use ngrok for public URL: `npx ngrok http 8080`
3. Go to **https://www.pwabuilder.com**
4. Enter your ngrok URL → Analyze → Package for Android
5. Download APK or AAB directly

---

### Option C: Bubblewrap (Google's Official PWA Tool)

```bash
# Prerequisites: JDK 8+, Android SDK
npm install -g @bubblewrap/cli

bubblewrap init --manifest="http://localhost:8080/manifest.json"
bubblewrap build
# Output: app-release-signed.apk + app-release.aab
```

---

## 🍎 METHOD 3 — iOS APP (.ipa)

**Prerequisites: Mac + Xcode (free from App Store)**

```bash
# 1. Install Capacitor iOS
npm install @capacitor/ios

# 2. Add iOS platform
npx cap add ios
npx cap copy ios
npx cap sync ios

# 3. Open Xcode
npx cap open ios

# 4. In Xcode:
#    Set your Team (Apple Developer account — free for device testing)
#    Product → Archive → Distribute App
#    OR Product → Run for simulator
```

---

## 🖥️ METHOD 4 — DESKTOP APP (.exe / .dmg / .AppImage)

### Electron (Best for Desktop)

```bash
# 1. Setup
npm init -y
npm install --save-dev electron electron-builder

# 2. Edit package.json — add these fields:
```

```json
{
  "main": "electron-main.js",
  "scripts": {
    "start": "electron .",
    "build:win":   "electron-builder --win",
    "build:mac":   "electron-builder --mac",
    "build:linux": "electron-builder --linux"
  },
  "build": {
    "appId": "com.grandmaster.chess",
    "productName": "Grandmaster Chess",
    "directories": { "output": "dist" },
    "win":   { "target": "nsis", "icon": "icons/icon.ico" },
    "mac":   { "target": "dmg",  "icon": "icons/icon.icns" },
    "linux": { "target": "AppImage", "icon": "icons/icon.png" }
  }
}
```

**Create `electron-main.js`:**
```js
const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1400, height: 900,
    minWidth: 800, minHeight: 600,
    icon: path.join(__dirname, 'icons/icon.png'),
    webPreferences: { nodeIntegration: false },
    backgroundColor: '#050505',
    titleBarStyle: 'hiddenInset'
  });
  win.loadFile('index.html');
  win.setMenuBarVisibility(false);
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
```

```bash
# Run in development
npm start

# Build for Windows (.exe installer)
npm run build:win

# Build for macOS (.dmg)
npm run build:mac

# Build for Linux (.AppImage)
npm run build:linux
```

---

## 🌐 METHOD 5 — WEB HOSTING (Play from anywhere)

### Netlify (Free — Recommended)
```bash
# Install Netlify CLI
npm install -g netlify-cli

cd chess-game
netlify deploy --prod --dir .
# Get a live URL like: https://grandmaster-chess.netlify.app
```

### Vercel (Free)
```bash
npm install -g vercel
cd chess-game
vercel --prod
```

### GitHub Pages (Free)
```bash
# 1. Create GitHub repo
git init
git add .
git commit -m "Grandmaster Chess"
git remote add origin https://github.com/YOURNAME/chess
git push -u origin main

# 2. Go to repo Settings → Pages → Source: main branch
# Live at: https://YOURNAME.github.io/chess
```

---

## 📦 METHOD 6 — GENERATE APP ICONS

```bash
# Install sharp for icon generation
npm install sharp

# Create generate-icons.js:
cat > generate-icons.js << 'EOF'
const sharp = require('sharp');
const fs = require('fs');
const sizes = [72,96,128,144,152,192,384,512];
fs.mkdirSync('icons', { recursive: true });

// Create a simple chess icon (replace with your SVG/PNG)
const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#0d0d0d" rx="80"/>
  <text x="256" y="340" font-size="280" text-anchor="middle" fill="#FFD700">♛</text>
</svg>`;

sizes.forEach(size => {
  sharp(Buffer.from(svgIcon))
    .resize(size, size)
    .png()
    .toFile(`icons/icon-${size}.png`);
  console.log(`Generated icon-${size}.png`);
});
EOF

node generate-icons.js
```

---

## 🔧 COMPLETE INSTALL FROM ZERO (All-in-one)

```bash
# Step 1: Install Node.js (if not installed)
# Download from https://nodejs.org (v18 LTS recommended)

# Step 2: Clone/create project
mkdir chess-game && cd chess-game
# (copy all 4 files: index.html, style.css, app.js, engine.js)

# Step 3: Play immediately
npx serve .

# Step 4: Build Android APK
npm init -y
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "Grandmaster Chess" "com.grandmaster.chess" --web-dir .
npx cap add android
npx cap sync android
cd android && ./gradlew assembleDebug
# APK: android/app/build/outputs/apk/debug/app-debug.apk

# Step 5: Install APK on phone
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

---

## ⌨️ KEYBOARD SHORTCUTS (In Game)

| Key | Action |
|-----|--------|
| `←` or `Ctrl+Z` | Undo move |
| `→` or `Ctrl+Y` | Redo move |
| `F` | Flip board |
| `H` | Get hint |
| `Escape` | Clear selection |
| `Ctrl+N` | New game |

---

## 🎮 GAME FEATURES

| Feature | Status |
|---------|--------|
| All FIDE chess rules | ✅ |
| Castling (K+Q side) | ✅ |
| En Passant | ✅ |
| Pawn Promotion | ✅ |
| Check / Checkmate / Stalemate | ✅ |
| 50-Move Rule | ✅ |
| Threefold Repetition | ✅ |
| Insufficient Material | ✅ |
| Minimax AI (α-β pruning) | ✅ |
| 6 AI Difficulty Levels | ✅ |
| Piece-Square Tables | ✅ |
| Quiescence Search | ✅ |
| Drag & Drop pieces | ✅ |
| Legal move highlights | ✅ |
| Move history (algebraic) | ✅ |
| PGN export/import | ✅ |
| FEN export | ✅ |
| Eval bar | ✅ |
| Captured pieces | ✅ |
| Undo/Redo | ✅ |
| 6 Board themes | ✅ |
| Statistics tracking | ✅ |
| Local Storage persistence | ✅ |
| PWA (offline capable) | ✅ |
| Responsive (mobile/tablet) | ✅ |
| Sound effects | ✅ |

---

## 🐛 TROUBLESHOOTING

**White screen / nothing loads:**
```bash
# Use a local server, not file://
python3 -m http.server 8080
```

**AI moves instantly / no thinking animation:**
```
Normal on faster machines. Depth increases with Expert/Master difficulty.
```

**Fonts not loading:**
```
Requires internet for Google Fonts. Offline: edit style.css to use system fonts.
```

**Android build fails:**
```bash
# Make sure JAVA_HOME is set:
export JAVA_HOME=$(/usr/libexec/java_home)
# And Android SDK:
export ANDROID_HOME=$HOME/Library/Android/sdk
```

---

## 📊 AI STRENGTH REFERENCE

| Level | Approx ELO | Depth | Style |
|-------|-----------|-------|-------|
| Beginner | ~600 | 1 | 60% random moves |
| Easy | ~900 | 2 | 35% mistakes |
| Medium | ~1200 | 3 | 15% mistakes |
| Hard | ~1500 | 4 | 5% mistakes |
| Expert | ~1800 | 5 | 1% mistakes |
| Master | ~2200 | 6 | Pure engine |

---

*Built with HTML5 · CSS3 · Vanilla JavaScript ES6+ · No dependencies*
*Chess Engine: Minimax + Alpha-Beta Pruning + Piece-Square Tables*