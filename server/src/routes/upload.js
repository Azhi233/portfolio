import express from 'express';
import multer from 'multer';
import { uploadFile } from '../utils/minio.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20480 * 1024 * 1024 } });

router.post('/', upload.single('file'), async (req, res, next) => {
  try {
    const file = req.file;
    const type = String(req.body?.type || 'public').toLowerCase();

    if (!file) {
      return res.status(400).json({ ok: false, message: 'file is required.' });
    }

    const isPrivate = type === 'private';
    const result = await uploadFile(file.buffer, file.originalname, isPrivate, file.mimetype || 'application/octet-stream');

    return res.status(201).json({
      ok: true,
      data: {
        ...result,
        fileType: file.mimetype || 'application/octet-stream',
        fileName: file.originalname,
        size: file.size,
      },
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
