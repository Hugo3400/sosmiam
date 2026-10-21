const NOMBRE = /^\s*(\d{1,5})\s*$/;

export function lireNombreCouverts(texte: string): number | null {
  const morceaux = NOMBRE.exec(texte);
  return morceaux ? Number(morceaux[1]) : null;
}
