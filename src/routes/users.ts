// Routes pour la gestion des utilisateurs (CRUD basique).
// Note: certaines actions sont réservées aux Admins via le middleware requireRole.
import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import User from '../models/User';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

// Prepare uploads directory (same folder used by other routes)
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage for user avatars (timestamp-prefixed filename)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    const filename = `${Date.now()}-${Math.round(Math.random()*1e9)}${ext}`;
    cb(null, filename);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

// GET /api/users
// - Rôle: lecture
// - Description: renvoie tous les utilisateurs. Protégé: nécessite une authentification.
router.get('/', requireAuth, async (req, res) => {
  const users = await User.find();
  res.json(users);
});

// GET /api/users/:id
// - Rôle: lecture
// - Description: renvoie un utilisateur par son identifiant.
router.get('/:id', requireAuth, async (req, res) => {
  const u = await User.findById(req.params.id);
  res.json(u);
});

// POST /api/users
// - Rôle: public (mais attention)
// - Description: création d'un nouvel utilisateur. Ce endpoint était public dans le projet,
//   mais on doit éviter que quelqu'un crée un compte avec le rôle 'Admin' via cette route.
// - Protection ajoutée: si le corps contient role='Admin', on refuse la création publique.
router.post('/', async (req, res) => {
  // Empêcher la création d'un Admin via cet endpoint public.
  if (req.body?.role === 'Admin') {
    return res.status(403).json({ message: 'Cannot create Admin via this endpoint' });
  }

  const u = await User.create(req.body);
  res.json(u);
});

// POST /api/users/:id/avatar
// Upload avatar image for a user and update user.avatarUrl
// Note: this route is intentionally public to allow uploading just after creating a user
router.post('/:id/avatar', upload.single('avatar'), async (req: any, res: any) => {
  try {
    const userId = req.params.id;
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const file = req.file;
  const host = process.env.BASE_URL || process.env.VITE_API_URL || `http://localhost:${process.env.PORT || 5000}`;
  const publicUrl = `${host.replace(/\/$/, '')}/uploads/${file.filename}`;
  const updated = await User.findByIdAndUpdate(userId, { avatarUrl: publicUrl }, { new: true });
    return res.json({ ok: true, user: updated });
  } catch (err: any) {
    console.error('Error uploading avatar', err);
    return res.status(500).json({ message: err.message || 'Failed to upload avatar' });
  }
});

// PUT /api/users/:id
// - Rôle: Admin
// - Description: modification d'un utilisateur existant. Réservé aux Admins.
router.put('/:id', requireAuth, requireRole('Admin'), async (req, res) => {
  const u = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(u);
});

// DELETE /api/users/:id
// - Rôle: Admin
// - Description: suppression d'un utilisateur. Réservé aux Admins.
router.delete('/:id', requireAuth, requireRole('Admin'), async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

export default router;
