import type { MessageService } from "@sos-miam/commun/contenus/messages-services";

import type { RefusEnvoiAvis } from "~/contenus/type-donner-avis";
import { decrireRefusPhotoAvis } from "~/fonctions/avis/decrire-refus-photo-avis";
import { decrireEchecVisite } from "~/fonctions/visites/decrire-echec-visite";

export function decrireRefusEnvoiAvis(refus: RefusEnvoiAvis | null): MessageService | null {
  if (refus?.ou === "envoi") return decrireEchecVisite(refus.erreur, refus.details);
  if (refus?.ou === "photo") return decrireRefusPhotoAvis(refus);
  return null;
}
