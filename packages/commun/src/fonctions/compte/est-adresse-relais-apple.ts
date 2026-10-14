/** Vrai pour une adresse masquée d'Apple (« Masquer mon adresse e-mail » : …@privaterelay.appleid.com). */
export function estAdresseRelaisApple(email: string): boolean {
  return /@privaterelay\.appleid\.com$/i.test(email.trim());
}
