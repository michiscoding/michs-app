const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const previewContainer = document.getElementById('preview-container');
const cols = [
    document.getElementById('col-0'),
    document.getElementById('col-1'),
    document.getElementById('col-2'),
];
const addBtn = document.getElementById('add-btn');
const postBtn = document.getElementById('post-btn');

const ALL_TAGS = ['home', 'nature', 'jiu-jitsu', 'vsco', 'random'];

// items: [{ file, tags: Set, el }]
let items = [];

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
    fileInput.value = '';
});

function addPreview(file) {
    const url = URL.createObjectURL(file);
    const tags = new Set();

    const item = document.createElement('div');
    item.className = 'preview-item';

    const isVideo = file.type.startsWith('video/');
    const media = document.createElement(isVideo ? 'video' : 'img');
    media.src = url;
    if (isVideo) { media.muted = true; media.loop = true; media.autoplay = true; media.playsInline = true; }

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'remove-btn';
    removeBtn.textContent = '×';

    const tagPicker = document.createElement('div');
    tagPicker.className = 'tag-picker';
    ALL_TAGS.forEach(tag => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'tag-btn';
        btn.textContent = tag;
        btn.addEventListener('click', () => {
            if (tags.has(tag)) { tags.delete(tag); btn.classList.remove('active'); }
            else { tags.add(tag); btn.classList.add('active'); }
        });
        tagPicker.appendChild(btn);
    });

    const entry = { file, tags, el: item };
    items.push(entry);

    removeBtn.addEventListener('click', () => {
        item.classList.remove('visible');
        setTimeout(() => {
            items = items.filter(i => i !== entry);
            item.remove();
            if (items.length === 0) {
                previewContainer.style.display = 'none';
                dropZone.style.display = 'flex';
            } else {
                flipColumns();
            }
        }, 400);
    });

    item.appendChild(media);
    item.appendChild(removeBtn);
    item.appendChild(tagPicker);

    const col = cols[items.length % 3];
    col.appendChild(item);

    dropZone.style.display = 'none';
    previewContainer.style.display = 'flex';

    requestAnimationFrame(() => item.classList.add('visible'));
}

function sanitizeName(name) {
    return name.toLowerCase().replace(/[^a-z0-9.\-_]/g, '-');
}

function flipColumns() {
    const first = items.map(item => item.el.getBoundingClientRect());
    cols.forEach(col => col.innerHTML = '');
    items.forEach((item, i) => cols[i % 3].appendChild(item.el));
    items.forEach((item, i) => {
        const last = item.el.getBoundingClientRect();
        const dx = first[i].left - last.left;
        const dy = first[i].top - last.top;
        if (dx === 0 && dy === 0) return;
        item.el.style.transition = 'none';
        item.el.style.transform = `translate(${dx}px, ${dy}px)`;
        requestAnimationFrame(() => {
            item.el.style.transition = 'transform 0.3s ease';
            item.el.style.transform = '';
            item.el.addEventListener('transitionend', () => {
                item.el.style.transition = '';
                item.el.style.transform = '';
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

postBtn.addEventListener('click', async () => {
    if (!items.length) return;
    const adminDb = await getAdminClient();
    if (!adminDb) return;

    postBtn.textContent = 'posting...';
    postBtn.disabled = true;

    const today = new Date();
    const date = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

    const rows = [];
    for (const item of items) {
        const name = sanitizeName(item.file.name);
        const path = `photos/${date}/${name}`;
        const { error } = await adminDb.storage.from('media').upload(path, item.file, { upsert: true });
        if (!error) {
            rows.push({ storage_path: path, tags: [...item.tags], date });
        }
    }

    if (rows.length) {
        await adminDb.from('photos').insert(rows);
    }

    postBtn.textContent = 'posted!';
    items = [];
    cols.forEach(col => col.innerHTML = '');
    previewContainer.style.display = 'none';
    dropZone.style.display = 'flex';
    setTimeout(() => { postBtn.textContent = 'post'; postBtn.disabled = false; }, 2000);
});
