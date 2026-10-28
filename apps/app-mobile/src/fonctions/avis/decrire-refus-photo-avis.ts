import type { MessageService } from "@sos-miam/commun/contenus/messages-services";
import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import { remplirModele } from "@sos-miam/commun/fonctions/texte/remplir-modele";
import { COTE_MIN_PHOTO_AVIS } from "@sos-miam/commun/regles/avis";
import type { Langue } from "@sos-miam/commun/regles/langues";

import type { RefusEnvoiAvis } from "~/contenus/type-donner-avis";
import { TEXTES_DONNER_AVIS_PAR_LANGUE } from "~/contenus/textes-donner-avis";
import { ecrireAttenteLangue } from "~/fonctions/langue/ecrire-attente-langue";

type RefusPhoto = Extract<RefusEnvoiAvis, { ou: "photo" }>;

type Textes = typeof TEXTES_DONNER_AVIS_PAR_LANGUE.fr;

function ecrireTexte(refus: RefusPhoto, T: Textes): string {
  if (refus.erreur === "media-trop-lourd") return T.photoTropLourde;
  if (refus.erreur === "media-invalide" && refus.champ === "dimensions") return remplirModele(T.photoTropPetite, { cote: String(COTE_MIN_PHOTO_AVIS) });
  if (refus.erreur === "stockage-plein") return T.photoPlacardsPleins;
  if (refus.erreur === "introuvable") return T.photoPasEncore;
  return T.photoRefusee;
}

export function decrireRefusPhotoAvis(refus: RefusPhoto, langue: Langue): MessageService {
  const T = choisirTextes(TEXTES_DONNER_AVIS_PAR_LANGUE, langue);
  if (refus.erreur === "avis-invalide") return { emoji: "📷", titre: T.photoAReprendreTitre, texte: T.photoAReprendre };
  if (refus.erreur === "trop-de-demandes") {
    const attenteS = refus.details?.attenteS;
    const texte = attenteS ? remplirModele(T.photoTropDEnvois, { attente: ecrireAttenteLangue(attenteS * 1000, langue) }) : T.photoTropDEnvoisSansAttente;
    return { emoji: "🐢", titre: T.photoTropDEnvoisTitre, texte };
  }
  return { emoji: "📷", titre: T.photoPasPartie, texte: ecrireTexte(refus, T) };
}
