import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { TEXTES_PROFIL_COMMUNAUTAIRE } from "~/contenus/textes-profil-communautaire";

export const TEXTES_PROFIL_COMMUNAUTAIRE_ANGLAIS: Traduction<typeof TEXTES_PROFIL_COMMUNAUTAIRE> = {
  teSuitLu: (prenom: string) => `${prenom}, follows you`,
  moi: (prenom: string) => `${prenom} (you)`,
  teSuit: "Follows you",
  pasDePseudo: "No username yet",
  sauvesTitre: "Places rescued",
  sauvesVideMoi: "No places rescued yet. Give a rescue from your feed and it'll show up here.",
  sauvesVideAutre: (prenom: string) => `${prenom} hasn't rescued any places yet. Give it time!`,
  gardesTitre: "Saved places",
  gardesVideMoi: "Save a place from your feed – your future hungry self will thank you.",
  gardesVideAutre: (prenom: string) => `No saved places for ${prenom} yet.`,
  palierLu: (estMoi: boolean, palier: string, points: number, pointsDuMois: number) =>
    `${estMoi ? "Your" : "Their"} Ambassador level: ${palier}, ${points} point${points === 1 ? "" : "s"}, including ${pointsDuMois} this month`,
  palierTitre: "Ambassador level",
  pointsDuMois: (n: number) => `+${n} this month`,
  points: (n: number) => `${n} point${n === 1 ? "" : "s"}`,
  badgesLu: (n: number) => `Badges earned, ${n}`,
  badgesTitre: (n: number) => `Badges earned (${n})`,
  badgesVideMoi: "No badges yet – your first rescue will get you one!",
  badgesVideAutre: (prenom: string) => `No badges for ${prenom} yet.`,
};
