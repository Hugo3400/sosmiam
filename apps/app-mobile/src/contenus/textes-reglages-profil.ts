import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_REGLAGES_PROFIL_ANGLAIS } from "~/contenus/anglais/textes-reglages-profil";

export const TEXTES_REGLAGES_PROFIL = {
  enviesAucune: "Rien de coché pour l'instant",
  envies: (n: number) => `${n} envie${n > 1 ? "s" : ""} cochée${n > 1 ? "s" : ""}`,
  avatarPhoto: "Ta photo pour l'instant, ou un Miami",
  avatarAutre: (nom: string) => `En ${nom} pour l'instant, ou en photo`,
  avatar: "Avatar",
  mesInfos: "Mes infos",
  mesEnvies: "Mes envies",
  enviesOups: "Oups, ça a coincé",
  enviesRatees: "Tes envies n'ont pas pu être enregistrées. Réessaie dans un instant.",
  enviesSousTitre: "Coche tout ce qui te tente : on s'en sert pour mettre en avant les lieux qui te ressemblent.",
  enregistrer: "Enregistrer",
  enviesIndice: "Enregistre tes envies et revient à Mon profil",
  choisis: (n: number) => `${n} choisi${n > 1 ? "s" : ""}`,
} as const;

export const TEXTES_REGLAGES_PROFIL_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_REGLAGES_PROFIL>> = { fr: TEXTES_REGLAGES_PROFIL, en: TEXTES_REGLAGES_PROFIL_ANGLAIS };
