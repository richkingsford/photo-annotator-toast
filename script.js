const images = [
  { src: 'raw1.jpg', title: 'Raw asset 1' },
  { src: 'raw2.jpg', title: 'Raw asset 2' },
  { src: 'raw3.jpg', title: 'Raw asset 3' },
  { src: 'raw4.webp', title: 'Raw asset 4' },
  { src: 'raw5.jpg', title: 'Raw asset 5' },
];

const palette = ['#38bdf8', '#a855f7', '#fb7185', '#f97316', '#4ade80'];

const overlay = document.getElementById('overlay');
const imageList = document.getElementById('imageList');
const mainImage = document.getElementById('mainImage');
const activeTitle = document.getElementById('activeTitle');
const clearButton = document.getElementById('clearButton');

let currentIndex = 0;
let colorIndex = 0;
const annotationSets = new Map();

function makeId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return `anno-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function colorWithAlpha(hex, alpha) {
  const stripped = hex.replace('#', '');
  const bigint = parseInt(stripped, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getCurrentAnnotations() {
  const key = images[currentIndex].src;
  if (!annotationSets.has(key)) {
    annotationSets.set(key, []);
  }
  return annotationSets.get(key);
}

function setActiveImage(index) {
  currentIndex = index;
  const image = images[index];
  mainImage.src = image.src;
  mainImage.alt = image.title;
  activeTitle.textContent = image.title;
  document.querySelectorAll('.image-thumb').forEach((thumb, i) => {
    thumb.classList.toggle('active', i === index);
  });
  renderAnnotations();
}

function createThumbnail(image, index) {
  const wrapper = document.createElement('button');
  wrapper.className = 'image-thumb';
  wrapper.type = 'button';
  wrapper.setAttribute('data-index', index);

  const img = document.createElement('img');
  img.src = image.src;
  img.alt = image.title;

  const label = document.createElement('span');
  label.textContent = image.title;

  wrapper.appendChild(img);
  wrapper.appendChild(label);
  wrapper.addEventListener('click', () => setActiveImage(index));
  return wrapper;
}

function buildImageList() {
  images.forEach((image, index) => {
    imageList.appendChild(createThumbnail(image, index));
  });
}

function nextColor() {
  const color = palette[colorIndex % palette.length];
  colorIndex += 1;
  return color;
}

function addAnnotation(x, y) {
  const direction = y > 0.55 ? 'up' : 'down';
  const annotations = getCurrentAnnotations();
  annotations.push({
    id: makeId(),
    x,
    y,
    direction,
    text: 'Annotation',
    color: nextColor(),
  });
  renderAnnotations();
}

function removeAnnotation(id) {
  const annotations = getCurrentAnnotations();
  const index = annotations.findIndex((item) => item.id === id);
  if (index !== -1) {
    annotations.splice(index, 1);
    renderAnnotations();
  }
}

function toggleDirection(id) {
  const annotations = getCurrentAnnotations();
  const target = annotations.find((item) => item.id === id);
  if (target) {
    target.direction = target.direction === 'down' ? 'up' : 'down';
    renderAnnotations();
  }
}

function updateText(id, value) {
  const annotations = getCurrentAnnotations();
  const target = annotations.find((item) => item.id === id);
  if (target) {
    target.text = value;
  }
}

function clearAnnotations() {
  const annotations = getCurrentAnnotations();
  annotations.splice(0, annotations.length);
  renderAnnotations();
}

function renderAnnotations() {
  overlay.innerHTML = '';
  const annotations = getCurrentAnnotations();
  const rect = overlay.getBoundingClientRect();
  const dotRadius = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--dot-size'), 10) / 2;
  const lineLength = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--line-length'), 10);
  const gap = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--gap'), 10);

  annotations.forEach((annotation) => {
    const xPx = annotation.x * rect.width;
    const yPx = annotation.y * rect.height;
    const bgTint = colorWithAlpha(annotation.color, 0.16);

    const dot = document.createElement('div');
    dot.className = 'dot';
    dot.style.left = `${xPx}px`;
    dot.style.top = `${yPx}px`;
    dot.style.backgroundColor = annotation.color;
    dot.style.borderColor = colorWithAlpha(annotation.color, 0.3);
    dot.style.pointerEvents = 'none';

    const line = document.createElement('div');
    line.className = 'line';
    line.style.left = `${xPx}px`;
    line.style.backgroundColor = annotation.color;
    line.style.height = `${lineLength}px`;
    line.style.pointerEvents = 'none';

    const label = document.createElement('div');
    label.className = `label-chip ${annotation.direction}`;
    label.style.left = `${xPx}px`;
    label.style.color = annotation.color;
    label.style.background = bgTint;
    label.style.borderColor = colorWithAlpha(annotation.color, 0.45);

    const input = document.createElement('input');
    input.type = 'text';
    input.value = annotation.text;
    input.style.backgroundColor = colorWithAlpha(annotation.color, 0.08);
    input.addEventListener('input', (e) => updateText(annotation.id, e.target.value));

    const flip = document.createElement('button');
    flip.title = 'Flip direction';
    flip.textContent = '⇅';
    flip.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleDirection(annotation.id);
    });

    const remove = document.createElement('button');
    remove.title = 'Remove annotation';
    remove.textContent = '✕';
    remove.addEventListener('click', (e) => {
      e.stopPropagation();
      removeAnnotation(annotation.id);
    });

    label.appendChild(input);
    label.appendChild(flip);
    label.appendChild(remove);

    if (annotation.direction === 'down') {
      line.style.top = `${yPx + dotRadius}px`;
      label.style.top = `${yPx + dotRadius + lineLength + gap}px`;
    } else {
      line.style.top = `${yPx - dotRadius - lineLength}px`;
      label.style.top = `${yPx - dotRadius - lineLength - gap}px`;
    }

    overlay.appendChild(dot);
    overlay.appendChild(line);
    overlay.appendChild(label);
  });
}

function handleOverlayClick(event) {
  if (event.target !== overlay) return;
  const rect = overlay.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width;
  const y = (event.clientY - rect.top) / rect.height;
  addAnnotation(x, y);
}

function init() {
  buildImageList();
  setActiveImage(0);
  mainImage.addEventListener('load', renderAnnotations);
  overlay.addEventListener('click', handleOverlayClick);
  window.addEventListener('resize', renderAnnotations);
  clearButton.addEventListener('click', clearAnnotations);
}

window.addEventListener('DOMContentLoaded', init);
