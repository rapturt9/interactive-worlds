import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

// ===== CONFIGURATION =====
const CONFIG = {
    dungeonSize: 7, // 7x7 grid
    tileSize: 4, // Each tile is 4 units
    playerHeight: 1.7,
    moveSpeed: 0.1,
    lookSpeed: 0.002,
    wallHeight: 3,
};

// ===== GLOBAL STATE =====
let scene, camera, renderer, controls;
let assetLibrary = {};
let dungeonGrid = [];
let walls = []; // For collision detection
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;

// ===== INITIALIZATION =====
async function init() {
    try {
        console.log('🏰 Initializing Dungeon Explorer...');

        // Show loading
        document.getElementById('loading').classList.add('active');
        updateLoadingText('Initializing 3D scene...');

        // Scene
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0a0a0a);
        scene.fog = new THREE.Fog(0x0a0a0a, 5, 25);
        console.log('✓ Scene created');

        // Camera
        camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        // Camera position will be set after dungeon generation
        console.log('✓ Camera configured');

        // Renderer
        updateLoadingText('Setting up WebGL renderer...');
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.getElementById('canvas-container').appendChild(renderer.domElement);
        console.log('✓ Renderer created');

        // Lighting
        updateLoadingText('Adding atmospheric lighting...');
        const ambientLight = new THREE.AmbientLight(0x404040, 1.5);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffa500, 0.8);
        directionalLight.position.set(5, 10, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        scene.add(directionalLight);

        // Add torch lights for atmosphere
        const torchLight1 = new THREE.PointLight(0xff6600, 1, 10);
        torchLight1.position.set(0, 2, 0);
        scene.add(torchLight1);
        console.log('✓ Lighting configured');

        // Add a ground plane for visual reference (helps debug if models don't load)
        const groundGeometry = new THREE.PlaneGeometry(100, 100);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x2a2a2a,
            roughness: 0.8,
            metalness: 0.2
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.1;
        ground.receiveShadow = true;
        scene.add(ground);
        console.log('✓ Ground plane added');

        // Add a test cube to ensure rendering works
        const cubeGeometry = new THREE.BoxGeometry(2, 2, 2);
        const cubeMaterial = new THREE.MeshStandardMaterial({ color: 0xff6600 });
        const testCube = new THREE.Mesh(cubeGeometry, cubeMaterial);
        testCube.position.set(14, 1, 5);
        testCube.castShadow = true;
        testCube.receiveShadow = true;
        scene.add(testCube);
        console.log('✓ Test cube added at (14, 1, 5) for visual reference');

        // Controls
        controls = new PointerLockControls(camera, renderer.domElement);
        console.log('✓ Controls initialized');

        // Load assets and generate dungeon
        updateLoadingText('Loading 3D assets...');
        await loadAssets();

        updateLoadingText('Generating dungeon layout...');
        generateDungeon();
        console.log('✓ Dungeon generated');

        // Setup controls
        setupControls();

        // Start animation
        animate();
        console.log('✓ Animation loop started');

        // Hide loading
        document.getElementById('loading').classList.remove('active');
        console.log('🎮 Dungeon Explorer ready! Click "CLICK TO ENTER" to start.');

    } catch (error) {
        console.error('❌ Fatal error during initialization:', error);
        showError('Failed to initialize dungeon', error.message);
        document.getElementById('loading').classList.remove('active');
    }
}

// ===== ASSET LOADING =====
async function loadAssets() {
    const loader = new GLTFLoader();
    const basePath = './assets/Models/GLB format/';

    const assetsToLoad = {
        corridor: 'corridor.glb',
        corridorCorner: 'corridor-corner.glb',
        corridorEnd: 'corridor-end.glb',
        corridorIntersection: 'corridor-intersection.glb',
        roomSmall: 'room-small.glb',
        roomLarge: 'room-large.glb',
    };

    const totalAssets = Object.keys(assetsToLoad).length;
    let loadedCount = 0;
    const errors = [];

    console.log(`Loading ${totalAssets} 3D assets from: ${basePath}`);

    const loadPromises = Object.entries(assetsToLoad).map(async ([key, filename]) => {
        const fullPath = basePath + filename;
        try {
            updateLoadingText(`Loading: ${filename}...`);
            const startTime = Date.now();
            const gltf = await loader.loadAsync(fullPath);
            const loadTime = Date.now() - startTime;

            assetLibrary[key] = gltf.scene;
            loadedCount++;
            console.log(`✓ Loaded ${key} (${filename}) in ${loadTime}ms`);
            updateLoadingText(`Loaded ${loadedCount}/${totalAssets} assets...`);
        } catch (error) {
            const errorMsg = `Failed to load ${key} (${filename}): ${error.message}`;
            console.error(`✗ ${errorMsg}`);
            console.error(`   Full path attempted: ${fullPath}`);
            errors.push(errorMsg);

            // Check for common errors
            if (error.message.includes('404')) {
                console.error(`   → File not found. Check that assets are extracted to: ${basePath}`);
            } else if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
                console.error(`   → Network error. Are you running from a local server? (Not file://)`);
            }
        }
    });

    await Promise.all(loadPromises);

    if (errors.length > 0) {
        const errorSummary = `Loaded ${loadedCount}/${totalAssets} assets. ${errors.length} failed.`;
        console.warn(errorSummary);
        if (loadedCount === 0) {
            throw new Error(`No assets loaded! Check console for details. ${errors[0]}`);
        }
    } else {
        console.log(`✓ All ${totalAssets} assets loaded successfully!`);
    }
}

// ===== DUNGEON GENERATION =====
function generateDungeon() {
    // Clear existing dungeon
    walls = [];
    dungeonGrid = Array(CONFIG.dungeonSize).fill(null).map(() =>
        Array(CONFIG.dungeonSize).fill(0)
    );

    // Simple dungeon generation algorithm
    // 0 = empty, 1 = corridor, 2 = room

    // Create a path through the dungeon
    let x = Math.floor(CONFIG.dungeonSize / 2);
    let y = 0;

    while (y < CONFIG.dungeonSize) {
        dungeonGrid[y][x] = 1; // Mark as corridor

        // Randomly branch left or right
        if (Math.random() > 0.7 && x > 0) {
            dungeonGrid[y][x - 1] = 1;
            if (Math.random() > 0.5) x--;
        } else if (Math.random() > 0.7 && x < CONFIG.dungeonSize - 1) {
            dungeonGrid[y][x + 1] = 1;
            if (Math.random() > 0.5) x++;
        }

        // Add rooms occasionally
        if (Math.random() > 0.7 && y < CONFIG.dungeonSize - 1) {
            dungeonGrid[y][x] = 2;
        }

        y++;
    }

    // Build the 3D dungeon
    buildDungeonMesh();
}

function buildDungeonMesh() {
    const tileSize = CONFIG.tileSize;
    let tilesAdded = 0;

    console.log('Building dungeon mesh...');
    console.log(`Asset library status:`, {
        corridor: !!assetLibrary.corridor,
        corridorCorner: !!assetLibrary.corridorCorner,
        roomSmall: !!assetLibrary.roomSmall,
        roomLarge: !!assetLibrary.roomLarge
    });

    for (let row = 0; row < CONFIG.dungeonSize; row++) {
        for (let col = 0; col < CONFIG.dungeonSize; col++) {
            const tileType = dungeonGrid[row][col];

            if (tileType === 0) continue; // Empty space

            const x = col * tileSize;
            const z = row * tileSize;

            // Place tile based on type
            let tileMesh;
            if (tileType === 2 && assetLibrary.roomSmall) {
                // Room
                tileMesh = assetLibrary.roomSmall.clone();
            } else if (tileType === 1 && assetLibrary.corridor) {
                // Corridor - check neighbors to determine rotation
                const rotation = getCorridorRotation(row, col);
                tileMesh = assetLibrary.corridor.clone();
                tileMesh.rotation.y = rotation;
            }

            if (tileMesh) {
                tileMesh.position.set(x, 0, z);
                tileMesh.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                scene.add(tileMesh);
                tilesAdded++;

                // Add collision walls around the tile
                addCollisionWalls(x, z, tileSize);
            }
        }
    }

    console.log(`✓ Added ${tilesAdded} tiles to the dungeon`);

    if (tilesAdded === 0) {
        console.error('❌ No tiles were added to the dungeon! Assets may have failed to load.');
        throw new Error('No dungeon tiles could be created. Check that assets loaded correctly.');
    }

    // Add perimeter walls
    addPerimeterWalls();

    // Position camera at the start of the dungeon
    const startCol = Math.floor(CONFIG.dungeonSize / 2);
    const startX = startCol * tileSize;
    const startZ = 2; // Near the start
    camera.position.set(startX, CONFIG.playerHeight, startZ);
    console.log(`✓ Camera positioned at (${startX}, ${CONFIG.playerHeight}, ${startZ})`);
}

function getCorridorRotation(row, col) {
    // Check if there's a path above or below for corridor orientation
    const hasNorth = row > 0 && dungeonGrid[row - 1][col] > 0;
    const hasSouth = row < CONFIG.dungeonSize - 1 && dungeonGrid[row + 1][col] > 0;
    const hasEast = col < CONFIG.dungeonSize - 1 && dungeonGrid[row][col + 1] > 0;
    const hasWest = col > 0 && dungeonGrid[row][col - 1] > 0;

    // Return rotation based on connections
    if (hasNorth && hasSouth) return 0; // Vertical corridor
    if (hasEast && hasWest) return Math.PI / 2; // Horizontal corridor

    return 0; // Default
}

function addCollisionWalls(x, z, size) {
    // Add invisible collision boxes around empty spaces
    const halfSize = size / 2;
    const checkPositions = [
        { dx: 0, dz: -1 }, // North
        { dx: 1, dz: 0 },  // East
        { dx: 0, dz: 1 },  // South
        { dx: -1, dz: 0 }, // West
    ];

    checkPositions.forEach(({ dx, dz }) => {
        const checkRow = Math.floor((z + dz * size) / CONFIG.tileSize);
        const checkCol = Math.floor((x + dx * size) / CONFIG.tileSize);

        if (checkRow < 0 || checkRow >= CONFIG.dungeonSize ||
            checkCol < 0 || checkCol >= CONFIG.dungeonSize ||
            dungeonGrid[checkRow][checkCol] === 0) {

            // Add collision wall
            walls.push({
                x: x + dx * halfSize,
                z: z + dz * halfSize,
                width: dx === 0 ? size : 0.5,
                depth: dz === 0 ? size : 0.5,
            });
        }
    });
}

function addPerimeterWalls() {
    const maxPos = CONFIG.dungeonSize * CONFIG.tileSize;

    // North and South walls
    walls.push({ x: maxPos / 2, z: -CONFIG.tileSize / 2, width: maxPos, depth: 1 });
    walls.push({ x: maxPos / 2, z: maxPos + CONFIG.tileSize / 2, width: maxPos, depth: 1 });

    // East and West walls
    walls.push({ x: -CONFIG.tileSize / 2, z: maxPos / 2, width: 1, depth: maxPos });
    walls.push({ x: maxPos + CONFIG.tileSize / 2, z: maxPos / 2, width: 1, depth: maxPos });
}

// ===== CONTROLS =====
function setupControls() {
    const startButton = document.getElementById('start-button');
    const overlay = document.getElementById('overlay');

    startButton.addEventListener('click', () => {
        controls.lock();
        overlay.classList.add('hidden');
    });

    controls.addEventListener('lock', () => {
        overlay.classList.add('hidden');
    });

    controls.addEventListener('unlock', () => {
        overlay.classList.remove('hidden');
    });

    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        switch (e.code) {
            case 'KeyW': moveForward = true; break;
            case 'KeyS': moveBackward = true; break;
            case 'KeyA': moveLeft = true; break;
            case 'KeyD': moveRight = true; break;
            case 'KeyR':
                generateDungeon();
                camera.position.set(2, CONFIG.playerHeight, 2);
                break;
        }
    });

    document.addEventListener('keyup', (e) => {
        switch (e.code) {
            case 'KeyW': moveForward = false; break;
            case 'KeyS': moveBackward = false; break;
            case 'KeyA': moveLeft = false; break;
            case 'KeyD': moveRight = false; break;
        }
    });

    // Window resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

// ===== COLLISION DETECTION =====
function checkCollision(x, z, radius = 0.5) {
    for (const wall of walls) {
        const halfWidth = wall.width / 2;
        const halfDepth = wall.depth / 2;

        const closestX = Math.max(wall.x - halfWidth, Math.min(x, wall.x + halfWidth));
        const closestZ = Math.max(wall.z - halfDepth, Math.min(z, wall.z + halfDepth));

        const distanceX = x - closestX;
        const distanceZ = z - closestZ;
        const distanceSquared = distanceX * distanceX + distanceZ * distanceZ;

        if (distanceSquared < radius * radius) {
            return true;
        }
    }
    return false;
}

// ===== ANIMATION LOOP =====
function animate() {
    requestAnimationFrame(animate);

    if (controls.isLocked) {
        const direction = new THREE.Vector3();
        const right = new THREE.Vector3();

        camera.getWorldDirection(direction);
        direction.y = 0;
        direction.normalize();

        right.crossVectors(camera.up, direction).normalize();

        const moveVector = new THREE.Vector3();

        if (moveForward) moveVector.add(direction);
        if (moveBackward) moveVector.sub(direction);
        if (moveLeft) moveVector.add(right);
        if (moveRight) moveVector.sub(right);

        if (moveVector.length() > 0) {
            moveVector.normalize().multiplyScalar(CONFIG.moveSpeed);

            const newX = camera.position.x + moveVector.x;
            const newZ = camera.position.z + moveVector.z;

            // Check collision before moving
            if (!checkCollision(newX, newZ)) {
                camera.position.x = newX;
                camera.position.z = newZ;
            }
        }
    }

    renderer.render(scene, camera);
}

// ===== HELPER FUNCTIONS =====
function updateLoadingText(text) {
    const loadingEl = document.getElementById('loading');
    if (loadingEl) {
        loadingEl.textContent = text;
    }
}

function showError(title, message) {
    const overlay = document.getElementById('overlay');
    if (overlay) {
        overlay.classList.remove('hidden');
        overlay.innerHTML = `
            <h1 style="color: #ff5555;">⚠️ ERROR</h1>
            <h2 style="color: #ff8888; margin: 20px 0;">${title}</h2>
            <p style="color: #ffaaaa; max-width: 600px; margin: 10px auto;">${message}</p>
            <p style="color: #aaa; margin-top: 20px;">Check the browser console (F12) for detailed error information.</p>
            <button id="reload-button" style="margin-top: 30px; padding: 15px 40px; font-size: 1.5em; font-family: 'Courier New', monospace; background: #ff5555; border: 3px solid #ff3333; color: #fff; cursor: pointer; font-weight: bold;">
                RELOAD PAGE
            </button>
        `;

        const reloadBtn = document.getElementById('reload-button');
        if (reloadBtn) {
            reloadBtn.addEventListener('click', () => {
                window.location.reload();
            });
        }
    }
}

// ===== START APPLICATION =====
console.log('%c🏰 Dungeon Explorer v1.0', 'font-size: 20px; font-weight: bold; color: #ffa500;');
console.log('%cInitializing...', 'color: #888;');
init();
