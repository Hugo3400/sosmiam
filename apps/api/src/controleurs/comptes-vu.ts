// Le compte tel qu'on le rend à la personne connectée (`compte` des réponses de routes/comptes.ts) : âge déchiffré et
// calculé au jour de Paris, rôles masqués sous 18 ans, lieux validés à part (fonctions/comptes/presenter-compte.ts).
import { calculerAgeProfil } from "../fonctions/comptes/calculer-age-profil.ts";
import { presenterCompte } from "../fonctions/comptes/presenter-compte.ts";
import { resumerErreur } from "../fonctions/comptes/resumer-erreur.ts";
import type { ChiffrementDonnees } from "../services/chiffrement-donnees.ts";
import type { CompteConnecte, CompteLu } from "../services/comptes.ts";

/** Âge lu d'une date chiffrée : null sans date ; `illisible` si la date est gardée mais ne se lit pas (pas de clé, clé fausse). */
export type AgeLu = { age: number | null; illisible: boolean };

export function creerLecteurCompteVu(
  lireCompte: (id: number) => Promise<CompteLu | null>, chiffrement: ChiffrementDonnees | null, horloge: () => number,
) {
  /** L'âge d'après la date de naissance chiffrée (null si le compte ne la garde pas). */
  function lireAge(dateNaissanceChiffree: string | null): AgeLu {
    if (dateNaissanceChiffree === null) return { age: null, illisible: false };
    if (!chiffrement) return { age: null, illisible: true };
    try {
      return { age: calculerAgeProfil(chiffrement.dechiffrer(dateNaissanceChiffree, "dateNaissance"), new Date(horloge())), illisible: false };
    } catch (erreur) {
      // Jamais la valeur : seulement le nom de l'erreur
      console.error("Comptes : date de naissance illisible :", resumerErreur(erreur));
      return { age: null, illisible: true };
    }
  }

  /** Le compte présenté, ou null s'il n'existe plus. */
  async function lireCompteVu(id: number): Promise<CompteConnecte | null> {
    const compte = await lireCompte(id);
    if (!compte) return null;
    const { age, illisible } = lireAge(compte.dateNaissanceChiffree);
    return presenterCompte(compte, age, illisible);
  }

  return { lireAge, lireCompteVu };
}
