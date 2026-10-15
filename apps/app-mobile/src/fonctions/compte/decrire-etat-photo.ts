import type { EtatPhotoSynchro } from "~/services/synchro-profil-memoire";
import { ecrireAttente } from "~/fonctions/dates/ecrire-attente";

export type DescriptionEtatPhoto = { texte: string; enCours: boolean; refus: boolean };

export function decrireEtatPhoto(etat: EtatPhotoSynchro | null, enAttenteDEnvoi: boolean, maintenant: number): DescriptionEtatPhoto | null {
  const envoi = etat ? etat.operation === "envoi" : enAttenteDEnvoi;
  if (!etat) return enAttenteDEnvoi ? { texte: "📤 Ta photo part sur SOS Miam…", enCours: true, refus: false } : null;
  if (etat.etat === "en-cours") {
    return { texte: envoi ? "📤 Ta photo part sur SOS Miam…" : "🧽 Ta photo s'en va de SOS Miam…", enCours: true, refus: false };
  }
  if (etat.etat === "refusee") {
    if (etat.raison === "compte-limite") {
      return {
        texte: "🔒 Ton compte est limité pour l'instant : ta nouvelle photo ne peut pas être montrée aux autres. Tu retrouves ton avatar d'avant, et tu pourras réessayer à la fin de la limitation.",
        enCours: false,
        refus: true,
      };
    }
    if (etat.raison === "fichier") return { texte: "😕 Cette photo n'a pas voulu partir (format ou taille). Réessaie avec une autre, ça devrait passer.", enCours: false, refus: true };
    return { texte: envoi ? "😕 Ta photo n'a pas pu partir. Réessaie dans un petit moment." : "😕 Ta photo n'a pas pu être retirée. Réessaie dans un petit moment.", enCours: false, refus: true };
  }
  const suite = envoi ? "ta photo partira toute seule" : "ta photo sera retirée toute seule";
  if (etat.raison === "reseau") {
    return {
      texte: envoi ? `📶 Pas de réseau pour l'instant : ${suite} dès qu'il revient. En attendant, elle reste sur ton téléphone.` : `📶 Pas de réseau pour l'instant : ${suite} dès qu'il revient.`,
      enCours: false,
      refus: false,
    };
  }
  const dans = etat.jusqua ? ` dans ${ecrireAttente(etat.jusqua - maintenant)}` : " un peu plus tard";
  if (etat.raison === "quota") return { texte: `⏳ Tu as changé de photo 20 fois aujourd'hui : on souffle un peu ! Ta nouvelle photo partira toute seule${dans}.`, enCours: false, refus: false };
  if (etat.raison === "stockage") return { texte: `🗄️ Notre serveur est plein à craquer (on s'en occupe !) : ${suite}${dans}.`, enCours: false, refus: false };
  return { texte: `🛠️ Notre serveur reprend son souffle : ${suite} un peu plus tard. Rien n'est perdu.`, enCours: false, refus: false };
}
