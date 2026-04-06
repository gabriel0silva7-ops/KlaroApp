import path from "path";
import fs from "fs";

/**
 * Storage abstraction layer.
 * Currently uses local filesystem. Designed to be swapped for S3-compatible storage later.
 * TODO: Replace this implementation with an S3 client when migrating to cloud storage.
 */

const UPLOAD_DIR = path.resolve(process.cwd(), "uploads");

// Ensure the upload directory exists on startup
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export interface StorageFile {
  originalName: string;
  storedPath: string;
  mimeType: string;
  size: number;
}

/**
 * Save a file buffer to local storage and return metadata.
 * The path structure is: uploads/{userId}/{timestamp}-{originalName}
 * TODO: When migrating to S3, replace with: s3.putObject({ Bucket, Key: storedPath, Body: buffer })
 */
export async function saveFile(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
  userId: number,
): Promise<StorageFile> {
  const userDir = path.join(UPLOAD_DIR, String(userId));
  if (!fs.existsSync(userDir)) {
    fs.mkdirSync(userDir, { recursive: true });
  }

  const timestamp = Date.now();
  const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filename = `${timestamp}-${safeName}`;
  const fullPath = path.join(userDir, filename);

  await fs.promises.writeFile(fullPath, buffer);

  // Store relative path for portability
  const storedPath = path.relative(process.cwd(), fullPath);

  return {
    originalName,
    storedPath,
    mimeType,
    size: buffer.length,
  };
}

/**
 * Delete a stored file by its relative path.
 * TODO: When migrating to S3, replace with: s3.deleteObject({ Bucket, Key: storedPath })
 */
export async function deleteFile(storedPath: string): Promise<void> {
  const fullPath = path.resolve(process.cwd(), storedPath);
  if (fs.existsSync(fullPath)) {
    await fs.promises.unlink(fullPath);
  }
}
