// Déclarations additionnelles pour TypeScript :
// On étend l'interface Express.Request pour y ajouter la propriété 'user' utilisée
// par notre middleware d'authentification. Cela évite d'avoir à caster partout.
import * as express from 'express';

declare global {
  namespace Express {
    interface Request {
      // 'user' ajouté dynamiquement par le middleware requireAuth
      user?: any;
    }
  }
}

export {};
