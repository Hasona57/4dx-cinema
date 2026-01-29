import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

const textureLoader = new THREE.TextureLoader();
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75,window.innerWidth / window.innerHeight,0.1,1000);
camera.position.z = 5;

const canvas = document.getElementById('main-three-canvas');

const renderer = new THREE.WebGLRenderer({canvas: canvas,antialias: true});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

function createSeat() {
    const baseGeometry = new THREE.BoxGeometry(1, 0.3, 1);
    const baseMaterial = new THREE.MeshStandardMaterial({color: 0x1e3a8a, roughness: 0.4, metalness: 0.3});
    const baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
    const backGeometry = new THREE.BoxGeometry(1, 0.6, 0.2);
    const back = new THREE.Mesh(backGeometry, baseMaterial);
    back.position.y = 0.45;
    back.position.z = -0.4;
    const armGeometry = new THREE.BoxGeometry(0.1, 0.4, 0.6);
    const armleft = new THREE.Mesh(armGeometry, baseMaterial);
    armleft.position.set(-0.55, 0.15, -0.2);
    const armRight = armleft.clone();
    armRight.position.x = 0.55;
    const seat = new THREE.Group();
    seat.add(baseMesh);
    seat.add(back);
    seat.add(armleft);
    seat.add(armRight);
    seat.rotation.y = Math.PI;
    return seat;
}

const seats = [];
const numRows  = 8;
const seatsPerRow = 10;
const seatSpacingX = 1.2;
const seatSpacingZ = 1.4;
const rowHeightIncrement = 0.15;

for (let row = 0; row < numRows; row++) {
    const rowHeight = -0.7 + (row * rowHeightIncrement);
    const rowZ = 2 + (row * seatSpacingZ);
    for (let col = 0; col < seatsPerRow; col++) {
        const seat = createSeat();
        const offsetX = (col - (seatsPerRow - 1) / 2) * seatSpacingX;
        seat.position.x = offsetX;
        seat.position.y = rowHeight;
        seat.position.z = rowZ;
        seats.push(seat);
        scene.add(seat);
    }
}

scene.add(new THREE.AmbientLight(0x404040, 0.3));
const mainLight = new THREE.DirectionalLight(0xffffff, 1.5);
mainLight.position.set(5, 10, 5);
mainLight.castShadow = true;
scene.add(mainLight);
const rimLight = new THREE.DirectionalLight(0xffffff, 0.6);
rimLight.position.set(-5, 3, 2);
scene.add(rimLight);

const cinemaWidth = seatsPerRow * seatSpacingX + 4;
const cinemaDepth = numRows * seatSpacingZ + 6;
const cinemaHeight = 6;

const floorSections = [];
for (let row = 0; row < numRows; row++) {
    const floorHeight = -1 + (row * rowHeightIncrement);
    const floorZ = -(2 - (row * seatSpacingZ)-4);
    const floorGeometry = new THREE.PlaneGeometry(cinemaWidth + 0.5, seatSpacingZ);
    const floorMaterial = new THREE.MeshStandardMaterial({color: 0x222222, side: THREE.DoubleSide});
    const floorSection = new THREE.Mesh(floorGeometry, floorMaterial);
    floorSection.rotation.x = -Math.PI / 2;
    floorSection.position.y = floorHeight;
    floorSection.position.z = floorZ;
    const floorTexture = textureLoader.load('textures/floor.jpg');
    floorTexture.wrapS = THREE.RepeatWrapping;
    floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(seatsPerRow * seatSpacingX / 2, (numRows * seatSpacingZ + 4) / 2);
    floorSection.material.map = floorTexture;
    floorSection.material.needsUpdate = true;
    floorSections.push(floorSection);
    scene.add(floorSection);
}


const baseFloorGeometry = new THREE.PlaneGeometry(cinemaWidth + 0.5, 15);
const baseFloorMaterial = new THREE.MeshStandardMaterial({color: 0x222222, side: THREE.DoubleSide});
const baseFloor = new THREE.Mesh(baseFloorGeometry, baseFloorMaterial);
baseFloor.rotation.x = -Math.PI / 2;
baseFloor.position.y = -1;
baseFloor.position.z = -5;
const baseFloorTexture = textureLoader.load('textures/floor.jpg');
baseFloorTexture.wrapS = THREE.RepeatWrapping;
baseFloorTexture.wrapT = THREE.RepeatWrapping;
baseFloorTexture.repeat.set(3, 2);
baseFloor.material.map = baseFloorTexture;
baseFloor.material.needsUpdate = true;
scene.add(baseFloor);

function createFanOnWall(wallPosition, wallNormal) {
    const fanGroup = new THREE.Group();
    const fanGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.15, 32);
    const fanMaterial = new THREE.MeshStandardMaterial({color: 0x888888});
    const fanHousing = new THREE.Mesh(fanGeometry, fanMaterial);
    fanHousing.rotation.x = Math.PI / 2;
    fanGroup.add(fanHousing);
    const bladesGroup = new THREE.Group();
    const bladeGeometry = new THREE.BoxGeometry(0.6, 0.04, 0.08);
    const bladeMaterial = new THREE.MeshStandardMaterial({color: 0xcccccc});
    for (let i = 0; i < 4; i++) {
        const bladeMesh = new THREE.Mesh(bladeGeometry, bladeMaterial);
        bladeMesh.rotation.z = (Math.PI / 2) * i;
        bladesGroup.add(bladeMesh);
    }
    fanGroup.add(bladesGroup);
    fanGroup.userData.bladesGroup = bladesGroup;
    fanGroup.position.copy(wallPosition);
    fanGroup.lookAt(wallPosition.clone().add(wallNormal));
    return fanGroup;
}

const screenTexture = textureLoader.load('textures/screen.jpg');
const screenGeometry = new THREE.PlaneGeometry(cinemaWidth - 2, cinemaHeight);
const screenMaterial = new THREE.MeshStandardMaterial({map: screenTexture});
const screenMesh = new THREE.Mesh(screenGeometry, screenMaterial);
screenMesh.position.z = -9.9;
screenMesh.position.y = 3;
scene.add(screenMesh);

const frameGeometry = new THREE.PlaneGeometry(cinemaWidth - 1, cinemaHeight + 1);
const frameMaterial = new THREE.MeshStandardMaterial({color: 0x111111, side: THREE.DoubleSide});
const frameMech = new THREE.Mesh(frameGeometry, frameMaterial);
frameMech.position.copy(screenMesh.position);
frameMech.position.z = screenMesh.position.z - 0.05;
scene.add(frameMech);

const wallTexture = textureLoader.load('textures/wall.jpg');
wallTexture.wrapS = THREE.RepeatWrapping;
wallTexture.wrapT = THREE.RepeatWrapping;
wallTexture.repeat.set(6, 6);
const wallMaterial = new THREE.MeshStandardMaterial({color: 0x333333, side: THREE.DoubleSide});
const backWallGeometry = new THREE.PlaneGeometry(cinemaWidth, cinemaHeight + 2);
const backWallMech = new THREE.Mesh(backWallGeometry, wallMaterial);
backWallMech.position.z = -10;
backWallMech.position.y = cinemaHeight / 2;
backWallMech.material.map = wallTexture;
backWallMech.material.needsUpdate = true;
scene.add(backWallMech);
const frontWallGeometry = new THREE.PlaneGeometry(cinemaWidth, cinemaHeight + 2);
const frontWallMech = new THREE.Mesh(frontWallGeometry, wallMaterial);
frontWallMech.position.z = numRows * seatSpacingZ + 4;
frontWallMech.position.y = cinemaHeight / 2;
frontWallMech.rotation.y = Math.PI;
frontWallMech.material.map = wallTexture;
frontWallMech.material.needsUpdate = true;
scene.add(frontWallMech);
const leftWallGeometry = new THREE.PlaneGeometry(cinemaDepth + 8.5, cinemaHeight + 2);
const leftWallMech = new THREE.Mesh(leftWallGeometry, wallMaterial);
leftWallMech.material.map = wallTexture;
leftWallMech.material.needsUpdate = true;
leftWallMech.position.x = -cinemaWidth / 2;
leftWallMech.position.z = (numRows * seatSpacingZ + 4 - 10) / 2;
leftWallMech.position.y = cinemaHeight / 2;
leftWallMech.rotation.y = Math.PI / 2;
scene.add(leftWallMech);
const rightWallGeometry = new THREE.PlaneGeometry(cinemaDepth + 8.5, cinemaHeight + 2);
const rightWallMech = new THREE.Mesh(rightWallGeometry, wallMaterial);
rightWallMech.position.x = cinemaWidth / 2;
rightWallMech.position.z = (numRows * seatSpacingZ + 4 - 10) / 2;
rightWallMech.position.y = cinemaHeight / 2;
rightWallMech.rotation.y = -Math.PI / 2;
rightWallMech.material.map = wallTexture;
rightWallMech.material.needsUpdate = true;
scene.add(rightWallMech);

const allFans = [];
const fansPerWall = 6;
for (let i = 0; i < fansPerWall; i++) {
    const fanZ = -10 + (i / (fansPerWall - 1)) * (cinemaDepth - 2);
    const fanY = 2 + (i % 3) * 1.5;
    const fanPos = new THREE.Vector3(-cinemaWidth / 2 + 0.3, fanY, fanZ + 8.5);
    const fanNormal = new THREE.Vector3(1, 0, 0);
    const fan = createFanOnWall(fanPos, fanNormal);
    allFans.push(fan);
    scene.add(fan);
}
for (let i = 0; i < fansPerWall; i++) {
    const fanZ = -10 + (i / (fansPerWall - 1)) * (cinemaDepth - 2);
    const fanY = 2 + (i % 3) * 1.5;
    const fanPos = new THREE.Vector3(cinemaWidth / 2 - 0.3, fanY, fanZ + 8.5);
    const fanNormal = new THREE.Vector3(-1, 0, 0);
    const fan = createFanOnWall(fanPos, fanNormal);
    allFans.push(fan);
    scene.add(fan);
}

const spotLight = new THREE.SpotLight(0xffffff, 2);
spotLight.position.set(0, 5, 5);
spotLight.target = screenMesh;
scene.add(spotLight);
scene.add(spotLight.target);

const controls = new PointerLockControls(camera, document.body);
camera.position.set(0, 1.5, 5);
document.body.addEventListener('click', () => {
    controls.lock();
});
const move = {forward: false, backward: false, left: false, right: false};
document.addEventListener('keydown', (e) => {
    if (e.code === 'KeyW') move.backward = true;
    if (e.code === 'KeyS') move.forward = true;
    if (e.code === 'KeyA') move.left = true;
    if (e.code === 'KeyD') move.right = true;
});
document.addEventListener('keyup', (e) => {
    if (e.code === 'KeyW') move.backward = false;
    if (e.code === 'KeyS') move.forward = false;
    if (e.code === 'KeyA') move.left = false;
    if (e.code === 'KeyD') move.right = false;
});
const velocity = new THREE.Vector3();
const speed = 0.1;
function updateControls() {
    velocity.set(0, 0, 0);
    if (move.forward) velocity.z -= speed;
    if (move.backward) velocity.z += speed;
    if (move.left) velocity.x -= speed;
    if (move.right) velocity.x += speed;
    controls.moveRight(velocity.x);
    controls.moveForward(velocity.z);
    const halfWidth = cinemaWidth / 2 - 0.5;
    const halfDepth = cinemaDepth / 2 - 1.5;
    camera.position.x = THREE.MathUtils.clamp(camera.position.x, -halfWidth, halfWidth);
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, -halfDepth, halfDepth);
    camera.position.y = THREE.MathUtils.clamp(camera.position.y, 1, cinemaHeight - 1);
}

let effectsOn = true;
window.addEventListener('keydown', (e) => {
    if (e.key === 'e') {
        effectsOn = !effectsOn;
    }
});
document.getElementById('toggleButton').addEventListener('click', () => {
    effectsOn = !effectsOn;
    window.effectsOn = effectsOn;
});

window.addEventListener('click', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(seats, true);
    if (intersects.length > 0) {
        intersects[0].object.material.color.set(0xff0000);
    }
});

function animate() {
    requestAnimationFrame(animate);
    updateControls();
    if (effectsOn) {
        allFans.forEach(fanMesh => {
            if (fanMesh.userData.bladesGroup) {
                fanMesh.userData.bladesGroup.rotation.z += 0.2;
            }
        });
        seats.forEach((seat, index) => {
            const row = Math.floor(index / seatsPerRow);
            const baseY = -0.7 + (row * rowHeightIncrement);
            seat.position.y = baseY + Math.sin(Date.now() * 0.002 + index) * 0.05;
        });
    }
    renderer.render(scene, camera);
}
animate();