/**
 * Browser-side photo compression. Re-encoding through a canvas resizes the
 * image AND strips EXIF/GPS metadata, which protects seller location.
 */
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const MAX_INPUT_BYTES = 10 * 1024 * 1024;

export async function compressImage(file: File, maxSize = 1200, quality = 0.8): Promise<Blob> {
  if (!ALLOWED.includes(file.type)) throw new Error("Only JPG, PNG or WebP photos are allowed.");
  if (file.size > MAX_INPUT_BYTES) throw new Error("Photo is too large (max 10MB).");

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not process photo."))), "image/webp", quality),
  );
}
