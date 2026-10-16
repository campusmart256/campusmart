/**
 * Shrinks a photo in the browser before upload (saves mobile data, and drops hidden
 * location data because the picture is redrawn). Runs only in the browser.
 * @param {File} file
 * @param {number} [maxSide]
 * @returns {Promise<Blob>}
 */
export async function compressPhoto(file, maxSide = 1280) {
	const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
	const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
	const width = Math.max(1, Math.round(bitmap.width * scale));
	const height = Math.max(1, Math.round(bitmap.height * scale));
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('Could not prepare the photo');
	ctx.drawImage(bitmap, 0, 0, width, height);
	bitmap.close?.();
	/** @param {string} type @param {number} q */
	const toBlob = (type, q) => new Promise((resolve) => canvas.toBlob(resolve, type, q));
	let blob = /** @type {Blob | null} */ (await toBlob('image/webp', 0.8));
	if (!blob || blob.type !== 'image/webp') blob = /** @type {Blob | null} */ (await toBlob('image/jpeg', 0.82));
	if (!blob) throw new Error('Could not prepare the photo');
	return blob;
}

/**
 * Crops the middle square of a picture and shrinks it for use as a profile picture.
 * @param {File} file
 * @param {number} [side]
 * @returns {Promise<Blob>}
 */
export async function compressAvatar(file, side = 512) {
	const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
	const crop = Math.min(bitmap.width, bitmap.height);
	const sx = Math.round((bitmap.width - crop) / 2);
	const sy = Math.round((bitmap.height - crop) / 2);
	const out = Math.min(side, crop);
	const canvas = document.createElement('canvas');
	canvas.width = out;
	canvas.height = out;
	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('Could not prepare the picture');
	ctx.drawImage(bitmap, sx, sy, crop, crop, 0, 0, out, out);
	bitmap.close?.();
	/** @param {string} type @param {number} q */
	const toBlob = (type, q) => new Promise((resolve) => canvas.toBlob(resolve, type, q));
	let blob = /** @type {Blob | null} */ (await toBlob('image/webp', 0.85));
	if (!blob || blob.type !== 'image/webp') blob = /** @type {Blob | null} */ (await toBlob('image/jpeg', 0.85));
	if (!blob) throw new Error('Could not prepare the picture');
	return blob;
}
