// On importe les outils de Mongoose nécessaires pour définir un schéma et créer un modèle.
// Mongoose est une bibliothèque qui permet de communiquer avec la base de données MongoDB
// et de définir la forme des documents que l'on va stocker.
import { Schema, model } from 'mongoose';

// Ici on définit le 'schéma' du document 'User' : c'est la description des champs que
// chaque utilisateur aura dans la base de données. Chaque propriété ci-dessous correspond
// à un champ enregistré pour chaque utilisateur.
const UserSchema = new Schema({
  // Le nom complet de l'utilisateur (obligatoire)
  name: { type: String, required: true },
  // L'adresse email de l'utilisateur (obligatoire et unique)
  // 'unique: true' indique qu'on ne doit pas avoir deux utilisateurs avec le même email.
  email: { type: String, required: true, unique: true },
  // Le mot de passe (haché) de l'utilisateur (obligatoire)
  password: { type: String, required: true },
  // Le rôle de l'utilisateur dans l'application : Admin, Professor ou Student
  // 'enum' limite les valeurs possibles et 'default' fournit la valeur par défaut
  role: { type: String, enum: ['Admin', 'Professor', 'Student'], default: 'Student' },
  // Numéro de téléphone (optionnel)
  phone: { type: String },
  // URL vers l'avatar ou la photo de profil (optionnel)
  avatarUrl: { type: String },
}, { timestamps: true });

// On exporte le modèle Mongoose. Le modèle est ce que l'on utilise pour créer, lire,
// mettre à jour et supprimer des utilisateurs dans la base de données.
export default model('User', UserSchema);
