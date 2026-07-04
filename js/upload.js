const WORKER_URL = 'https://michs-upload-worker.michs-app.workers.dev';

async function uploadToR2(path, file, contentType) {
    let secret = localStorage.getItem('uploadSecret');
    if (!secret) {
        secret = prompt('Enter upload secret:');
        if (!secret) return false;
        localStorage.setItem('uploadSecret', secret);
    }
    const ct = contentType || (file instanceof File ? file.type : 'application/octet-stream');
    const resp = await fetch(`${WORKER_URL}/${path}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${secret}`, 'Content-Type': ct },
        body: file
    });
    if (resp.status === 401 || resp.status === 403) localStorage.removeItem('uploadSecret');
    return resp.ok;
}
