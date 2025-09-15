//// filepath: c:\Users\thiag\projetos_dot\central-cacambas\backend\src\upload.ts
// Substitui qualquer storage anterior (disk / cloud) por memória para enviar ao GridFS
import multer from 'multer';

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});