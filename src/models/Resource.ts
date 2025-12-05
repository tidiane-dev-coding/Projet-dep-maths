// Modèle pour les ressources pédagogiques stockées dans l'application
// Ce fichier décrit la forme des documents 'Resource' dans la base MongoDB
import { Schema, model } from 'mongoose';

const ResourceSchema = new Schema({
  // Titre du fichier ou de la ressource (ex: 'TD Algèbre - Chapitre 3')
  title: { type: String, required: true },
  // Matière ou sujet lié (ex: 'Mathématiques')
  subject: { type: String },
  // Semestre ciblé par la ressource (ex: 'Semestre 1')
  semester: { type: String },
  // Niveau ou classe (ex: 'L1', 'L2')
  level: { type: String },
  // URL du fichier (stockage externe ou chemin de téléchargement)
  url: { type: String },
  // Qui a uploadé cette ressource (email ou id de l'utilisateur)
  uploadedBy: { type: String }
}, { timestamps: true });

// Export du modèle pour pouvoir l'utiliser ailleurs dans l'application
export default model('Resource', ResourceSchema);
