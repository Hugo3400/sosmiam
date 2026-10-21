export function lireModeDuLien(lien: string): "pro" | "ambassadeur" | null {
  for (const mode of ["pro", "ambassadeur"] as const) {
    const racine = `/${mode}`;
    if (lien === racine || lien.startsWith(`${racine}/`) || lien.startsWith(`${racine}?`)) return mode;
  }
  return null;
}
