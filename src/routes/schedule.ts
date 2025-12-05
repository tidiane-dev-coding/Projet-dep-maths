// Routes pour gérer l'emploi du temps (Schedule).
// Ce fichier définit des endpoints HTTP qui permettent de lire et de modifier
// les créneaux d'un emploi du temps (par exemple: jour, matière, professeur, salle, classe).
// Les actions sensibles (ajout / modification / suppression) sont réservées aux Admins.
import { Router } from 'express';
import Schedule from '../models/Schedule';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

// GET /api/schedule?classe=L1
// - Rôle: lecture
// - Description simple: retourne les créneaux pour une classe spécifique.
// - Comportement selon le rôle utilisateur:
//   * Admin: peut lister toutes les classes ou filtrer par le paramètre 'classe'.
//   * Non-admin: on retourne uniquement la classe explicitement demandée (si fournie),
//     sinon on ne renvoie rien (tableau vide) pour éviter d'exposer tout le planning.
router.get('/', requireAuth, async (req, res) => {
  try {
    // Petit log pour tracer qui a demandé la liste.
    console.log('GET /api/schedule by', req.user?.email || 'anonymous');

    // On tente de lire la query 'classe' fournie par le client.
    // Si elle n'existe pas, on essaye aussi req.user?.classe (si on stocke la classe de l'utilisateur).
    const classe = (req.query.classe as string) || (req.user?.classe as string) || undefined;

  let list: any[];

    if (req.user?.role === 'Admin') {
      // Si l'utilisateur est Admin, il peut soit demander une classe précise,
      // soit récupérer toutes les entrées.
      list = classe ? await Schedule.find({ classe }) : await Schedule.find();
    } else {
      // Pour les utilisateurs non-admin, on limite la vue: ils ne peuvent
      // pas obtenir l'emploi du temps complet. On renvoie la classe demandée
      // uniquement si elle est précisée.
      if (classe) {
        list = await Schedule.find({ classe });
      } else {
        // Si aucune classe n'est précisée, renvoyer un tableau vide pour la sécurité.
        list = [];
      }
    }

    // On renvoie la liste (même si elle est vide).
    res.json(list);
  } catch (err) {
    console.error('Error in GET /api/schedule', err);
    res.status(500).json({ message: 'Failed to list schedule' });
  }
});

// POST /api/schedule
// - Rôle: Admin
// - Description simple: crée un nouveau créneau d'emploi du temps.
// - Attente du corps de la requête: { day, slot, matiere, prof, salle, numero, classe }
router.post('/', requireAuth, requireRole('Admin'), async (req, res) => {
  try {
    console.log('POST /api/schedule', req.body);

    // Création du créneau en base à partir des données fournies.
    const s = await Schedule.create(req.body);

    // Retourner l'objet créé au client.
    res.json(s);
  } catch (err) {
    console.error('Error in POST /api/schedule', err);
    res.status(500).json({ message: 'Failed to create schedule slot' });
  }
});

// GET /api/schedule/:id
// - Rôle: lecture (auth requis)
// - Description: récupérer un créneau spécifique par son identifiant.
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const id = req.params.id;
    const s = await Schedule.findById(id);
    res.json(s);
  } catch (err) {
    console.error('Error GET /api/schedule/:id', err);
    res.status(500).json({ message: 'Failed' });
  }
});

// PUT /api/schedule/:id
// - Rôle: Admin
// - Description: mettre à jour un créneau existant.
router.put('/:id', requireAuth, requireRole('Admin'), async (req, res) => {
  try {
    const id = req.params.id;
    const updated = await Schedule.findByIdAndUpdate(id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    console.error('Error PUT /api/schedule/:id', err);
    res.status(500).json({ message: 'Failed to update' });
  }
});

// DELETE /api/schedule/:id
// - Rôle: Admin
// - Description: supprime un créneau par son identifiant.
router.delete('/:id', requireAuth, requireRole('Admin'), async (req, res) => {
  try {
    const id = req.params.id;
    await Schedule.findByIdAndDelete(id);
    res.json({ ok: true });
  } catch (err) {
    console.error('Error DELETE /api/schedule/:id', err);
    res.status(500).json({ message: 'Failed to delete' });
  }
});

export default router;
