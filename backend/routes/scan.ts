import multer from 'multer';
import { Router } from 'express';
import { createWorker } from 'tesseract.js';
import type { Request, Response } from 'express';

const router = Router();
export default router;

const upload = multer({ storage: multer.memoryStorage() });

router.post('/', upload.any(), async (req, res): Promise<void> => {

  const files = req.files as Express.Multer.File[] | undefined;
  if (!files || files.length === 0) {
    res.status(400).json({ error: 'No file sent.' });
    return;
  }

  const lang = (req.body.lang as string) || 'eng';

  const worker = await createWorker(lang, 1, { cacheMethod: 'none' });

  try {
    let resText = ""
    for (const file of files) {
      const { data } = await worker.recognize(file.buffer);
      resText += data.text + '<END_PAGE/>';
    }
    res.json({ text: resText.trim() });
  } catch (error) {
    console.error('OCR Error:', (error as Error).message);
    res.status(500).json({ error: 'Error processing the image.' });
  } finally {
    await worker.terminate();
  }
});

router.use((err: any, req: Request, res: Response, next: any) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});