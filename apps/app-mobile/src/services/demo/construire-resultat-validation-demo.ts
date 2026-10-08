import type { ResultatValidation } from "@sos-miam/commun/types/visite";

import { lieuxExemples } from "~/contenus/lieux-exemples";
import { convertirCarteDemo } from "~/fonctions/demo/convertir-carte-demo";
import { convertirVisiteDemo } from "~/fonctions/demo/convertir-visite-demo";

import type { ClientDemo, MagasinDemo, VisiteDemo } from "./types-demo";

/**
 * Ce que le client reçoit pour une visite : la visite, sa carte de fidélité chez ce lieu, et si la carte vient de se
 * remplir. Sans `recompenseGagnee` donné, on le retrouve : une récompense prête gagnée à l'instant même de la validation.
 * null si le lieu n'existe plus.
 */
export function construireResultatValidationDemo(
  m: Readonly<MagasinDemo>,
  v: VisiteDemo,
  client: ClientDemo,
  o?: { recompenseGagnee?: boolean; dejaValidee?: boolean },
): ResultatValidation | null {
  const lieu = lieuxExemples.find((l) => l.id === v.lieuId);
  if (!lieu) return null;
  const carte = convertirCarteDemo(m, v.lieuId, client);
  const retrouvee = v.statut === "validee" && v.tampon && v.valideLe !== null && (carte?.pretes.some((r) => r.gagneeLe === v.valideLe) ?? false);
  return {
    visite: convertirVisiteDemo(v, lieu),
    carte,
    recompenseGagnee: o?.recompenseGagnee ?? retrouvee,
    dejaValidee: o?.dejaValidee ?? false,
  };
}
