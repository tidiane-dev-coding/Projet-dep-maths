// Modèle pour les annonces / communications publiées sur la plateforme
import { Schema, model } from 'mongoose';

const AnnouncementSchema = new Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  date: { type: Date, default: Date.now },
  imageUrl: { type: String },
  pdfUrl: { type: String },
  pdfName: { type: String },
}, { timestamps: true });

export default model('Announcement', AnnouncementSchema);
