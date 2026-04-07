const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const previewContainer = document.getElementById('preview-container');
const cols = [
    document.getElementById('col-0'),
    document.getElementById('col-1'),
    document.getElementById('col-2'),
];
const addBtn = document.getElementById('add-btn');

let items = [];

// drag over styling
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) addPreview(file);
});

fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (file) addPreview(file);
});

function addPreview(file) {
    const url = URL.createObjectURL(file);
    let el;

    if (file.type.startsWith('image/')) {
        el = document.createElement('img');
        el.src = url;
    } else if (file.type.startsWith('video/')) {
        el = document.createElement('video');
        el.src = url;
        el.controls = true;
    }

    if (!el) return;

    const item = document.createElement('div');
    item.className = 'preview-item';

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'remove-btn';
    removeBtn.textContent = '×';
    removeBtn.addEventListener('click', () => {
        item.classList.remove('visible');
        setTimeout(() => {
            items = items.filter(i => i !== item);
            item.remove();
            if (items.length === 0) {
                previewContainer.style.display = 'none';
                dropZone.style.display = 'flex';
                fileInput.value = '';
            } else {
                flipColumns();
            }
        }, 400);
    });

    item.appendChild(el);
    item.appendChild(removeBtn);

    // place directly in next column, no re-render
    const col = cols[items.length % 3];
    col.appendChild(item);
    items.push(item);

    dropZone.style.display = 'none';
    previewContainer.style.display = 'flex';

    requestAnimationFrame(() => item.classList.add('visible'));
}

function flipColumns() {
    // 1. record current positions
    const first = items.map(item => item.getBoundingClientRect());

    // 2. re-place in DOM
    cols.forEach(col => col.innerHTML = '');
    items.forEach((item, i) => cols[i % 3].appendChild(item));

    // 3. invert + play
    items.forEach((item, i) => {
        const last = item.getBoundingClientRect();
        const dx = first[i].left - last.left;
        const dy = first[i].top - last.top;

        if (dx === 0 && dy === 0) return;

        item.style.transition = 'none';
        item.style.transform = `translate(${dx}px, ${dy}px)`;

        requestAnimationFrame(() => {
            item.style.transition = 'transform 0.3s ease';
            item.style.transform = '';
            item.addEventListener('transitionend', () => {
                item.style.transition = '';
                item.style.transform = '';
            }, { once: true });
        });
    });
}

addBtn.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,video/*';
    input.addEventListener('change', () => {
        if (input.files[0]) addPreview(input.files[0]);
    });
    input.click();
});
