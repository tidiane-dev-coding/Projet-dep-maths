// Routes pour gérer les annonces/publications sur la plateforme.
import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import Announcement from '../models/Announcement';
import { requireAuth, requireAnnouncementManager } from '../middleware/auth';

const router = Router();

const uploadsDir = path.join(__dirname, '..', '..', 'uploads', 'announcements');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, uploadsDir);
  },
  filename(_req, file, cb) {
    const safe = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
    cb(null, safe);
  },
});

const upload = multer({
  storage,
  fileFilter(_req, file, cb) {
    if (file.fieldname === 'image') {
      if (file.mimetype.startsWith('image/')) cb(null, true);
      else cb(new Error('Image : formats JPG, PNG, GIF, WebP uniquement'));
      return;
    }
    if (file.fieldname === 'pdf') {
      if (file.mimetype === 'application/pdf') cb(null, true);
      else cb(new Error('Document : format PDF uniquement'));
      return;
    }
    cb(new Error('Champ fichier invalide'));
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

const uploadMedia = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'pdf', maxCount: 1 },
]);

function mediaFromFiles(files: Express.Multer.File[] | undefined) {
  const out: { imageUrl?: string; pdfUrl?: string; pdfName?: string } = {};
  if (!files?.length) return out;
  for (const f of files) {
    const url = `/uploads/announcements/${f.filename}`;
    if (f.fieldname === 'image') out.imageUrl = url;
    if (f.fieldname === 'pdf') {
      out.pdfUrl = url;
      out.pdfName = f.originalname;
    }
  }
  return out;
}

// GET /api/announcements — public
router.get('/', async (_req, res) => {
  const list = await Announcement.find().sort({ createdAt: -1 });
  res.json(list);
});

// POST /api/announcements — Admin ou délégués, multipart : title, content, image?, pdf?
router.post('/', requireAuth, requireAnnouncementManager, uploadMedia, async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title?.trim() || !content?.trim()) {
      return res.status(400).json({ message: 'Titre et contenu requis' });
    }
    const files = req.files as { image?: Express.Multer.File[]; pdf?: Express.Multer.File[] } | undefined;
    const allFiles = [...(files?.image || []), ...(files?.pdf || [])];
    const media = mediaFromFiles(allFiles);
    const a = await Announcement.create({
      title: title.trim(),
      content: content.trim(),
      ...media,
    });
    res.json(a);
  } catch (err: any) {
    console.error('POST /api/announcements', err);
    res.status(500).json({ message: err.message || 'Erreur lors de la création' });
  }
});

// PUT /api/announcements/:id — Admin ou délégués
router.put('/:id', requireAuth, requireAnnouncementManager, uploadMedia, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    const update: Record<string, string> = {};
    if (title?.trim()) update.title = title.trim();
    if (content?.trim()) update.content = content.trim();

    const files = req.files as { image?: Express.Multer.File[]; pdf?: Express.Multer.File[] } | undefined;
    const allFiles = [...(files?.image || []), ...(files?.pdf || [])];
    Object.assign(update, mediaFromFiles(allFiles));

    const updated = await Announcement.findByIdAndUpdate(id, update, { new: true });
    if (!updated) return res.status(404).json({ message: 'Annonce introuvable' });
    res.json(updated);
  } catch (err: any) {
    console.error('PUT /api/announcements/:id', err);
    res.status(500).json({ message: err.message || 'Erreur lors de la mise à jour' });
  }
});

// DELETE /api/announcements/:id — Admin ou délégués
router.delete('/:id', requireAuth, requireAnnouncementManager, async (req, res) => {
  const { id } = req.params;
  await Announcement.findByIdAndDelete(id);
  res.json({ ok: true });
});

export default router;
