import type { MessageService } from "@sos-miam/commun/contenus/messages-services";
import type { Langue } from "@sos-miam/commun/regles/langues";

import type { RefusEnvoiAvis } from "~/contenus/type-donner-avis";
import { decrireRefusPhotoAvis } from "~/fonctions/avis/decrire-refus-photo-avis";
import { decrireEchecVisite } from "~/fonctions/visites/decrire-echec-visite";

export function decrireRefusEnvoiAvis(refus: RefusEnvoiAvis | null, langue: Langue): MessageService | null {
  if (refus?.ou === "envoi") return decrireEchecVisite(refus.erreur, langue, refus.details);
  if (refus?.ou === "photo") return decrireRefusPhotoAvis(refus, langue);
  return null;
}
