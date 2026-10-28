import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import type { Langue } from "@sos-miam/commun/regles/langues";
import { TEXTES_ETAT_PHOTO_PAR_LANGUE } from "~/contenus/textes-etat-photo";
import type { EtatPhotoSynchro } from "~/services/synchro-profil-memoire";
import { ecrireAttenteLangue } from "~/fonctions/langue/ecrire-attente-langue";

export type DescriptionEtatPhoto = { texte: string; enCours: boolean; refus: boolean };

export function decrireEtatPhoto(etat: EtatPhotoSynchro | null, enAttenteDEnvoi: boolean, langue: Langue): DescriptionEtatPhoto | null {
  const T = choisirTextes(TEXTES_ETAT_PHOTO_PAR_LANGUE, langue);
  const envoi = etat ? etat.operation === "envoi" : enAttenteDEnvoi;
  if (!etat) return enAttenteDEnvoi ? { texte: T.envoiEnCours, enCours: true, refus: false } : null;
  if (etat.etat === "en-cours") {
    return { texte: envoi ? T.envoiEnCours : T.retraitEnCours, enCours: true, refus: false };
  }
  if (etat.etat === "refusee") {
    if (etat.raison === "compte-limite") {
      return {
        texte: T.compteLimite,
        enCours: false,
        refus: true,
      };
    }
    if (etat.raison === "fichier") return { texte: T.fichier, enCours: false, refus: true };
    return { texte: envoi ? T.envoiRate : T.retraitRate, enCours: false, refus: true };
  }
  const suite = envoi ? T.suiteEnvoi : T.suiteRetrait;
  if (etat.raison === "reseau") {
    return {
      texte: envoi ? T.reseauEnvoi(suite) : T.reseauRetrait(suite),
      enCours: false,
      refus: false,
    };
  }
  const dans = etat.attenteMs ? T.dans(ecrireAttenteLangue(etat.attenteMs, langue)) : T.plusTard;
  if (etat.raison === "quota" && envoi) return { texte: T.quota(dans), enCours: false, refus: false };
  if (etat.raison === "stockage") return { texte: T.stockage(suite, dans), enCours: false, refus: false };
  return { texte: T.pause(suite), enCours: false, refus: false };
}
