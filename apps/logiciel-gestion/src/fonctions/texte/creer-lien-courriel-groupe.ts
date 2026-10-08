/** Au-delà, Windows coupe le lien « mailto: » : mieux vaut copier les adresses */
export const LONGUEUR_MAX_MAILTO = 2000;

/**
 * Lien « mailto: » pour écrire à une ou plusieurs personnes depuis ta messagerie. Plusieurs adresses : elles partent en
 * copie cachée, personne ne voit les autres.
 */
export function creerLienCourrielGroupe(adresses: string[], objet = ""): string {
  const sujet = `subject=${encodeURIComponent(objet)}`;
  if (adresses.length === 1) return `mailto:${encodeURIComponent(adresses[0]!)}?${sujet}`;
  return `mailto:?${sujet}&bcc=${encodeURIComponent(adresses.join(","))}`;
}
