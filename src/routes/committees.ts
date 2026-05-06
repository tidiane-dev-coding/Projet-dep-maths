// Routes pour gérer les membres des comités (CommitteeMember).
// Un 'CommitteeMember' représente une personne (ou un poste) au sein d'un comité pour un niveau donné.
import { Router } from 'express';
import multer from 'multer';
import { uploadImageBufferToCloudinary } from '../utils/cloudinary';
import CommitteeMember from '../models/CommitteeMember';
import { requireAuth, requireRoleOrEmail } from '../middleware/auth';

const router = Router();
const COMMITTEE_DELEGATE_EMAILS = [
  'mariama1.diallo@univ-labe.edu.gn',
  'alpharahma2018@gmail.com',
];

// Use memory storage for direct Cloudinary upload
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  fileFilter: function (_req, file, cb) {
    // Accept images only
    if (file.mimetype.startsWith('image/')) cb(null, true)
    else cb(new Error('Only image files are allowed'))
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5 MB
})

// GET /api/committees?level=L1
// - Description: retourne la liste des membres de comité.
// - Paramètre optionnel 'level' (par ex. 'L1') pour filtrer par niveau/licence.
// - Accès: public dans cette implémentation (on pourrait restreindre si nécessaire).
router.get('/', async (req, res) => {
  try {
    const level = req.query.level as string | undefined;
    const filter: any = {};
    if (level) filter.level = level;

    console.log('GET /api/committees filter=', filter);

    // On récupère les membres correspondant au filtre et on trie par date de création (ancien-> récent).
    const list = await CommitteeMember.find(filter).sort({ createdAt: 1 });
    res.json(list);
  } catch (err) {
    console.error('Error GET /api/committees', err);
    res.status(500).json({ message: 'Failed to list committees' });
  }
});

// POST /api/committees/upload-photo
// - Description: upload d'une image de membre vers Cloudinary
// - Accès: Admin
router.post('/upload-photo', requireAuth, requireRoleOrEmail('Admin', COMMITTEE_DELEGATE_EMAILS), upload.single('photo'), async (req: any, res: any) => {
  try {
    // Debug logs to help diagnose upload issues
    console.log('POST /api/committees/upload-photo headers:', {
      'content-type': req.headers['content-type'],
      authorization: !!req.headers['authorization']
    });
    console.log('req.file present?', !!req.file);
    // If multer didn't parse a file, return more diagnostic info to the client
    if (!req.file) {
      return res.status(400).json({
        message: 'No file uploaded',
        info: {
          contentType: req.headers['content-type'] || null,
          bodyKeys: req.body ? Object.keys(req.body) : [],
        }
      });
    }

    const file = req.file as any
    if (!file) return res.status(400).json({ message: 'No file uploaded' })

    try {
      const uploaded = await uploadImageBufferToCloudinary(file.buffer, file.originalname)
      const publicUrl = uploaded.secure_url

      console.log('Committee photo uploaded to Cloudinary:', file.originalname, 'size:', file.size, 'publicUrl:', publicUrl)
      return res.json({ url: publicUrl, publicId: uploaded.public_id })
    } catch (err: any) {
      console.error('Error saving uploaded file', err)
      return res.status(500).json({ message: err.message || 'Failed to save uploaded file' })
    }
  } catch (err: any) {
    console.error('Error POST /api/committees/upload-photo', err);
    return res.status(500).json({ message: err.message || 'Failed to upload photo' });
  }
});

// POST /api/committees
// - Rôle: Admin
// - Description: ajoute un membre au comité pour un niveau donné.
router.post('/', requireAuth, requireRoleOrEmail('Admin', COMMITTEE_DELEGATE_EMAILS), async (req, res) => {
  try {
    console.log('POST /api/committees', req.body);
    const c = await CommitteeMember.create(req.body);
    res.json(c);
  } catch (err) {
    console.error('Error POST /api/committees', err);
    // If it's a Mongoose validation error, return 400 with details
    if ((err as any)?.name === 'ValidationError') {
      const details: any = {}
      for (const key in (err as any).errors) {
        details[key] = (err as any).errors[key].message
      }
      return res.status(400).json({ message: 'Validation failed', details })
    }
    // Otherwise return the error message to help debugging
    res.status(500).json({ message: (err as any)?.message || 'Failed to create committee member' });
  }
});

// PUT /api/committees/:id
// - Rôle: Admin
// - Description: met à jour les informations d'un membre de comité existant.
router.put('/:id', requireAuth, requireRoleOrEmail('Admin', COMMITTEE_DELEGATE_EMAILS), async (req, res) => {
  try {
    const id = req.params.id;
    const updated = await CommitteeMember.findByIdAndUpdate(id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    console.error('Error PUT /api/committees/:id', err);
    res.status(500).json({ message: 'Failed to update committee member' });
  }
});

// DELETE /api/committees/:id
// - Rôle: Admin
// - Description: supprime un membre de comité par son id.
router.delete('/:id', requireAuth, requireRoleOrEmail('Admin', COMMITTEE_DELEGATE_EMAILS), async (req, res) => {
  try {
    const id = req.params.id;
    await CommitteeMember.findByIdAndDelete(id);
    res.json({ ok: true });
  } catch (err) {
    console.error('Error DELETE /api/committees/:id', err);
    res.status(500).json({ message: 'Failed to delete' });
  }
});

export default router;
