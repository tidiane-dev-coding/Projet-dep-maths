// Middleware d'authentification et d'autorisation
// Ce fichier contient des petites fonctions que le serveur utilise pour vérifier
// si une requête vient d'un utilisateur connecté, et si cet utilisateur a un
// rôle particulier (ex: Admin). Les commentaires expliquent chaque ligne.

// On importe des types depuis Express pour typer correctement les fonctions
import { Request, Response, NextFunction } from 'express';
// jwt nous permet de vérifier et décoder le token (jeton) envoyé par le client
import jwt from 'jsonwebtoken';

// On étend l'objet Request d'Express pour dire que, après authentification,
// on pourra ajouter la propriété 'user' qui contient les informations du token
export interface AuthRequest extends Request {
  // user contiendra des informations décodées du token (id, role, ...)
  user?: any;
}

// Middleware requireAuth : vérifie qu'une requête contient un token valide.
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  // On regarde l'en-tête 'Authorization' de la requête HTTP
  const auth = req.headers.authorization;
  // Si aucun header Authorization, on renvoie 401 (Unauthorized)
  if (!auth) return res.status(401).json({ message: 'Unauthorized' });
  // Le header contient normalement "Bearer <token>", on retire le préfixe
  const token = auth.replace('Bearer ', '');
  try {
    // On vérifie et décode le token avec la clé secrète (ou 'secret' par défaut)
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    // On attache les données décodées (ex: id, role) à req.user pour les
    // handlers qui suivent
    req.user = decoded;
    // Tout est ok : on passe à la suite (next middleware / route)
    next();
  } catch (err) {
    // Si la vérification échoue (token invalide ou expiré), on renvoie 401
    return res.status(401).json({ message: 'Invalid token' });
  }
}

// Middleware factory requireRole : renvoie une fonction qui vérifie le rôle
// Exemple : requireRole('Admin') renverra une fonction qui bloquera les non-admins.
// requireRole accepte maintenant une chaîne (ex: 'Admin') ou un tableau de rôles
// (ex: ['Admin','Professor']). Cela permet d'autoriser plusieurs rôles pour
// une même route sans dupliquer les middlewares.
export function requireRole(role: string | string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    // Si req.user n'existe pas, cela signifie que l'utilisateur n'est pas
    // authentifié. On répond alors 401.
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    // Normalisons en minuscule pour faire des comparaisons insensibles à la casse
    const userRole = String(req.user.role || '').toLowerCase();
    // Si le rôle attendu est un tableau, on vérifie que le rôle de l'utilisateur
    // est inclus dans la liste (comparaison en minuscule). Sinon on compare directement.
    if (Array.isArray(role)) {
      const allowed = role.map(r => String(r).toLowerCase());
      if (!allowed.includes(userRole)) return res.status(403).json({ message: 'Forbidden' });
    } else {
      if (String(role).toLowerCase() !== userRole) return res.status(403).json({ message: 'Forbidden' });
    }

    // Tout est ok, on appelle next pour continuer l'exécution de la route
    next();
  };
}
