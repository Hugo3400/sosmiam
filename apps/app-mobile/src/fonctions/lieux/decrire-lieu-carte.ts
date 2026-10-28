import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import type { Langue } from "@sos-miam/commun/regles/langues";
import type { Lieu } from "@sos-miam/commun/types/lieu";
import { estLieuVerifie } from "@sos-miam/commun/fonctions/lieux/est-lieu-verifie";
import { TEXTES_EXPLORER_LISTE_PAR_LANGUE } from "~/contenus/textes-explorer-liste";
import { formaterHeureTexteLangue } from "~/fonctions/langue/formater-heure-texte-langue";

export function decrireLieuCarte(lieu: Lieu, langue: Langue): string {
  const T = choisirTextes(TEXTES_EXPLORER_LISTE_PAR_LANGUE, langue);
  const sos = lieu.sos
    ? `${T.enSosCeSoirLu(T.sosPlaces(lieu.sos.places, formaterHeureTexteLangue(lieu.sos.jusqua, langue)))}${lieu.sos.offre ? `, ${lieu.sos.offre}` : ""}`
    : null;
  const nonVerifie = estLieuVerifie(lieu) ? null : T.nonVerifieLu;
  const quoiEtOu = [lieu.info.trim(), lieu.quartier.trim()].filter(Boolean).join(", ");
  const details = [quoiEtOu, sos, lieu.alerte ?? null, nonVerifie].filter((morceau): morceau is string => !!morceau);
  return [lieu.nom, ...details].join(". ");
}
