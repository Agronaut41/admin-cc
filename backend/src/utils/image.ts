import sharp from 'sharp';

export interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 1-100
  format?: 'webp' | 'jpeg' | 'avif';
}

export async function compressImage(
  buffer: Buffer,
  filename: string,
  opts: CompressOptions = {}
): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
  const {
    maxWidth = 1280,
    maxHeight = 1280,
    quality = 75,
    format = 'webp'
  } = opts;

  const pipeline = sharp(buffer, { failOnError: false }).rotate().resize({
    width: maxWidth,
    height: maxHeight,
    fit: 'inside',
    withoutEnlargement: true
  });

  let out: Buffer;
  let contentType = 'image/webp';
  let outExt = 'webp';

  if (format === 'jpeg') {
    out = await pipeline.jpeg({ quality, mozjpeg: true }).toBuffer();
    contentType = 'image/jpeg';
    outExt = 'jpg';
  } else if (format === 'avif') {
    out = await pipeline.avif({ quality }).toBuffer();
    contentType = 'image/avif';
    outExt = 'avif';
  } else {
    out = await pipeline.webp({ quality }).toBuffer();
    contentType = 'image/webp';
    outExt = 'webp';
  }

  const base = filename.replace(/\.[^.]+$/, '');
  return { buffer: out, contentType, filename: `${base}.${outExt}` };
}

export function extractGridFsIdFromUrl(url?: string): string | null {
  if (!url) return null;
  const m = url.match(/\/files\/([a-f\d]{24})/i);
  return m ? m[1] : null;
}