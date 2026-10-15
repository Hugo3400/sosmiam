import type { ReponseApi } from "@sos-miam/commun/client-api/reponse-api";
import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";

import type { EtapeEnvoiAvis, RefusEnvoiAvis } from "~/contenus/type-donner-avis";

type Echec = Extract<ReponseApi, { ok: false }>;

const REFUS_EN_PLEIN_ECRAN: readonly ErreurService[] = ["avis-pas-ouvert", "avis-ferme", "avis-deja-donne", "membre-du-lieu", "connexion-requise"];
const REFUS_DE_LA_PHOTO: readonly ErreurService[] = ["format-refuse", "media-trop-lourd", "media-invalide", "stockage-plein"];

export function classerRefusAvis(echec: Echec, etape: EtapeEnvoiAvis): RefusEnvoiAvis {
  const { erreur, details, champ } = echec;
  if (erreur === "compte-limite") return { ou: "limite" };
  if (REFUS_EN_PLEIN_ECRAN.includes(erreur)) return { ou: "ecran", erreur, details };
  if (etape === "photo" && (REFUS_DE_LA_PHOTO.includes(erreur) || erreur === "introuvable")) return { ou: "photo", erreur };
  if (erreur === "avis-invalide") return champ === "photo" ? { ou: "photo", erreur } : { ou: "texte" };
  if (erreur === "introuvable") return { ou: "ecran", erreur, details };
  return { ou: "envoi", erreur, details };
}
