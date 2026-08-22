// Client-side profile-picture compression for League Hub manager photos.
//
// There's no object storage wired into this app, so images are stored
// straight in Postgres as a data: URL (see server/lib/validate.js's
// MAX_IMAGE_DATA_URL cap). Keeping that workable means resizing and
// compressing in the browser before it ever gets sent — a phone photo can
// be 5-10MB; this brings it down to well under 1MB.

const MAX_DIMENSION = 480;
const TARGET_BYTES = 350_000; // ~350KB raw -> ~470KB once base64-encoded
const MIN_QUALITY = 0.5;

const loadImage = (file) => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('That file could not be read as an image.'));
    img.src = URL.createObjectURL(file);
});

// Rough byte size of a data: URL without fully decoding it.
const dataUrlBytes = (dataUrl) => Math.ceil((dataUrl.length - dataUrl.indexOf(',') - 1) * 0.75);

export const compressImageFile = async (file) => {
    if (!file.type.startsWith('image/')) {
        throw new Error('Choose an image file.');
    }

    const img = await loadImage(file);
    try {
        const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        let quality = 0.85;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);
        while (dataUrlBytes(dataUrl) > TARGET_BYTES && quality > MIN_QUALITY) {
            quality -= 0.1;
            dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        return dataUrl;
    } finally {
        URL.revokeObjectURL(img.src);
    }
};
