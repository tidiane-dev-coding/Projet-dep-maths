// Contrôleur simple pour les opérations sur les utilisateurs
// Les fonctions exportées ici sont utilisées par les routes pour effectuer
// des opérations CRUD (lire, créer, mettre à jour, supprimer).
import User from '../models/User';

// Retourne la liste de tous les utilisateurs
export async function listUsers(req: any, res: any) {
  // On récupère tous les utilisateurs depuis la base
  const users = await User.find();
  // On renvoie la liste au format JSON
  res.json(users);
}

// Récupère un seul utilisateur par son identifiant
export async function getUser(req: any, res: any) {
  // req.params.id contient l'identifiant passé dans l'URL
  const u = await User.findById(req.params.id);
  res.json(u);
}

// Crée un nouvel utilisateur avec les données fournies dans le corps de la requête
export async function createUser(req: any, res: any) {
  // req.body contient les champs (name, email, etc.) envoyés par le client
  const u = await User.create(req.body);
  res.json(u);
}

// Met à jour un utilisateur existant
export async function updateUser(req: any, res: any) {
  // findByIdAndUpdate met à jour et retourne le document (option { new: true })
  const u = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(u);
}

// Supprime un utilisateur
export async function deleteUser(req: any, res: any) {
  await User.findByIdAndDelete(req.params.id);
  // On renvoie un objet simple pour confirmer la suppression
  res.json({ ok: true });
}
