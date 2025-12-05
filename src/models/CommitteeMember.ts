// Modèle pour un membre du comité de classe
import { Schema, model } from 'mongoose';

const CommitteeMemberSchema = new Schema({
  // Nom complet du membre (obligatoire)
  name: { type: String, required: true },
  // Rôle dans le comité (ex: 'Président', 'Secrétaire')
  role: { type: String, required: true },
  // URL de la photo (optionnel)
  photo: { type: String },
  // Email du membre (optionnel)
  email: { type: String },
  // Téléphone (optionnel)
  phone: { type: String },
  // Niveau auquel ce membre appartient (ex: 'L1', 'L2', 'Master')
  level: { type: String, required: true }, // L1, L2, L3, Master
}, { timestamps: true });

// Export du modèle CommitteeMember
export default model('CommitteeMember', CommitteeMemberSchema);
