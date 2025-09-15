//// filepath: c:\Users\thiag\projetos_dot\central-cacambas\backend\src\gridfs.ts
import mongoose from 'mongoose';
import { GridFSBucket, ObjectId } from 'mongodb';

let bucket: GridFSBucket | null = null;

function init() {
  if (!bucket && mongoose.connection.db) {
    bucket = new GridFSBucket(mongoose.connection.db, { bucketName: 'uploads' });
    console.log('[GridFS] Inicializado bucket uploads');
  }
}

mongoose.connection.once('open', init);

export function getBucket(): GridFSBucket {
  if (!bucket) throw new Error('GridFS não inicializado ainda');
  return bucket;
}

export async function uploadBufferToGridFS(
  buffer: Buffer,
  filename: string,
  contentType?: string
): Promise<ObjectId> {
  const bucket = getBucket();
  return new Promise<ObjectId>((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(filename, {
      contentType: contentType || 'application/octet-stream',
      metadata: { originalName: filename }
    });

    uploadStream.on('error', reject);
    uploadStream.on('finish', () => {
      resolve(uploadStream.id as ObjectId);
    });

    uploadStream.end(buffer);
  });
}