import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import AbsenceRequest from '../models/AbsenceRequest';
import User from '../models/User';
import { requireAuth, requireRole, requireRoleOrEmail } from '../middleware/auth';
import type { AuthRequest } from '../middleware/auth';

const router = Router();

const ABSENCE_DELEGATE_EMAILS = [
  'mariama1.diallo@univ-labe.edu.gn',
  'alpharahma2018@gmail.com',
  'dep.math@univ-labe.edu.gn',
];

const uploadsDir = path.join(__dirname, '..', '..', 'uploads', 'absences');
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
    const ok =
      file.mimetype === 'application/pdf' ||
      file.mimetype.startsWith('image/') ||
      file.mimetype === 'application/msword' ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    if (ok) cb(null, true);
    else cb(new Error('Formats acceptés : PDF, image, Word'));
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

function canReview(user: AuthRequest['user']) {
  if (!user) return false;
  if (user.isSuperAdmin) return true;
  if (String(user.role).toLowerCase() === 'admin') return true;
  const email = String(user.email || '').trim().toLowerCase();
  return ABSENCE_DELEGATE_EMAILS.map((e) => e.toLowerCase()).includes(email);
}

// GET /api/absences — étudiants : leurs demandes ; délégués/admin : toutes
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    let list;
    if (canReview(req.user)) {
      list = await AbsenceRequest.find().sort({ createdAt: -1 });
    } else {
      list = await AbsenceRequest.find({ studentId: req.user?.id as string }).sort({ createdAt: -1 });
    }
    res.json(list);
  } catch (err) {
    console.error('GET /api/absences', err);
    res.status(500).json({ message: 'Impossible de charger les demandes' });
  }
});

// POST /api/absences — étudiants uniquement (pièce jointe optionnelle)
router.post(
  '/',
  requireAuth,
  requireRole('Student'),
  upload.single('file'),
  async (req: AuthRequest, res) => {
    try {
      const {
        subject,
        message,
        requestType,
        addressee,
        classe,
        startDate,
        endDate,
      } = req.body;

      if (!subject?.trim() || !message?.trim()) {
        return res.status(400).json({ message: 'Objet et message requis' });
      }

      let attachmentUrl: string | undefined;
      let attachmentName: string | undefined;
      if (req.file) {
        attachmentUrl = `/uploads/absences/${req.file.filename}`;
        attachmentName = req.file.originalname;
      }

      const userDoc = await User.findById(req.user?.id);
      if (!userDoc) return res.status(401).json({ message: 'Utilisateur introuvable' });

      const doc = await AbsenceRequest.create({
        studentId: userDoc._id,
        studentName: userDoc.name,
        studentEmail: userDoc.email,
        classe: classe || undefined,
        requestType: requestType || 'absence',
        addressee: addressee || 'chef_departement',
        subject: String(subject).trim(),
        message: String(message).trim(),
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        attachmentUrl,
        attachmentName,
        status: 'pending',
      });

      res.status(201).json(doc);
    } catch (err) {
      console.error('POST /api/absences', err);
      res.status(500).json({ message: 'Impossible d\'envoyer la demande' });
    }
  }
);

// PATCH /api/absences/:id — délégués / admin : accepter ou rejeter
router.patch('/:id', requireAuth, requireRoleOrEmail('Admin', ABSENCE_DELEGATE_EMAILS), async (req: AuthRequest, res) => {
  try {
    const { status, reviewNote } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Statut invalide (approved ou rejected)' });
    }

    const reviewer = await User.findById(req.user?.id);
    const updated = await AbsenceRequest.findByIdAndUpdate(
      req.params.id,
      {
        status,
        reviewNote: reviewNote || '',
        reviewedByEmail: req.user?.email,
        reviewedByName: reviewer?.name || req.user?.email,
        reviewedAt: new Date(),
      },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: 'Demande introuvable' });
    res.json(updated);
  } catch (err) {
    console.error('PATCH /api/absences/:id', err);
    res.status(500).json({ message: 'Impossible de mettre à jour la demande' });
  }
});

export default router;
