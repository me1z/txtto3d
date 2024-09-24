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

// Материал для точек
const material = new THREE.PointsMaterial({ color: 0xff0000, size: 0.5 }); // Установите размер точек меньше

// Группа точек
const pointsGroup = new THREE.Group();

// Функция загрузки точек из файла
async function loadPointsFromFile(url) {
    const response = await fetch(url);
    const data = await response.text();

    const pointsData = data.split('\n').map(line => {
        const [number, x, y, z, name] = line.split(' '); // Изменено на пробелы
        return [number, name, parseFloat(y), parseFloat(x), parseFloat(z)]; // Поменяли x и y местами
    });

    return pointsData;
}

// Загрузка точек из файла
loadPointsFromFile('./points.txt').then(pointsData => {
    // Массив для хранения координат
    const positions = [];

    // Создание точек
    pointsData.forEach(([number, name, y, x, z]) => {
        positions.push(new THREE.Vector3(x, y, z)); // Добавление координат в массив

        const geometry = new THREE.BufferGeometry();
        const vertices = new Float32Array([x, y, z]);
        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

        const point = new THREE.Points(geometry, material);
        point.userData = { number, name };  // Сохранение номера и названия точки в userData

        pointsGroup.add(point);
    });

    scene.add(pointsGroup);

    // Рассчитываем центр точек
    const center = new THREE.Vector3();
    positions.forEach(pos => {
        center.add(pos);
    });
    center.divideScalar(positions.length); // Находим среднее значение

    // Установка камеры в центр точек
    camera.position.set(center.x, center.y + 500, center.z + 500); // Установить камеру чуть выше центра
    camera.lookAt(center); // Направить камеру на центр

    controls.target.copy(center); // Установка цели управления камеры
    controls.update(); // Обновление управления
});

// Добавление осей для ориентации
const axesHelper = new THREE.AxesHelper(100); // 100 — длина осей
scene.add(axesHelper);

// Обработчик кликов
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onMouseClick(event) {
    // Перевод координат мыши в нормализованные
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(pointsGroup.children);

    if (intersects.length > 0) {
        const point = intersects[0].object;
        const { name } = point.userData;  // Извлечение имени
        const position = point.position;
        alert(`Вы кликнули на точку: ${name}\nПозиция: (x: ${position.x}, y: ${position.y}, z: ${position.z})`); // Показать название и позицию точки
    }
}

window.addEventListener('click', onMouseClick);

// Анимация
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

animate();

// Адаптация под изменение размера окна
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
