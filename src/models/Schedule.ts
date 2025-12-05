// Ce fichier définit le format (schéma) des documents 'Schedule' (emploi du temps)
// stockés dans la base MongoDB. Chaque document représente un créneau horaire d'un jour.
import { Schema, model } from 'mongoose';

// Schéma décrivant la forme d'un document emploi du temps:
const ScheduleSchema = new Schema({
  // Le jour (par exemple "Lundi", "Mardi") — champ obligatoire
  day: { type: String, required: true },
  // Le créneau horaire (ex: '09-11') — champ obligatoire
  slot: { type: String, required: true },
  // Matière enseignée dans ce créneau (optionnel)
  matiere: { type: String },
  // Nom du professeur pour ce créneau (optionnel)
  prof: { type: String },
  // Salle où a lieu le cours (optionnel)
  salle: { type: String },
  // Numéro du professeur ou autre information additionnelle (optionnel)
  numero: { type: String },
  // Classe ou niveau concerné par ce créneau (ex: "L1" ou "Master")
  // Si vide, on peut considérer que le créneau est général.
  classe: { type: String }
}, { timestamps: true });

// Export du modèle Mongoose pour permettre les opérations sur la collection 'schedules'
export default model('Schedule', ScheduleSchema);
