const WORKER_URL = 'https://michs-upload-worker.michs-app.workers.dev';

async function uploadToR2(path, file, contentType) {
    const ct = contentType || (file instanceof File ? file.type : 'application/octet-stream');
    const resp = await fetch(`${WORKER_URL}/${path}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${UPLOAD_SECRET}`, 'Content-Type': ct },
        body: file
    });
    return resp.ok;
}
