// Routes pour gérer les élections et les candidats.
// - Les candidats sont listés par niveau (par exemple L1, L2...).
// - Seuls les Admins peuvent créer/modifier/supprimer des candidats.
// - Tout utilisateur authentifié peut voter (ce code n'empêche pas le multi-vote,
//   si vous voulez un système de vote sécurisé il faudra ajouter un mécanisme pour
//   bloquer les doubles votes par utilisateur).
import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import Candidate from '../models/Candidate';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

// Prépare le dossier de stockage local pour les images uploadées
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer: stockage sur disque pour les images
const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (_req, file, cb) {
    const safe = Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    cb(null, safe);
  }
});

const upload = multer({
  storage,
  fileFilter: function (_req, file, cb) {
    // Accepte seulement les images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5 MB
});

// GET /api/elections/candidates?level=L1
// - Description: liste les candidats pour un niveau donné (optionnel).
router.get('/candidates', async (req, res) => {
  try {
    const level = req.query.level as string | undefined;
    const filter: any = {};
    if (level) filter.level = level;

    console.log('GET /api/elections/candidates filter=', filter);
    const list = await Candidate.find(filter).sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    console.error('Error GET /api/elections/candidates', err);
    res.status(500).json({ message: 'Failed to list candidates' });
  }
});

// POST /api/elections/upload-photo
// - Description: upload d'une image de candidat, stockage local dans /uploads
// - Accès: utilisateur authentifié (pour permettre aux étudiants de déposer leur candidature)
router.post('/upload-photo', requireAuth, upload.single('photo'), async (req: any, res: any) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const file = req.file;
    const publicUrl = `/uploads/${file.filename}`;

    return res.json({ url: publicUrl, filename: file.filename });
  } catch (err: any) {
    console.error('Error POST /api/elections/upload-photo', err);
    return res.status(500).json({ message: err.message || 'Failed to upload photo' });
  }
});

// POST /api/elections/candidates
// - Rôle: utilisateur authentifié (modifié pour permettre aux étudiants de déposer leur candidature)
// - Description: crée un candidat; si le niveau n'est pas fourni, on met 'L1' par défaut.
router.post('/candidates', requireAuth, async (req, res) => {
  try {
    const payload = { ...req.body };
    if (!payload.level) payload.level = 'L1';
    console.log('POST /api/elections/candidates', payload);
    const c = await Candidate.create(payload);
    res.json(c);
  } catch (err) {
    console.error('Error POST /api/elections/candidates', err);
    res.status(500).json({ message: 'Failed to create candidate' });
  }
});

// PUT /api/elections/candidates/:id
// - Rôle: Admin
// - Description: modifie les informations d'un candidat existant.
router.put('/candidates/:id', requireAuth, requireRole('Admin'), async (req, res) => {
  try {
    const id = req.params.id;
    const updated = await Candidate.findByIdAndUpdate(id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    console.error('Error PUT /api/elections/candidates/:id', err);
    res.status(500).json({ message: 'Failed to update candidate' });
  }
});

// DELETE /api/elections/candidates/:id
// - Rôle: Admin
// - Description: supprime un candidat.
router.delete('/candidates/:id', requireAuth, requireRole('Admin'), async (req, res) => {
  try {
    const id = req.params.id;
    await Candidate.findByIdAndDelete(id);
    res.json({ ok: true });
  } catch (err) {
    console.error('Error DELETE /api/elections/candidates/:id', err);
    res.status(500).json({ message: 'Failed to delete candidate' });
  }
});

// POST /api/elections/vote/:id
// - Rôle: utilisateur authentifié
// - Description simple: incrémente le compteur de votes pour le candidat donné.
// - Note: ce code n'empêche pas un utilisateur de voter plusieurs fois. Si vous
//   souhaitez éviter cela, il faudra implémenter un mécanisme qui enregistre
//   qui a voté (par ex. une collection 'votes' liant userId -> candidateId).
router.post('/vote/:id', requireAuth, async (req, res) => {
  const id = req.params.id;
  const c = await Candidate.findByIdAndUpdate(id, { $inc: { votes: 1 } }, { new: true });
  res.json(c);
});

export default router;
