import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Создание сцены
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xdddddd);

// Создание рендерера
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Создание камеры
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const controls = new OrbitControls(camera, renderer.domElement);

const pixelGeometry = new THREE.CircleGeometry(0.005, 32);
const pixelMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
const pixel = new THREE.Mesh(pixelGeometry, pixelMaterial);
pixel.position.set(0, 0, 0);

scene.add(pixel);

// Группа для кубов
const pointsGroup = new THREE.Group();
scene.add(pointsGroup);

// Элемент для загрузки файла
const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.accept = '.txt';
fileInput.style.display = 'none';

document.body.appendChild(fileInput);

// Кнопка для выбора файла
const button = document.createElement('button');
button.innerText = 'Загрузить файл с точками';
document.body.appendChild(button);

button.addEventListener('click', () => {
    fileInput.click(); // Имитация клика на input
});

fileInput.addEventListener('change', handleFileSelect);

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const content = e.target.result;
            loadPointsFromString(content);
        };
        reader.readAsText(file);
    }
}

function loadPointsFromString(data) {
    const pointsData = data.split('\n').map(line => {
        const [number, x, y, z, name] = line.split(' ');
        return [number, name, parseFloat(y), parseFloat(x), parseFloat(z)];
    });

    pointsGroup.clear(); // Очистка предыдущих кубов

    pointsData.forEach(([number, name, z, x, y]) => {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const cube = new THREE.Mesh(geometry, material);

        cube.position.set(parseFloat(x), parseFloat(y), parseFloat(z));
        cube.userData = { number, name };
        pointsGroup.add(cube);
    });

    const center = new THREE.Vector3();
    pointsGroup.children.forEach(child => {
        if (child instanceof THREE.Mesh) {
            center.add(child.position);
        }
    });
    center.divideScalar(pointsGroup.children.length);

    camera.position.copy(center);
    camera.position.y += 10;
    camera.lookAt(center);
    controls.target.copy(center);
    controls.update();
}

// Обработчик кликов
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onMouseClick(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(pointsGroup.children);

    if (intersects.length > 0) {
        const cube = intersects[0].object;
        const { name } = cube.userData;
        const position = cube.position;
        alert(`Вы кликнули на куб: ${name}\nПозиция: (x: ${position.x}, y: ${position.y}, z: ${position.z})`);
    }
}

window.addEventListener('click', onMouseClick);

// Анимация
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    pixel.position.copy(camera.position);
    pixel.position.add(camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(2));
    pixel.lookAt(camera.position);
    renderer.render(scene, camera);
}

animate();

// Адаптация под изменение размера окна
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
