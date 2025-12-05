// Modèle représentant une note attribuée à un étudiant
import { Schema, model } from 'mongoose';

// Chaque document 'Grade' contient : qui (student), la valeur, et des métadonnées
const GradeSchema = new Schema({
  // Identifiant de l'étudiant : ici nous stockons l'email (ou parfois l'id)
  student: { type: String, required: true },
  // Valeur numérique de la note (ex: 12.5 ou 8)
  value: { type: Number, required: true },
  // Classe ou niveau (ex: 'L1-Math')
  classe: { type: String },
  // Matière (ex: 'Algèbre')
  matiere: { type: String },
  // Semestre (ex: 'Semestre 1')
  semestre: { type: String },
  // Professeur qui a saisi la note
  professeur: { type: String }
}, { timestamps: true });

// Export du modèle Grade
export default model('Grade', GradeSchema);
