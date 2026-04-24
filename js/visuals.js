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

const OWNER = 'michiscoding';
const REPO = 'michiscoding.github.io';
const BRANCH = 'main';
const ALL_TAGS = ['home', 'nature', 'jiu-jitsu', 'vsco', 'random'];

function getToken() {
    let token = localStorage.getItem('gh_token');
    if (!token) {
        token = prompt('enter your github token:');
        if (token) localStorage.setItem('gh_token', token);
    }
    return token;
}

// items: [{ file, base64, name, tags: Set, el }]
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
    const reader = new FileReader();
    reader.onload = e => {
        const base64Full = e.target.result;
        const base64 = base64Full.split(',')[1];
        const name = sanitizeName(file.name);
        const tags = new Set();

        const item = document.createElement('div');
        item.className = 'preview-item';

        const isVideo = file.type.startsWith('video/');
        const media = document.createElement(isVideo ? 'video' : 'img');
        media.src = base64Full;
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

        const entry = { file, base64, name, tags, el: item };
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
    };
    reader.readAsDataURL(file);
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
    const token = getToken();
    if (!token) return;

    postBtn.textContent = 'posting...';
    postBtn.disabled = true;

    const today = new Date();
    const yyyy = String(today.getFullYear());
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const date = `${yyyy}-${mm}-${dd}`;

    const newPhotos = [];
    for (const item of items) {
        const path = `images/${date}/${item.name}`;
        const check = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        let sha;
        if (check.ok) sha = (await check.json()).sha;

        const res = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: `image ${path}`, content: item.base64, branch: BRANCH, ...(sha && { sha }) })
        });

        if (res.ok) {
            newPhotos.push({ src: `/${path}`, tags: [...item.tags], date });
        }
    }

    await patchPhotosJson(token, newPhotos);

    postBtn.textContent = 'posted!';
    items = [];
    cols.forEach(col => col.innerHTML = '');
    previewContainer.style.display = 'none';
    dropZone.style.display = 'flex';
    setTimeout(() => { postBtn.textContent = 'post'; postBtn.disabled = false; }, 2000);
});

async function patchPhotosJson(token, newPhotos) {
    const jsonPath = 'photos.json';
    const jsonRes = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${jsonPath}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const jsonData = await jsonRes.json();
    const existing = JSON.parse(atob(jsonData.content.replace(/\n/g, '')));
    const updated = [...existing, ...newPhotos];
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(updated, null, 2))));
    return fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${jsonPath}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: `add ${newPhotos.length} photo(s)`, content: encoded, sha: jsonData.sha, branch: BRANCH })
    });
}
