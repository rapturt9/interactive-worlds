import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ===== TEST STATE =====
const testState = {
    tests: [],
    passed: 0,
    failed: 0,
    startTime: 0,
    scene: null,
    camera: null,
    renderer: null,
    controls: null,
    loadedModels: []
};

// ===== CONSOLE LOGGING =====
function log(message, type = 'info') {
    const consoleOutput = document.getElementById('console-output');
    const line = document.createElement('div');
    line.className = `console-line console-${type}`;
    const timestamp = new Date().toLocaleTimeString();
    line.textContent = `[${timestamp}] ${message}`;
    consoleOutput.appendChild(line);
    consoleOutput.scrollTop = consoleOutput.scrollHeight;

    // Also log to browser console
    console.log(`[TEST] ${message}`);
}

// ===== TEST ITEM UI =====
function createTestItem(name, id) {
    const test = {
        id,
        name,
        status: 'pending',
        detail: '',
        element: null
    };

    const item = document.createElement('div');
    item.className = 'test-item';
    item.innerHTML = `
        <div class="status-icon status-pending" id="icon-${id}">⏳</div>
        <div class="test-name">${name}</div>
        <div class="test-detail" id="detail-${id}"></div>
    `;

    test.element = item;
    testState.tests.push(test);
    return { test, item };
}

function updateTestStatus(test, status, detail = '') {
    test.status = status;
    test.detail = detail;

    const icon = document.getElementById(`icon-${test.id}`);
    const detailEl = document.getElementById(`detail-${test.id}`);

    icon.className = `status-icon status-${status}`;

    switch (status) {
        case 'loading':
            icon.textContent = '⏳';
            break;
        case 'success':
            icon.textContent = '✅';
            testState.passed++;
            break;
        case 'error':
            icon.textContent = '❌';
            testState.failed++;
            break;
    }

    if (detailEl && detail) {
        detailEl.textContent = detail;
    }

    updateSummary();
}

function updateSummary() {
    const total = testState.tests.length;
    const completed = testState.passed + testState.failed;
    const progress = total > 0 ? (completed / total) * 100 : 0;

    document.getElementById('overall-progress').style.width = `${progress}%`;
    document.getElementById('overall-progress').textContent = `${Math.round(progress)}%`;
    document.getElementById('passed-count').textContent = testState.passed;
    document.getElementById('failed-count').textContent = testState.failed;

    const elapsed = Date.now() - testState.startTime;
    document.getElementById('total-time').textContent = `${elapsed}ms`;

    // Enable launch button if all tests passed
    if (completed === total && testState.failed === 0) {
        document.getElementById('launch-app-btn').disabled = false;
        log('All tests passed! Ready to launch dungeon.', 'success');
    }
}

// ===== 3D PREVIEW SETUP =====
function setup3DPreview() {
    const canvas = document.getElementById('preview-canvas');

    // Scene
    testState.scene = new THREE.Scene();
    testState.scene.background = new THREE.Color(0x0a0a0a);
    testState.scene.fog = new THREE.Fog(0x0a0a0a, 10, 50);

    // Camera
    testState.camera = new THREE.PerspectiveCamera(
        60,
        canvas.clientWidth / canvas.clientHeight,
        0.1,
        1000
    );
    testState.camera.position.set(5, 5, 5);

    // Renderer
    testState.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    testState.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    testState.renderer.shadowMap.enabled = true;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 2);
    testState.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffa500, 1);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    testState.scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0xff6600, 1, 20);
    pointLight.position.set(0, 3, 0);
    testState.scene.add(pointLight);

    // Controls
    testState.controls = new OrbitControls(testState.camera, testState.renderer.domElement);
    testState.controls.enableDamping = true;

    // Grid helper
    const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222);
    testState.scene.add(gridHelper);

    // Start animation loop
    function animate() {
        requestAnimationFrame(animate);
        testState.controls.update();
        testState.renderer.render(testState.scene, testState.camera);
    }
    animate();

    // Handle resize
    window.addEventListener('resize', () => {
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        testState.camera.aspect = width / height;
        testState.camera.updateProjectionMatrix();
        testState.renderer.setSize(width, height);
    });

    log('3D preview initialized', 'success');
}

// ===== SYSTEM TESTS =====
async function runSystemTests() {
    const systemTestsContainer = document.getElementById('system-tests');

    // Test 1: WebGL Support
    const { test: webglTest, item: webglItem } = createTestItem('WebGL Support', 'webgl');
    systemTestsContainer.appendChild(webglItem);

    updateTestStatus(webglTest, 'loading');
    await sleep(100);

    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    if (gl) {
        updateTestStatus(webglTest, 'success', 'Supported');
        log('WebGL is supported', 'success');
    } else {
        updateTestStatus(webglTest, 'error', 'Not supported');
        log('WebGL is NOT supported - 3D rendering will not work!', 'error');
    }

    // Test 2: Three.js Library
    const { test: threeTest, item: threeItem } = createTestItem('Three.js Library', 'threejs');
    systemTestsContainer.appendChild(threeItem);

    updateTestStatus(threeTest, 'loading');
    await sleep(100);

    if (typeof THREE !== 'undefined') {
        updateTestStatus(threeTest, 'success', `v${THREE.REVISION}`);
        log(`Three.js loaded successfully (revision ${THREE.REVISION})`, 'success');
    } else {
        updateTestStatus(threeTest, 'error', 'Failed to load');
        log('Three.js failed to load from CDN', 'error');
    }

    // Test 3: GLTFLoader
    const { test: loaderTest, item: loaderItem } = createTestItem('GLTFLoader Module', 'gltfloader');
    systemTestsContainer.appendChild(loaderItem);

    updateTestStatus(loaderTest, 'loading');
    await sleep(100);

    if (typeof GLTFLoader !== 'undefined') {
        updateTestStatus(loaderTest, 'success', 'Available');
        log('GLTFLoader module loaded successfully', 'success');
    } else {
        updateTestStatus(loaderTest, 'error', 'Failed to load');
        log('GLTFLoader failed to load', 'error');
    }

    // Test 4: Assets Directory
    const { test: dirTest, item: dirItem } = createTestItem('Assets Directory Access', 'assets-dir');
    systemTestsContainer.appendChild(dirItem);

    updateTestStatus(dirTest, 'loading');

    try {
        const response = await fetch('./assets/License.txt');
        if (response.ok) {
            updateTestStatus(dirTest, 'success', 'Accessible');
            log('Assets directory is accessible', 'success');
        } else {
            updateTestStatus(dirTest, 'error', `HTTP ${response.status}`);
            log(`Assets directory returned HTTP ${response.status}`, 'error');
        }
    } catch (error) {
        updateTestStatus(dirTest, 'error', error.message);
        log(`Assets directory error: ${error.message}`, 'error');
    }
}

// ===== ASSET LOADING TESTS =====
async function runAssetTests() {
    const assetTestsContainer = document.getElementById('asset-tests');
    const loader = new GLTFLoader();
    const basePath = './assets/Models/GLB format/';

    const assetsToTest = [
        { name: 'Corridor (Straight)', file: 'corridor.glb', id: 'asset-corridor' },
        { name: 'Corridor Corner', file: 'corridor-corner.glb', id: 'asset-corner' },
        { name: 'Corridor End', file: 'corridor-end.glb', id: 'asset-end' },
        { name: 'Corridor Intersection', file: 'corridor-intersection.glb', id: 'asset-intersection' },
        { name: 'Small Room', file: 'room-small.glb', id: 'asset-room-small' },
        { name: 'Large Room', file: 'room-large.glb', id: 'asset-room-large' },
    ];

    for (const asset of assetsToTest) {
        const { test, item } = createTestItem(asset.name, asset.id);
        assetTestsContainer.appendChild(item);

        updateTestStatus(test, 'loading', 'Loading...');
        log(`Loading asset: ${asset.file}`, 'info');

        const startTime = Date.now();

        try {
            const gltf = await loader.loadAsync(basePath + asset.file);
            const loadTime = Date.now() - startTime;

            // Get file size
            const response = await fetch(basePath + asset.file);
            const blob = await response.blob();
            const sizeKB = (blob.size / 1024).toFixed(1);

            updateTestStatus(test, 'success', `${sizeKB}KB (${loadTime}ms)`);
            log(`✓ Loaded ${asset.name}: ${sizeKB}KB in ${loadTime}ms`, 'success');

            // Add to preview scene
            const model = gltf.scene.clone();
            const offset = testState.loadedModels.length * 5;
            model.position.set(offset - 12, 0, 0);
            model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            testState.scene.add(model);
            testState.loadedModels.push(model);

        } catch (error) {
            const loadTime = Date.now() - startTime;
            updateTestStatus(test, 'error', `Failed (${loadTime}ms)`);
            log(`✗ Failed to load ${asset.name}: ${error.message}`, 'error');

            // Log more details
            if (error.message.includes('404')) {
                log(`  → File not found: ${basePath + asset.file}`, 'error');
            } else if (error.message.includes('CORS')) {
                log(`  → CORS error - make sure you're using a local server`, 'error');
            }
        }

        await sleep(50); // Small delay between tests
    }
}

// ===== UTILITY =====
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ===== MAIN TEST RUNNER =====
async function runAllTests() {
    log('Starting diagnostic tests...', 'info');
    testState.startTime = Date.now();
    testState.passed = 0;
    testState.failed = 0;
    testState.tests = [];
    testState.loadedModels = [];

    // Clear previous test results
    document.getElementById('system-tests').innerHTML = '';
    document.getElementById('asset-tests').innerHTML = '';
    document.getElementById('launch-app-btn').disabled = true;

    // Clear preview scene (except lights and grid)
    while (testState.scene.children.length > 0) {
        testState.scene.remove(testState.scene.children[0]);
    }

    // Re-setup scene
    const ambientLight = new THREE.AmbientLight(0x404040, 2);
    testState.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffa500, 1);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    testState.scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0xff6600, 1, 20);
    pointLight.position.set(0, 3, 0);
    testState.scene.add(pointLight);

    const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222);
    testState.scene.add(gridHelper);

    // Run tests
    await runSystemTests();
    await runAssetTests();

    const totalTime = Date.now() - testState.startTime;
    log(`Tests completed in ${totalTime}ms`, 'info');
    log(`Results: ${testState.passed} passed, ${testState.failed} failed`,
        testState.failed === 0 ? 'success' : 'error');
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    log('Test suite initialized', 'info');
    log('Click "Run All Tests" to start diagnostics', 'info');

    setup3DPreview();

    // Button handlers
    document.getElementById('run-tests-btn').addEventListener('click', runAllTests);
    document.getElementById('retest-btn').addEventListener('click', runAllTests);
    document.getElementById('launch-app-btn').addEventListener('click', () => {
        window.location.href = './index.html';
    });

    // Auto-run tests on load
    setTimeout(runAllTests, 500);
});
