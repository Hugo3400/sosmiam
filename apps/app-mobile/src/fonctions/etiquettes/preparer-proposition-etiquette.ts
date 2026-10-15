import { normaliserEtiquette } from "@sos-miam/commun/fonctions/etiquettes/normaliser-etiquette";
import type { EtiquetteLieu } from "@sos-miam/commun/types/etiquette";
import { lireEtiquetteLibre } from "@sos-miam/commun/validation/lire-etiquette-libre";
import { REFUS_ETIQUETTE, TEXTES_ETIQUETTES } from "~/contenus/textes-etiquettes";

export type PropositionPreparee = { ok: true; nom: string } | { ok: false; message: string };

export function preparerPropositionEtiquette(choisie: string | null, libre: string, presentes: readonly EtiquetteLieu[]): PropositionPreparee {
  const lue = lireEtiquetteLibre(libre.trim() !== "" ? libre : (choisie ?? ""));
  if (!lue.ok) return { ok: false, message: REFUS_ETIQUETTE[lue.refus] };
  const cle = normaliserEtiquette(lue.nom);
  const presente = presentes.find((e) => normaliserEtiquette(e.nom) === cle);
  if (presente?.statut === "confirmee") return { ok: false, message: TEXTES_ETIQUETTES.dejaConfirmee };
  if (presente?.parToi) return { ok: false, message: TEXTES_ETIQUETTES.dejaProposee };
  return { ok: true, nom: lue.nom };
}
