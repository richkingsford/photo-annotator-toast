const images = [
  { src: 'raw1.jpg', title: 'Raw asset 1' },
  { src: 'raw2.jpg', title: 'Raw asset 2' },
  { src: 'raw3.jpg', title: 'Raw asset 3' },
  { src: 'raw4.webp', title: 'Raw asset 4' },
  { src: 'raw5.jpg', title: 'Raw asset 5' },
];

const overlay = document.getElementById('overlay');
const imageList = document.getElementById('imageList');
const mainImage = document.getElementById('mainImage');
const activeTitle = document.getElementById('activeTitle');
const clearButton = document.getElementById('clearButton');
const borderSlider = document.getElementById('borderSlider');
const borderValue = document.getElementById('borderValue');
const lineSlider = document.getElementById('lineSlider');
const lineValue = document.getElementById('lineValue');
const textSizeSlider = document.getElementById('textSizeSlider');
const textSizeValue = document.getElementById('textSizeValue');
const textColorPicker = document.getElementById('textColorPicker');
const opacitySlider = document.getElementById('opacitySlider');
const opacityValue = document.getElementById('opacityValue');
const boldToggle = document.getElementById('boldToggle');
const italicToggle = document.getElementById('italicToggle');
const colorPickerPrimary = document.getElementById('colorPickerPrimary');
const colorPickerSecondary = document.getElementById('colorPickerSecondary');

let currentIndex = 0;
const annotationSets = new Map();
const defaultAnnotations = new Map([
  [
    'raw1.jpg',
    [
      {
        x: 0.34,
        y: 0.42,
        direction: 'up',
        text: 'Modern Frameless Wall Mirror – 24x36 inch\n$129.99\n\nBrightHome Interiors',
      },
      {
        x: 0.69,
        y: 0.56,
        direction: 'down',
        text: 'Classic 36-inch Single Sink Vanity with Marble Top\n$749.00\nUrbanBath & Co.',
      },
    ],
  ],
]);

const settings = {
  borderThickness: 2.5,
  lineThickness: 2,
  textSize: 14,
  textColor: '#e5e7eb',
  isBold: false,
  isItalic: false,
  boxOpacity: 0.22,
  markerColor: '#38bdf8',
  fillColor: '#a855f7',
};

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

function autoResizeTextarea(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = `${textarea.scrollHeight}px`;
}

function getCurrentAnnotations() {
  const key = images[currentIndex].src;
  if (!annotationSets.has(key)) {
    const defaults = defaultAnnotations.get(key) || [];
    annotationSets.set(
      key,
      defaults.map((item) => ({
        id: makeId(),
        color: settings.markerColor,
        fillColor: settings.fillColor,
        editing: false,
        ...item,
      })),
    );
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

function addAnnotation(x, y) {
  const direction = y > 0.55 ? 'up' : 'down';
  const annotations = getCurrentAnnotations();
  annotations.push({
    id: makeId(),
    x,
    y,
    direction,
    text: 'Annotation',
    color: settings.markerColor,
    fillColor: settings.fillColor,
    editing: true,
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

  document.documentElement.style.setProperty('--dot-border', `${settings.borderThickness}px`);

  annotations.forEach((annotation) => {
    const xPx = annotation.x * rect.width;
    const yPx = annotation.y * rect.height;
    const fillColor = annotation.fillColor || annotation.color;
    const bgTint = colorWithAlpha(fillColor, settings.boxOpacity);

    const dot = document.createElement('div');
    dot.className = 'dot';
    dot.style.left = `${xPx}px`;
    dot.style.top = `${yPx}px`;
    dot.style.backgroundColor = annotation.color;
    dot.style.borderColor = colorWithAlpha(annotation.color, 0.38);
    dot.style.pointerEvents = 'none';

    const line = document.createElement('div');
    line.className = 'line';
    line.style.left = `${xPx}px`;
    line.style.backgroundColor = annotation.color;
    line.style.height = `${lineLength}px`;
    line.style.width = `${settings.lineThickness}px`;
    line.style.pointerEvents = 'none';

    const label = document.createElement('div');
    label.className = `label-chip ${annotation.direction}`;
    label.style.left = `${xPx}px`;
    label.style.color = settings.textColor;
    label.style.background = bgTint;
    label.style.borderColor = colorWithAlpha(fillColor, Math.min(settings.boxOpacity + 0.15, 0.75));
    label.style.fontSize = `${settings.textSize}px`;
    label.style.fontWeight = settings.isBold ? '700' : '500';
    label.style.fontStyle = settings.isItalic ? 'italic' : 'normal';
    label.dataset.id = annotation.id;

    label.addEventListener('click', () => setEditing(annotation.id, true));

    const handleFocusOut = (event) => {
      if (!label.contains(event.relatedTarget)) {
        setEditing(annotation.id, false);
      }
    };

    if (annotation.editing) {
      label.classList.add('editing');
      const input = document.createElement('textarea');
      input.value = annotation.text;
      input.rows = annotation.text.split('\n').length || 1;
      input.style.backgroundColor = colorWithAlpha(fillColor, Math.max(settings.boxOpacity - 0.08, 0.05));
      input.style.fontSize = `${settings.textSize}px`;
      input.style.color = settings.textColor;
      input.addEventListener('input', (e) => {
        autoResizeTextarea(e.target);
        updateText(annotation.id, e.target.value);
      });
      input.addEventListener('focusout', handleFocusOut);
      autoResizeTextarea(input);

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
    } else {
      label.classList.add('view');
      const text = document.createElement('div');
      text.className = 'label-text';
      text.textContent = annotation.text;
      text.tabIndex = 0;
      text.addEventListener('focusout', handleFocusOut);
      label.appendChild(text);
    }

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

function setEditing(id, editing) {
  const annotations = getCurrentAnnotations();
  const target = annotations.find((item) => item.id === id);
  if (target) {
    target.editing = editing;
    renderAnnotations();
    if (editing) {
      requestAnimationFrame(() => {
        const activeLabel = overlay.querySelector(`[data-id="${id}"] textarea`);
        if (activeLabel) {
          activeLabel.focus();
          activeLabel.setSelectionRange(activeLabel.value.length, activeLabel.value.length);
        }
      });
    }
  }
}

function updateControlDisplay() {
  borderValue.textContent = `${settings.borderThickness}px`;
  lineValue.textContent = `${settings.lineThickness}px`;
  textSizeValue.textContent = `${settings.textSize}px`;
  opacityValue.textContent = `${Math.round(settings.boxOpacity * 100)}%`;
  boldToggle.checked = settings.isBold;
  italicToggle.checked = settings.isItalic;
  textColorPicker.value = settings.textColor;
}

function wireControls() {
  borderSlider.addEventListener('input', (event) => {
    settings.borderThickness = parseFloat(event.target.value);
    updateControlDisplay();
    renderAnnotations();
  });

  lineSlider.addEventListener('input', (event) => {
    settings.lineThickness = parseFloat(event.target.value);
    updateControlDisplay();
    renderAnnotations();
  });

  textSizeSlider.addEventListener('input', (event) => {
    settings.textSize = parseInt(event.target.value, 10);
    updateControlDisplay();
    renderAnnotations();
  });

  textColorPicker.addEventListener('input', (event) => {
    settings.textColor = event.target.value;
    renderAnnotations();
  });

  opacitySlider.addEventListener('input', (event) => {
    settings.boxOpacity = parseFloat(event.target.value);
    updateControlDisplay();
    renderAnnotations();
  });

  colorPickerPrimary.addEventListener('input', (event) => {
    settings.markerColor = event.target.value;
    annotationSets.forEach((set) => {
      set.forEach((annotation) => {
        annotation.color = settings.markerColor;
      });
    });
    renderAnnotations();
  });

  colorPickerSecondary.addEventListener('input', (event) => {
    settings.fillColor = event.target.value;
    annotationSets.forEach((set) => {
      set.forEach((annotation) => {
        annotation.fillColor = settings.fillColor;
      });
    });
    renderAnnotations();
  });

  boldToggle.addEventListener('change', (event) => {
    settings.isBold = event.target.checked;
    renderAnnotations();
  });

  italicToggle.addEventListener('change', (event) => {
    settings.isItalic = event.target.checked;
    renderAnnotations();
  });
}

function init() {
  buildImageList();
  setActiveImage(0);
  mainImage.addEventListener('load', renderAnnotations);
  overlay.addEventListener('click', handleOverlayClick);
  window.addEventListener('resize', renderAnnotations);
  clearButton.addEventListener('click', clearAnnotations);
  wireControls();
  updateControlDisplay();
}

window.addEventListener('DOMContentLoaded', init);
