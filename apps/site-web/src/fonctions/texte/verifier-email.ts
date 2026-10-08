/** Vérifie qu'une adresse e-mail a une forme valable (quelque@domaine.ext). */
export function verifierEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}
