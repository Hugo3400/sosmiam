import type { ResultatValidation } from "@sos-miam/commun/types/visite";

export type TamponVisite = {
  /** Tampons à montrer (la carte pleine quand elle vient de se remplir, même si elle est déjà repartie à zéro) */
  tampons: number;
  sur: number;
  /** La carte vient de se remplir avec cette visite */
  pleine: boolean;
  /** « Carte pleine : un tiramisu maison t'attend ! », « Plus qu'une visite pour un chou à la crème ! »… */
  texte: string;
};

/** « Un tiramisu maison » → « un tiramisu maison » au milieu d'une phrase (sans toucher à un sigle comme « BBQ ») */
function mettreMinusculeInitiale(texte: string): string {
  return /^\p{Lu}\p{Ll}/u.test(texte) ? texte.charAt(0).toLocaleLowerCase("fr") + texte.slice(1) : texte;
}

/**
 * Le tampon posé par une visite validée, pour la célébration (affiché et lu) : où en est la carte et ce qu'il reste à faire.
 * null si la visite n'a pas posé de tampon (pas de carte de fidélité chez ce lieu, programme en pause).
 */
export function decrireTamponVisite(r: ResultatValidation): TamponVisite | null {
  const { carte, visite } = r;
  if (!carte || !visite.tampon || carte.sur <= 0) return null;
  if (r.recompenseGagnee) {
    // La récompense figée par cette visite (gagnée à l'instant de la validation), sinon la dernière prête, sinon celle d'aujourd'hui
    const gagnee = carte.pretes.find((p) => p.gagneeLe === visite.valideLe) ?? carte.pretes[carte.pretes.length - 1];
    return { tampons: carte.sur, sur: carte.sur, pleine: true, texte: `Carte pleine : ${mettreMinusculeInitiale(gagnee?.libelle ?? carte.recompense)} t'attend !` };
  }
  const tampons = Math.min(carte.sur, Math.max(0, carte.tampons));
  const reste = carte.sur - tampons;
  const recompense = mettreMinusculeInitiale(carte.recompense);
  const texte = reste <= 1 ? `Plus qu'une visite pour ${recompense} !` : `Encore ${reste} visites pour ${recompense}.`;
  return { tampons, sur: carte.sur, pleine: false, texte };
}
