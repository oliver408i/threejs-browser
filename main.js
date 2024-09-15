import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS3DRenderer, CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';
import * as TWEEN from 'tween';

// Define a fixed angle offset for consistent square arrangement
const ANGLE_OFFSET = Math.PI / 4; // 45 degrees

let camera, scene, renderer;
let controls;
let currentIframeIndex = -1; // Start at -1 since we'll increment before focusing
const iframes = [];

init();
animate();

function Element(url, x, y, z, ry) {
    const width = 960;
    const height = 720;

    const div = document.createElement('div');
    div.style.width = `${width}px`;
    div.style.height = `${height}px`;
    div.style.position = 'relative'; // To position the close button
    div.style.backgroundColor = '#000';

    const iframe = document.createElement('iframe');
    iframe.style.width = `${width}px`;
    iframe.style.height = `${height}px`;
    iframe.style.border = '0px';
    iframe.src = url;
    div.appendChild(iframe);

    // Create a close button
    const closeButton = document.createElement('button');
    closeButton.innerText = 'X';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '10px';
    closeButton.style.right = '10px';
    closeButton.style.zIndex = '10';
    closeButton.style.padding = '5px';
    closeButton.style.fontSize = '16px';
    closeButton.style.backgroundColor = 'rgba(255, 0, 0, 0.7)';
    closeButton.style.color = '#fff';
    closeButton.style.border = 'none';
    closeButton.style.borderRadius = '3px';
    closeButton.style.cursor = 'pointer';
    div.appendChild(closeButton);

    const object = new CSS3DObject(div);
    object.position.set(x, y, z);
    object.rotation.y = ry;

    // Event listener for close button
    closeButton.addEventListener('click', () => {
        // Remove from scene
        scene.remove(object);
        // Remove from iframes array
        const index = iframes.indexOf(object);
        if (index > -1) {
            iframes.splice(index, 1);
        }
        // Update positions
        updateIframePositions();
    });

    return object;
}

function init() {
    const container = document.getElementById('container');

    // Create a Perspective Camera
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 5000);
    camera.position.set(0, 350, 1500);

    // Create the Scene
    scene = new THREE.Scene();

    // CSS3D Renderer
    renderer = new CSS3DRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    // Orbit Controls for Camera
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableKeys = false; // Disable default keyboard interaction

    window.addEventListener('resize', onWindowResize);

    // Create a mode toggle button
    const modeButton = document.createElement('button');
    modeButton.innerText = 'Switch to Navigation Mode';
    modeButton.classList.add('mode-toggle-button');

    document.body.appendChild(modeButton);

    let navigationMode = false;

    modeButton.addEventListener('click', () => {
        navigationMode = !navigationMode;
        if (navigationMode) {
            modeButton.innerText = 'Switch to Interaction Mode';
            disableIframeInteraction();
        } else {
            modeButton.innerText = 'Switch to Navigation Mode';
            enableIframeInteraction();
        }
    });

    // Create an 'Add Tab' button
    const addTabButton = document.createElement('button');
    addTabButton.innerText = 'Add Tab';
    addTabButton.classList.add('add-tab-button');

    document.body.appendChild(addTabButton);

    addTabButton.addEventListener('click', () => {
        const url = 'https://www.google.com';
        addNewTab(url);
    });

    // Create a 'Next Tab' button
    const nextTabButton = document.createElement('button');
    nextTabButton.innerText = 'Next Tab';
    nextTabButton.classList.add('next-tab-button');

    document.body.appendChild(nextTabButton);

    nextTabButton.addEventListener('click', () => {
        focusNextIframe();
    });

    // Add iframe elements to the scene with correct initial positions and rotations
    const radius = 1000; // Same radius as used in updateIframePositions()
    const initialUrls = [
        'https://www.desmos.com/calculator',
        'https://www.mathway.com/Algebra',
        'https://www.symbolab.com/',
        'https://chat.openai.com/'
    ];
    const N = initialUrls.length;

    initialUrls.forEach((url, index) => {
        const angle = index * (2 * Math.PI / N) + ANGLE_OFFSET;

        const x = radius * Math.cos(angle);
        const z = radius * Math.sin(angle);

        const rotationY = angle; // Correct rotation to face outward

        const iframe = new Element(url, x, 0, z, rotationY);
        scene.add(iframe);
        iframes.push(iframe);
    });

    // No need to call updateIframePositions() here since positions are already set
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function focusNextIframe() {
    if (iframes.length === 0) return; // If there are no iframes, do nothing

    // Move to the next iframe in the array
    currentIframeIndex = (currentIframeIndex + 1) % iframes.length;

    const targetIframe = iframes[currentIframeIndex];
    const N = iframes.length;
    const angle = currentIframeIndex * (2 * Math.PI / N) + ANGLE_OFFSET;
    const offset = 500; // Distance from iframe

    const cameraTargetPosition = {
        x: targetIframe.position.x + offset * Math.cos(angle),
        y: targetIframe.position.y + 350,
        z: targetIframe.position.z + offset * Math.sin(angle)
    };

    // Tween camera position
    new TWEEN.Tween(camera.position)
        .to(cameraTargetPosition, 1000)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .start();

    // Update controls target to the iframe position
    controls.target.copy(targetIframe.position);
}

function addNewTab(url) {
    // Create a new iframe Element at camera position
    const newIframe = new Element(url, camera.position.x, camera.position.y, camera.position.z, camera.rotation.y);

    // Add to scene and iframes array
    scene.add(newIframe);
    iframes.push(newIframe);

    // Recalculate positions of all iframes
    updateIframePositions();
}

function updateIframePositions() {
    const N = iframes.length;
    const radius = 1000; // Adjust radius as needed

    for (let i = 0; i < N; i++) {
        const iframe = iframes[i];
        const angle = i * (2 * Math.PI / N) + ANGLE_OFFSET;

        const x = radius * Math.cos(angle);
        const z = radius * Math.sin(angle);

        const targetPosition = {
            x: x,
            y: 0,
            z: z
        };

        const targetRotation = {
            x: 0,
            y: angle, // Correct rotation to face outward
            z: 0
        };

        // Use TWEEN to animate position
        new TWEEN.Tween(iframe.position)
            .to(targetPosition, 1000)
            .easing(TWEEN.Easing.Quadratic.InOut)
            .start();

        // Use TWEEN to animate rotation
        new TWEEN.Tween(iframe.rotation)
            .to(targetRotation, 1000)
            .easing(TWEEN.Easing.Quadratic.InOut)
            .start();
    }
}

function disableIframeInteraction() {
    // Disable iframe interaction by setting pointer-events to 'none'
    const iframesDOM = document.querySelectorAll('iframe');
    iframesDOM.forEach(iframe => {
        iframe.style.pointerEvents = 'none';
    });
}

function enableIframeInteraction() {
    // Enable iframe interaction by removing the pointer-events style
    const iframesDOM = document.querySelectorAll('iframe');
    iframesDOM.forEach(iframe => {
        iframe.style.pointerEvents = '';
    });
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    TWEEN.update(); // Update TWEEN animations
    renderer.render(scene, camera);
}
