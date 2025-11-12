# 🏰 Kenney Dungeon Explorer

A first-person 3D dungeon explorer built with Three.js using Kenney's modular dungeon kit assets.

## Features

- **First-Person Navigation**: Smooth WASD + mouse controls
- **Procedural Generation**: Each dungeon is randomly generated
- **3D Assets**: Professional Kenney modular dungeon pieces
- **Collision Detection**: Can't walk through walls
- **Atmospheric Lighting**: Fog and torch effects for ambiance
- **Regeneration**: Press R to generate a new dungeon layout

## Quick Start

### 🚀 Easiest Method: Use the start script

```bash
cd /Users/ram/Github/interactive-worlds/rpg
./start.sh
```

This will automatically:
- Start a local server from the correct directory
- Open the diagnostic test page in your browser
- Show all URLs and helpful tips

### Manual Setup

If you prefer to start the server manually:

**Option A: From parent directory (recommended)**
```bash
cd /Users/ram/Github/interactive-worlds
python3 -m http.server 8080
# Then visit: http://localhost:8080/rpg/test.html
```

**Option B: From rpg directory**
```bash
cd /Users/ram/Github/interactive-worlds/rpg
python3 -m http.server 8080
# Then visit: http://localhost:8080/test.html (no /rpg/ in URL)
```

**Option C: Using Node.js (if you have npx)**
```bash
cd /Users/ram/Github/interactive-worlds
npx http-server -p 8080
```

### 📋 Test Page First (Recommended)

Before exploring the dungeon, visit the test page to verify everything loads correctly:

**Test Page URL**: http://localhost:8080/rpg/test.html

The test page will:
- ✅ Check WebGL support
- ✅ Verify Three.js and dependencies loaded
- ✅ Test each 3D asset file individually
- ✅ Show detailed error messages if anything fails
- ✅ Display 3D previews of loaded models
- ✅ Report load times and file sizes

### 🎮 Launch the Dungeon

Once all tests pass (green checkmarks), either:
- Click **"Launch Dungeon"** button on the test page
- Or directly visit: http://localhost:8080/rpg/index.html

Then:
- Click **"CLICK TO ENTER"** to start
- Your mouse will be locked to the game (ESC to release)
- Use the controls below to navigate

## Controls

| Key | Action |
|-----|--------|
| **W** | Move forward |
| **A** | Strafe left |
| **S** | Move backward |
| **D** | Strafe right |
| **Mouse** | Look around |
| **ESC** | Release mouse cursor |
| **R** | Generate new dungeon |

## Architecture

### Files

- **index.html** - HTML structure and UI overlays
- **dungeon.js** - Main application logic (scene, generation, controls)
- **assets/** - Extracted Kenney dungeon kit models

### Key Components

1. **Scene Setup**: Three.js scene with fog and lighting
2. **Asset Loading**: GLTFLoader for GLB model files
3. **Dungeon Generation**: 7x7 grid-based procedural algorithm
4. **Collision System**: AABB collision detection for walls
5. **First-Person Controls**: PointerLockControls with WASD movement

### Dungeon Generation Algorithm

- Creates a 7x7 tile grid
- Generates a winding path from top to bottom
- Randomly adds branches and rooms
- Places 3D models based on tile types
- Adds invisible collision walls around walkable areas

## Customization

Edit `CONFIG` in [dungeon.js](dungeon.js) to modify:

```javascript
const CONFIG = {
    dungeonSize: 7,      // Grid size (7x7 tiles)
    tileSize: 4,         // Each tile is 4 units
    playerHeight: 1.7,   // Camera height
    moveSpeed: 0.1,      // Movement speed
    wallHeight: 3,       // Wall collision height
};
```

## Assets

This project uses the **Kenney Modular Dungeon Kit** which includes:
- Corridors (straight, corners, intersections)
- Rooms (small, large, variations)
- Gates, doors, stairs
- Seamless modular design

**License**: See [assets/License.txt](assets/License.txt)

**Source**: [kenney.nl](https://kenney.nl)

## Tech Stack

- **Three.js r160** - 3D rendering engine (via CDN)
- **GLTFLoader** - For loading 3D models
- **PointerLockControls** - First-person mouse controls
- **Vanilla JavaScript** - No build process required

## Performance

- ~6-10 FPS on load for asset loading
- Smooth 60 FPS navigation once loaded
- Optimized shadow mapping (2048x2048)
- Fog culling for distant geometry

## Future Enhancements

Possible additions:
- [ ] Minimap overlay
- [ ] Player model/arms
- [ ] Collectible items
- [ ] Enemy NPCs
- [ ] Procedural textures
- [ ] Save/load dungeon seeds
- [ ] Integration with Interactive Worlds story system

## Troubleshooting

### 🔍 Step 1: Run the Test Page

**Always start here!** The test page will diagnose most issues automatically:

```
http://localhost:8080/rpg/test.html
```

The test page will show you exactly which components are failing with detailed error messages.

### Common Issues & Solutions

#### ❌ 404 Error - "Not Found"

**Symptoms**: Can't access the page, gets 404 error

**Causes & Solutions**:

1. **Wrong URL for server location**
   - If server started from `/rpg` directory → Use: `http://localhost:8080/index.html`
   - If server started from `/interactive-worlds` → Use: `http://localhost:8080/rpg/index.html`
   - **Tip**: Use `./start.sh` to automatically start from the correct directory

2. **Port already in use**
   ```bash
   # Check what's using port 8080
   lsof -i :8080
   # Kill it
   lsof -ti :8080 | xargs kill -9
   ```

#### ❌ "Failed to load" or "NetworkError"

**Symptoms**: Console shows errors loading GLB files

**Causes & Solutions**:

1. **Not using a local server** (most common!)
   - ❌ Opening file directly: `file:///Users/.../index.html` won't work
   - ✅ Must use HTTP server: `http://localhost:8080/...`
   - **Why**: Browsers block loading local 3D files without a server (CORS security)

2. **Assets not extracted**
   ```bash
   # Check if assets exist
   ls "./assets/Models/GLB format/"
   # Should show: corridor.glb, room-small.glb, etc.
   ```

3. **Wrong path in browser**
   - Check browser URL matches your server directory
   - Use test page to diagnose automatically

#### ❌ Black Screen or Nothing Renders

**Symptoms**: Page loads but shows only black screen

**Causes & Solutions**:

1. **WebGL not supported**
   - Check test page - it will tell you if WebGL is unavailable
   - Try different browser (Chrome/Firefox usually best)
   - Update graphics drivers

2. **Assets failed to load**
   - Open browser console (F12)
   - Look for red error messages about GLB files
   - See "Failed to load" section above

3. **JavaScript error during initialization**
   - Check console for red errors
   - Look for the error message on the overlay
   - Report the issue with console output

#### ❌ "Three.js is not defined" or Module Errors

**Symptoms**: Console shows module loading errors

**Causes & Solutions**:

1. **No internet connection**
   - Three.js loads from CDN (requires internet)
   - Check your internet connection

2. **CDN blocked or down**
   - Try accessing: https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js
   - If blocked, you may need to download Three.js locally

#### ❌ Mouse Controls Not Working

**Symptoms**: Can't look around, WASD doesn't move

**Causes & Solutions**:

1. **Didn't click "CLICK TO ENTER"**
   - Pointer lock requires a user click to activate
   - Click the button on the overlay first

2. **Browser blocked pointer lock**
   - Some browsers restrict pointer lock
   - Check browser console for security warnings
   - Try Chrome/Firefox if using different browser

3. **ESC was pressed**
   - ESC releases mouse control (by design)
   - Click "CLICK TO ENTER" again to re-lock

#### ⚠️ Performance Issues / Low FPS

**Symptoms**: Game is slow or stuttery

**Solutions**:

1. **During initial load** (normal)
   - First 3-10 seconds will be slow while assets load
   - Should become smooth once fully loaded

2. **Persistent low FPS**
   - Try lower quality browser settings
   - Close other browser tabs
   - Check if GPU acceleration is enabled in browser settings
   - Try smaller dungeon: Edit `CONFIG.dungeonSize` in dungeon.js

### 🔧 Debug Mode

To see detailed loading information:

1. Open browser console (F12)
2. Look for colored log messages:
   - 🏰 Dungeon Explorer initialization messages
   - ✓ Green checkmarks = success
   - ✗ Red X = failure with details

### 📝 Getting Help

If issues persist:

1. **Run the test page** and screenshot the results
2. **Open browser console** (F12) and copy error messages
3. **Check**:
   - What URL you're accessing
   - Where the server was started from
   - Which browser and version
4. Create an issue with this information

### ✅ Verification Checklist

Before reporting issues, verify:

- [ ] Using a local HTTP server (not file://)
- [ ] Accessed test page first
- [ ] Server started from correct directory
- [ ] Assets extracted to `./assets/Models/GLB format/`
- [ ] Browser console checked for errors
- [ ] Tried in Chrome or Firefox
- [ ] Internet connection working (for CDN)

## Credits

- **3D Assets**: [Kenney](https://kenney.nl)
- **3D Engine**: [Three.js](https://threejs.org)
- **Developer**: Interactive Worlds Team

---

Enjoy exploring! 🗝️✨
