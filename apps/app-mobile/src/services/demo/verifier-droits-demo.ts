import type { ReponseApi } from "@sos-miam/commun/client-api/reponse-api";
import { verifierDroitValidation } from "@sos-miam/commun/fonctions/visites/verifier-droit-validation";
import type { Lieu } from "@sos-miam/commun/types/lieu";

import { validationLieuxExemples } from "~/contenus/validation-lieux-exemples";

import type { ClientDemo } from "./types-demo";

type Echec = Extract<ReponseApi, { ok: false }>;

/**
 * Ce compte peut-il faire valider une visite ici ? Règles de commun ; en démo, le rôle pro est joué : la règle
 * « membre du lieu » n'est pas appliquée (et c'est écrit dans le mode pro), et aucun compte n'est en pause.
 */
export function verifierDroitsDemo(lieu: Lieu, client: ClientDemo, maintenantMs: number): Echec | null {
  const droit = verifierDroitValidation({
    lieu: { id: lieu.id, type: lieu.type, validationActive: validationLieuxExemples[lieu.id]?.validationActive ?? false },
    compte: { majeur: client.majeur, limiteJusqua: null, lieuxMembre: [] },
    maintenantMs,
  });
  if (droit.ok) return null;
  // Le nom d'un bar n'est jamais renvoyé à un 15-17 ans
  return droit.erreur === "lieu-sans-validation" ? { ok: false, erreur: droit.erreur, details: { lieu: lieu.nom } } : { ok: false, erreur: droit.erreur };
}
