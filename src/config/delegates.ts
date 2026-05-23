/** E-mails des délégués autorisés sur certaines routes (annonces, absences, emploi du temps…). */
export const DELEGATE_EMAILS = [
  'mariama1.diallo@univ-labe.edu.gn',
  'alpharahma2018@gmail.com',
  'dep.math@univ-labe.edu.gn',
] as const;

export function normalizeEmail(email?: string): string {
  return String(email || '').trim().toLowerCase();
}

export function isDelegateEmail(email?: string): boolean {
  const e = normalizeEmail(email);
  return !!e && DELEGATE_EMAILS.map(normalizeEmail).includes(e);
}
