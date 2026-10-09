/** Un code INSEE de commune bien formé (« 69123 », « 2A004 », « 97411 ») lu dans une adresse ou un formulaire, sinon null. */
export function lireCodeCommune(valeur: unknown): string | null {
  if (typeof valeur !== "string") return null;
  const code = valeur.trim().toUpperCase();
  return /^(\d{5}|2[AB]\d{3})$/.test(code) ? code : null;
}
