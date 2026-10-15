import type { MessageService } from "@sos-miam/commun/contenus/messages-services";
import { remplirModele } from "@sos-miam/commun/fonctions/texte/remplir-modele";
import { COTE_MIN_PHOTO_AVIS } from "@sos-miam/commun/regles/avis";

import type { RefusEnvoiAvis } from "~/contenus/type-donner-avis";
import { TEXTES_DONNER_AVIS } from "~/contenus/textes-donner-avis";
import { ecrireAttente } from "~/fonctions/dates/ecrire-attente";

type RefusPhoto = Extract<RefusEnvoiAvis, { ou: "photo" }>;

const T = TEXTES_DONNER_AVIS;

function ecrireTexte(refus: RefusPhoto): string {
  if (refus.erreur === "media-trop-lourd") return T.photoTropLourde;
  if (refus.erreur === "media-invalide" && refus.champ === "dimensions") return remplirModele(T.photoTropPetite, { cote: String(COTE_MIN_PHOTO_AVIS) });
  if (refus.erreur === "stockage-plein") return T.photoPlacardsPleins;
  if (refus.erreur === "introuvable") return T.photoPasEncore;
  return T.photoRefusee;
}

export function decrireRefusPhotoAvis(refus: RefusPhoto): MessageService {
  if (refus.erreur === "avis-invalide") return { emoji: "📷", titre: T.photoAReprendreTitre, texte: T.photoAReprendre };
  if (refus.erreur === "trop-de-demandes") {
    const attenteS = refus.details?.attenteS;
    const texte = attenteS ? remplirModele(T.photoTropDEnvois, { attente: ecrireAttente(attenteS * 1000) }) : T.photoTropDEnvoisSansAttente;
    return { emoji: "🐢", titre: T.photoTropDEnvoisTitre, texte };
  }
  return { emoji: "📷", titre: T.photoPasPartie, texte: ecrireTexte(refus) };
}
