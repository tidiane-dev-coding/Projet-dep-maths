// Modèle représentant un candidat aux élections (par exemple pour le comité)
import { Schema, model } from 'mongoose';

const CandidateSchema = new Schema({
  // Nom du candidat (obligatoire)
  name: { type: String, required: true },
  // URL/photo du candidat (optionnel)
  photo: { type: String },
  // Lettre de motivation ou description (optionnel)
  motivation: { type: String },
  // Poste visé (ex: 'Président')
  poste: { type: String, required: true },
  // Niveau académique pour lequel il se présente (par défaut L1)
  level: { type: String, default: 'L1' },
  // Nombre de votes reçus (initialisé à 0)
  votes: { type: Number, default: 0 }
}, { timestamps: true });

// Export du modèle Candidate
export default model('Candidate', CandidateSchema);
