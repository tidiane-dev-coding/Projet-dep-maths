// On importe le routeur d'Express pour définir des routes modularisées.
import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
// Modèle Mongoose représentant une ressource pédagogique (PDF, lien, etc.).
import Resource from '../models/Resource';
// Middlewares pour vérifier l'authentification et le rôle (Admin requis pour certaines actions).
import { requireAuth, requireRole } from '../middleware/auth';

// Création d'un routeur dédié aux ressources.
const router = Router();

// Prépare le dossier de stockage local pour les fichiers uploadés
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer: stockage sur disque, nom de fichier avec timestamp pour éviter collisions
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
    // n'accepte que les PDFs
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are allowed'));
  },
  limits: { fileSize: 20 * 1024 * 1024 } // 20 MB
});

// Route: GET /api/resources
// Description: renvoie la liste des ressources triées par date de création (récentes en premier).
// Accès: public (aucune authentification requise ici), mais on peut facilement le protéger si besoin.
router.get('/', async (req, res) => {
  try {
    // Log serveur pour faciliter le debug lors des appels.
    console.log('GET /api/resources');

    // On récupère toutes les ressources et on les trie par createdAt décroissant.
    const list = await Resource.find().sort({ createdAt: -1 });

    // On renvoie les ressources au client au format JSON.
    res.json(list);
  } catch (err) {
    // En cas d'erreur, on log et on renvoie une 500 au client.
    console.error('Error GET /api/resources', err);
    res.status(500).json({ message: 'Failed to list resources' });
  }
});

// Route: POST /api/resources
// Description: création d'une nouvelle ressource en base.
// Accès: protégé -> seul un utilisateur avec le rôle 'Admin' peut créer une ressource.
router.post('/', requireAuth, requireRole('Admin'), async (req, res) => {
  try {
    // On log le corps de la requête pour le debug.
    console.log('POST /api/resources', req.body);

    // On crée le document Resource à partir du corps de la requête.
    const r = await Resource.create(req.body);

    // On renvoie la ressource créée.
    res.json(r);
  } catch (err) {
    console.error('Error POST /api/resources', err);
    res.status(500).json({ message: 'Failed to create resource' });
  }
});

// Route: POST /api/resources/upload
// Description: upload d'un fichier PDF, stockage local dans /uploads et création
// d'un document Resource (url pointant vers /uploads/<filename>). Accès: Admin.
router.post('/upload', requireAuth, requireRole('Admin'), upload.single('file'), async (req: any, res: any) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const file = req.file;
    const publicUrl = `/uploads/${file.filename}`;

    // Crée la ressource en base
    const r = await Resource.create({
      title: req.body.title || file.originalname,
      subject: req.body.subject,
      semester: req.body.semester,
      level: req.body.level,
      url: publicUrl,
      uploadedBy: (req.user as any)?.email || (req.user as any)?.id
    });

    return res.json(r);
  } catch (err) {
    console.error('Error POST /api/resources/upload', err);
    return res.status(500).json({ message: 'Failed to upload resource' });
  }
});

// Route helper: GET /uploads/:filename
// Note: si l'application principale expose déjà les fichiers statiques, cette
// route n'est pas nécessaire. Gardée pour compatibilité si static middleware
// n'est pas configuré.
router.get('/uploads/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(uploadsDir, filename);
    if (!fs.existsSync(filePath)) return res.status(404).send('Not found');
    res.sendFile(filePath);
  } catch (err) {
    console.error('Error GET /uploads/:filename', err);
    res.status(500).send('Server error');
  }
});

// Route: DELETE /api/resources/:id
// Description: supprime une ressource par son identifiant MongoDB.
// Accès: protégé -> réservé aux Admins.
router.delete('/:id', requireAuth, requireRole('Admin'), async (req, res) => {
  try {
    const id = req.params.id;

    // On supprime la ressource correspondante.
    await Resource.findByIdAndDelete(id);

    // On renvoie un petit objet indiquant le succès.
    res.json({ ok: true });
  } catch (err) {
    console.error('Error DELETE /api/resources/:id', err);
    res.status(500).json({ message: 'Failed to delete resource' });
  }
});

// Export du routeur pour l'enregistrement dans l'application principale.
export default router;
