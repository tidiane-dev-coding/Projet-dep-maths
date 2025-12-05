declare module 'nodemailer' {
  // Déclaration minimale pour lever l'erreur de types dans ce projet.
  // On exporte par défaut un objet dont le type est 'any'.
  // Ceci évite d'installer des types externes et permet de compiler.
  const nodemailer: any;
  export default nodemailer;

  // On ajoute quelques utilitaires couramment utilisés pour l'envoi de mail en dev.
  export function createTestAccount(): Promise<any>;
  export function getTestMessageUrl(info: any): string | false;
}
