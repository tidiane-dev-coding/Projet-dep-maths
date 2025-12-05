// Routes pour gérer les notes (grades)
import { Router, Request, Response } from 'express';
import Grade from '../models/Grade';
import User from '../models/User';
import { requireAuth, requireRole } from '../middleware/auth';

// Petit utilitaire pour échapper les caractères spéciaux avant d'utiliser une chaîne
// dans une expression régulière. Utile pour faire des recherches insensibles à la casse.
function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
}

const router = Router();

// GET /api/grades
// - Si l'utilisateur est un étudiant, on ne retourne que SES notes
// - Si l'utilisateur est Admin/Professor, on retourne tout (ou on peut filtrer par classe)
router.get('/', requireAuth, async (req: Request & { user?: any }, res: Response) => {
  try {
    console.log('GET /api/grades by', (req.user as any)?.id || 'anonymous', 'role=', (req.user as any)?.role, 'query=', req.query)
    // Si le rôle est 'Student', on filtre pour ne renvoyer que les notes qui
    // correspondent à cet étudiant (recherche robuste par email, id ou nom)
  if (req.user?.role === 'Student') {
      try {
  const userId = (req.user as any).id;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });
        const userDoc = await User.findById(userId);
        if (!userDoc) return res.status(401).json({ message: 'Unauthorized' });
        // Prépare plusieurs formes de recherche : email, id, nom, avec recherche
        // insensible à la casse pour le nom et l'email.
        const email = userDoc.email;
        const idStr = userDoc._id.toString();
        const name = userDoc.name;
        const query = {
          $or: [
            { student: email },
            { student: idStr },
            { student: name },
            { student: { $regex: new RegExp('^' + escapeRegExp(email) + '$', 'i') } },
            { student: { $regex: new RegExp('^' + escapeRegExp(name) + '$', 'i') } }
          ]
        };
        console.log('GET /api/grades student query:', query);
        const list = await Grade.find(query);
        return res.json(list);
      } catch (err) {
        console.error('Error resolving student for GET /api/grades', err);
        return res.status(500).json({ message: 'Failed to list grades' });
      }
    }

    // Pour Admin/Professeur : possibilité de filtrer par classe via ?classe=...
    const classe = (req.query.classe as string) || undefined;
    const list = classe ? await Grade.find({ classe }) : await Grade.find();
    res.json(list);
  } catch (err) {
    console.error('Error GET /api/grades', err);
    res.status(500).json({ message: 'Failed to list grades' });
  }
});

// GET /api/grades/me
// - Description: endpoint explicite pour que les étudiants récupèrent uniquement
//   leurs propres notes. Résout l'utilisateur depuis le token et effectue les
//   mêmes recherches robustes que la route principale.
router.get('/me', requireAuth, async (req: Request & { user?: any }, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const userDoc = await User.findById(userId);
    if (!userDoc) return res.status(401).json({ message: 'Unauthorized' });

    const email = userDoc.email;
    const idStr = userDoc._id.toString();
    const name = userDoc.name;
    const query = {
      $or: [
        { student: email },
        { student: idStr },
        { student: name },
        { student: { $regex: new RegExp('^' + escapeRegExp(email) + '$', 'i') } },
        { student: { $regex: new RegExp('^' + escapeRegExp(name) + '$', 'i') } }
      ]
    };
    const list = await Grade.find(query);
    return res.json(list);
  } catch (err) {
    console.error('Error GET /api/grades/me', err);
    return res.status(500).json({ message: 'Failed to list grades' });
  }
});

// POST /api/grades (création) — réservé aux Admins
router.post('/', requireAuth, requireRole(['Admin', 'Professor']), async (req: Request & { user?: any }, res: Response) => {
  try {
    const { student } = req.body;
    if (!student) return res.status(400).json({ message: 'Missing student identifier (email or name)' });
    // On essaie d'abord de trouver l'étudiant par email, puis par nom en fallback
    let u = await User.findOne({ email: student });
    if (!u) {
      u = await User.findOne({ name: student });
    }
    if (!u) return res.status(400).json({ message: 'Student not found (please provide student email or full name)' });
    // On stocke la note en standardisant le champ student sur l'email
    const payload = { ...req.body, student: u.email };
    const g = await Grade.create(payload);
    console.log('Grade created by', (req.user as any)?.id, 'for student', u.email, 'gradeId=', g._id);
    res.json(g);
  } catch (err) {
    console.error('Error POST /api/grades', err);
    res.status(500).json({ message: 'Failed to create grade' });
  }
});

// PUT /api/grades/:id — mise à jour d'une note (Admin seulement)
router.put('/:id', requireAuth, requireRole(['Admin', 'Professor']), async (req: Request, res: Response) => {
  try {
    const updated = await Grade.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    console.error('Error PUT /api/grades/:id', err);
    res.status(500).json({ message: 'Failed to update grade' });
  }
});

// DELETE /api/grades/:id — suppression d'une note (Admin seulement)
router.delete('/:id', requireAuth, requireRole('Admin'), async (req: Request, res: Response) => {
  try {
    await Grade.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    console.error('Error DELETE /api/grades/:id', err);
    res.status(500).json({ message: 'Failed to delete grade' });
  }
});

// Endpoint d'administration : lister les notes correspondant à un email donné
router.get('/debug/by-email', requireAuth, requireRole('Admin'), async (req: Request, res: Response) => {
  try {
    const email = (req.query.email as string) || '';
    if (!email) return res.status(400).json({ message: 'Missing email query param' });
    const grades = await Grade.find({ $or: [{ student: email }, { student: { $regex: new RegExp('^' + escapeRegExp(email) + '$', 'i') } }] });
    return res.json({ email, count: grades.length, grades });
  } catch (err) {
    console.error('Error GET /api/grades/debug/by-email', err);
    return res.status(500).json({ message: 'Failed' });
  }
});

// Endpoint d'administration : migrer tous les champs 'student' vers l'email canonique
router.post('/migrate-to-emails', requireAuth, requireRole('Admin'), async (req: Request, res: Response) => {
  try {
    const all = await Grade.find();
    let updated = 0;
    for (const g of all) {
      const s = String((g as any).student || '');
      if (!s) continue;
      // On tente plusieurs moyens de trouver l'utilisateur correspondant
      let u = await User.findOne({ email: s });
      if (!u) u = await User.findById(s).catch(() => null as any);
      if (!u) u = await User.findOne({ name: s });
      if (u && u.email && s !== u.email) {
        (g as any).student = u.email;
        await g.save();
        updated += 1;
      }
    }
    return res.json({ ok: true, migrated: updated });
  } catch (err) {
    console.error('Error POST /api/grades/migrate-to-emails', err);
    return res.status(500).json({ message: 'Failed to migrate' });
  }
});

export default router;
