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

const ALL_TAGS = ['home', 'nature', 'jiu-jitsu', 'vsco', 'friends', 'me', 'tattoos'];

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
    Array.from(e.dataTransfer.files).forEach(addPreview);
});

fileInput.addEventListener('change', () => {
    Array.from(fileInput.files).forEach(addPreview);
    fileInput.value = '';
});

function todayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

async function addPreview(file) {
    const isHeic = file.type === 'image/heic' || file.type === 'image/heif' || /\.(heic|heif)$/i.test(file.name);
    if (isHeic) {
        const placeholder = document.createElement('div');
        placeholder.className = 'preview-item visible';
        placeholder.style.cssText = 'display:flex;align-items:center;justify-content:center;aspect-ratio:1;background:#f0f0f0;font-size:0.75rem;color:#aaa;';
        placeholder.textContent = 'converting...';
        const col = cols[items.length % 3];
        col.appendChild(placeholder);
        dropZone.style.display = 'none';
        previewContainer.style.display = 'flex';
        try {
            const blob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 });
            const result = Array.isArray(blob) ? blob[0] : blob;
            file = new File([result], file.name.replace(/\.(heic|heif)$/i, '.jpg'), { type: 'image/jpeg' });
        } catch(e) {
            console.error('heic conversion failed:', e);
            placeholder.textContent = 'conversion failed';
            return;
        }
        placeholder.remove();
    }
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

    const dateInput = document.createElement('input');
    dateInput.type = 'date';
    dateInput.className = 'date-input';
    dateInput.value = todayStr();

    const entry = { file, tags, el: item, dateInput };
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

    const hoverOverlay = document.createElement('div');
    hoverOverlay.className = 'preview-hover';
    hoverOverlay.appendChild(tagPicker);
    hoverOverlay.appendChild(dateInput);
    item.appendChild(media);
    item.appendChild(removeBtn);
    item.appendChild(hoverOverlay);

    const col = cols[items.length % 3];
    col.appendChild(item);

    dropZone.style.display = 'none';
    previewContainer.style.display = 'flex';

    requestAnimationFrame(() => item.classList.add('visible'));

    if (!isVideo) {
        try {
            const exif = await exifr.parse(file, ['DateTimeOriginal']);
            if (exif?.DateTimeOriginal) {
                const d = new Date(exif.DateTimeOriginal);
                dateInput.value = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
            }
        } catch(e) {}
    }
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

    const rows = [];
    for (const item of items) {
        const date = item.dateInput.value || todayStr();
        const isVideo = item.file.type.startsWith('video/');
        if (isVideo) {
            const form = new FormData();
            form.append('file', item.file);
            form.append('upload_preset', CLOUDINARY_PRESET);
            try {
                const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/video/upload`, { method: 'POST', body: form });
                const json = await res.json();
                if (json.secure_url) { rows.push({ storage_path: json.secure_url, tags: [...item.tags], date }); }
                else { console.error('cloudinary error:', json); }
            } catch(e) { console.error('cloudinary error:', e); }
        } else {
            const name = sanitizeName(item.file.name);
            const path = `photos/${date}/${name}`;
            const { error } = await adminDb.storage.from('media').upload(path, item.file, { upsert: true, contentType: item.file.type });
            if (error) { console.error('storage error:', error); }
            else { rows.push({ storage_path: path, tags: [...item.tags], date }); }
        }
    }

    if (!rows.length) {
        postBtn.textContent = 'error — check console';
        postBtn.disabled = false;
        return;
    }

    const { error: dbError } = await adminDb.from('photos').insert(rows);
    if (dbError) {
        console.error('db error:', dbError);
        postBtn.textContent = 'error — check console';
        postBtn.disabled = false;
        return;
    }

    postBtn.textContent = 'posted!';
    items = [];
    cols.forEach(col => col.innerHTML = '');
    setTimeout(() => {
        previewContainer.style.display = 'none';
        dropZone.style.display = 'flex';
        postBtn.textContent = 'post';
        postBtn.disabled = false;
    }, 1500);
});
