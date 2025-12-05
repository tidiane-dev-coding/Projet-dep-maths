// Modèle pour les messages envoyés dans la messagerie de l'application
import { Schema, model } from 'mongoose';

// Chaque message contient le texte, qui l'a envoyé, et un groupe (canal)
const MessageSchema = new Schema({
  // Contenu du message (obligatoire)
  text: { type: String, required: true },
  // Qui a envoyé le message (email ou id)
  sender: { type: String, required: true },
  // Canal ou groupe (par défaut 'Général')
  group: { type: String, default: 'Général' },
  // Date de création (si on ne la donne pas, on met la date actuelle)
  createdAt: { type: Date, default: Date.now }
});

// Export du modèle 'Message' pour l'utiliser depuis le serveur
export default model('Message', MessageSchema);
