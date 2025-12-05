// Contrôleur pour gérer les annonces publiées sur la plateforme
import Announcement from '../models/Announcement';

// Retourne la liste des annonces, triée par date décroissante (les plus récentes en premier)
export async function listAnnouncements(req: any, res: any) {
  const list = await Announcement.find().sort({ createdAt: -1 });
  res.json(list);
}

// Crée une nouvelle annonce à partir du titre et du contenu envoyés
export async function createAnnouncement(req: any, res: any) {
  const { title, content } = req.body;
  const a = await Announcement.create({ title, content });
  res.json(a);
}

// Met à jour une annonce existante identifiée par son id
export async function updateAnnouncement(req: any, res: any) {
  const { id } = req.params;
  const updated = await Announcement.findByIdAndUpdate(id, req.body, { new: true });
  res.json(updated);
}

// Supprime une annonce par son id
export async function deleteAnnouncement(req: any, res: any) {
  const { id } = req.params;
  await Announcement.findByIdAndDelete(id);
  res.json({ ok: true });
}
