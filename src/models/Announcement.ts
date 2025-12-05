// Modèle pour les annonces / communications publiées sur la plateforme
import { Schema, model } from 'mongoose';

const AnnouncementSchema = new Schema({
  // Titre de l'annonce (obligatoire)
  title: { type: String, required: true },
  // Contenu complet de l'annonce (obligatoire)
  content: { type: String, required: true },
  // Date associée à l'annonce (par défaut la date actuelle)
  date: { type: Date, default: Date.now }
}, { timestamps: true });

// Export du modèle Announcement
export default model('Announcement', AnnouncementSchema);
