// sharp is a native module — loaded dynamically so the server starts even if
// the Linux binary isn't present (image compression is silently skipped).
let sharpLib: typeof import("sharp") | null = null;
async function getSharp() {
  if (sharpLib) return sharpLib;
  try {
    sharpLib = (await import("sharp")).default as unknown as typeof import("sharp");
    return sharpLib;
  } catch {
    return null;
  }
}

const MAX_SIZE_MB = 1;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

/**
 * Compress image to fit within 1MB limit while maintaining aspect ratio
 * @param buffer - Image buffer
 * @param mimeType - Image MIME type (e.g., 'image/jpeg')
 * @returns Compressed image buffer
 */
export async function compressImage(buffer: Buffer, _mimeType: string = "image/jpeg"): Promise<Buffer> {
  const sharp = await getSharp();
  if (!sharp) {
    console.warn("[Image Compression] sharp not available — returning original buffer");
    return buffer;
  }

  try {
    // Start with 80% quality and adjust if needed
    let quality = 80;
    let compressed = buffer;

    // If already under 1MB, normalize orientation and return
    if (buffer.length <= MAX_SIZE_BYTES) {
      return await sharp(buffer)
        .rotate() // Normalize EXIF orientation
        .jpeg({ quality: 90, progressive: true })
        .toBuffer();
    }

    // Iteratively compress until under 1MB
    while (compressed.length > MAX_SIZE_BYTES && quality > 10) {
      compressed = await sharp(buffer)
        .rotate() // Normalize EXIF orientation
        .resize(1920, 1080, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .jpeg({ quality, progressive: true })
        .toBuffer();

      quality -= 10;
    }

    // If still too large, reduce dimensions
    if (compressed.length > MAX_SIZE_BYTES) {
      compressed = await sharp(buffer)
        .rotate() // Normalize EXIF orientation
        .resize(1280, 720, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .jpeg({ quality: 60, progressive: true })
        .toBuffer();
    }

    // Final fallback: aggressive compression
    if (compressed.length > MAX_SIZE_BYTES) {
      compressed = await sharp(buffer)
        .rotate() // Normalize EXIF orientation
        .resize(800, 600, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .jpeg({ quality: 40, progressive: true })
        .toBuffer();
    }

    return compressed;
  } catch (error) {
    console.error("[Image Compression] Error compressing image:", error);
    throw new Error("Failed to compress image");
  }
}

/**
 * Get image dimensions
 * @param buffer - Image buffer
 * @returns Object with width and height
 */
export async function getImageDimensions(buffer: Buffer): Promise<{ width: number; height: number }> {
  const sharp = await getSharp();
  if (!sharp) {
    return { width: 0, height: 0 };
  }
  try {
    const metadata = await sharp(buffer).metadata();
    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
    };
  } catch (error) {
    console.error("[Image Compression] Error getting image dimensions:", error);
    throw new Error("Failed to get image dimensions");
  }
}
