import type { Lieu } from "@sos-miam/commun/types/lieu";
import { estLieuVerifie } from "@sos-miam/commun/fonctions/lieux/est-lieu-verifie";
import { formaterHeure } from "~/fonctions/dates/formater-heure";

export function decrireLieuCarte(lieu: Lieu): string {
  const sos = lieu.sos
    ? `En SOS ce soir : ${lieu.sos.places} place${lieu.sos.places > 1 ? "s" : ""} jusqu'à ${formaterHeure(lieu.sos.jusqua)}${lieu.sos.offre ? `, ${lieu.sos.offre}` : ""}`
    : null;
  const nonVerifie = estLieuVerifie(lieu) ? null : "Lieu non vérifié, sans compte SOS Miam";
  const quoiEtOu = [lieu.info.trim(), lieu.quartier.trim()].filter(Boolean).join(", ");
  const details = [quoiEtOu, sos, lieu.alerte ?? null, nonVerifie].filter((morceau): morceau is string => !!morceau);
  return [lieu.nom, ...details].join(". ");
}
