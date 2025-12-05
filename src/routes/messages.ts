// On importe le Router d'Express pour définir des routes modularisées.
import { Router } from 'express';
// On importe le modèle Mongoose 'Message' qui représente un message enregistré en base.
import Message from '../models/Message';
// Middleware d'authentification: s'assure que la requête contient un token JWT valide.
import { requireAuth } from '../middleware/auth';

// Création d'un routeur express dédié aux messages.
const router = Router();

// Route: GET /api/messages
// Description: retourne la liste des messages persistés en base.
// Accès: protégé -> l'utilisateur doit être authentifié (requireAuth).
// Détails techniques:
// - On récupère tous les documents Message depuis MongoDB.
// - On les trie par date de création (champ createdAt) en ordre croissant (ancien -> récent).
// - On renvoie la liste JSON au client.
router.get('/', requireAuth, async (req, res) => {
  // On cherche tous les messages et on les trie.
  const list = await Message.find().sort({ createdAt: 1 });

  // On renvoie la liste au format JSON.
  res.json(list);
});

// On exporte le routeur pour pouvoir l'utiliser depuis app.ts (ou index.ts) du serveur.
export default router;
