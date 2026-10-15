import type { ReponseApi } from "@sos-miam/commun/client-api/reponse-api";
import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import type { IssueEnvoiOffres } from "~/services/renvoi-choix-offres";

const PASSAGERES = new Set<ErreurService>(["hors-ligne", "erreur-serveur", "trop-de-demandes", "service-indisponible"]);

export function classerEnvoiOffres(reponse: ReponseApi): IssueEnvoiOffres {
  if (reponse.ok) return "parti";
  return PASSAGERES.has(reponse.erreur) ? "a-renvoyer" : "sans-suite";
}
