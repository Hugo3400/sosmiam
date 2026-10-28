import type { DetailsErreur } from "@sos-miam/commun/client-api/reponse-api";
import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import type { decrireEtatAvis } from "@sos-miam/commun/fonctions/visites/decrire-etat-avis";
import type { Langue } from "@sos-miam/commun/regles/langues";
import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import type { Visite } from "@sos-miam/commun/types/visite";

import type { RefusEnvoiAvis } from "~/contenus/type-donner-avis";
import { TEXTES_DONNER_AVIS_PAR_LANGUE } from "~/contenus/textes-donner-avis";
import { decrireAttenteAvis } from "~/fonctions/avis/decrire-attente-avis";

export type RefusOuvertureAvis = { erreur: ErreurService; details?: DetailsErreur; titre?: string; texte?: string };

type Entree = {
  visite: Visite | null;
  echecLecture: { erreur: ErreurService; details?: DetailsErreur } | null;
  refusEnvoi: RefusEnvoiAvis | null;
  etat: ReturnType<typeof decrireEtatAvis>;
  maintenant: Date;
};

export function choisirRefusOuvertureAvis({ visite, echecLecture, refusEnvoi, etat, maintenant }: Entree, langue: Langue): RefusOuvertureAvis | null {
  const T = choisirTextes(TEXTES_DONNER_AVIS_PAR_LANGUE, langue);
  if (!visite) return { erreur: echecLecture?.erreur ?? "introuvable", details: echecLecture?.details };
  if (refusEnvoi?.ou === "ecran") return { erreur: refusEnvoi.erreur, details: refusEnvoi.details };
  if (etat === "donne") return { erreur: "avis-deja-donne" };
  if (etat === "ferme") return { erreur: "avis-ferme" };
  if (etat === "a-venir" && visite.avis) return { erreur: "avis-pas-ouvert", texte: decrireAttenteAvis(visite.avis.ouvertLe, maintenant, langue) };
  if (etat === "aucun") return { erreur: "avis-pas-ouvert", titre: T.aucunTitre, texte: T.aucunTexte };
  return null;
}
