export function lireIdLieu(texte: string | undefined): number | null {
  if (!texte || !/^\d{1,9}$/.test(texte)) return null;
  const id = Number(texte);
  return id > 0 ? id : null;
}
