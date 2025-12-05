// Routes pour gérer les annonces/publications sur la plateforme.
// Les annonces peuvent être listées publiquement, mais seules les personnes
// ayant le rôle 'Admin' peuvent en créer, modifier ou supprimer.
import { Router } from 'express';
import Announcement from '../models/Announcement';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

// GET /api/announcements
// - Description: retourne la liste des annonces, les plus récentes en premier.
// - Accès: public
router.get('/', async (req, res) => {
  const list = await Announcement.find().sort({ createdAt: -1 });
  res.json(list);
});

// POST /api/announcements
// - Rôle: Admin
// - Description: créer une nouvelle annonce. On attend { title, content } dans le corps.
router.post('/', requireAuth, requireRole('Admin'), async (req, res) => {
  const { title, content } = req.body;
  const a = await Announcement.create({ title, content });
  res.json(a);
});

// PUT /api/announcements/:id
// - Rôle: Admin
// - Description: met à jour une annonce existante par son identifiant.
router.put('/:id', requireAuth, requireRole('Admin'), async (req, res) => {
  const { id } = req.params;
  const updated = await Announcement.findByIdAndUpdate(id, req.body, { new: true });
  res.json(updated);
});

// DELETE /api/announcements/:id
// - Rôle: Admin
// - Description: supprime une annonce par son identifiant.
router.delete('/:id', requireAuth, requireRole('Admin'), async (req, res) => {
  const { id } = req.params;
  await Announcement.findByIdAndDelete(id);
  res.json({ ok: true });
});

export default router;
