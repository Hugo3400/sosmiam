import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { TEXTES_CARTE_DEFI, TEXTES_LISTE_DEFIS, TEXTES_RESUME_DEFIS } from "~/contenus/textes-profil-defis";

export const TEXTES_CARTE_DEFI_ANGLAIS: Traduction<typeof TEXTES_CARTE_DEFI> = {
  pourLaGloire: "Just for the glory",
  gainLuSansPoints: "Just for the glory, no points",
  pointsGagnes: (points: number) => `${points} ${points === 1 ? "point" : "points"} earned`,
  pointsAGagner: (points: number) => `${points} ${points === 1 ? "point" : "points"} to earn`,
  pastilleGagnes: (_points: number, gain: string) => `${gain} earned`,
  pastilleGloire: "Just for the glory 🏆",
  pastilleDes: (debut: string, gain: string) => `⏳ From ${debut} · ${gain}`,
  pastilleAVenir: (gain: string) => `⏳ Coming soon · ${gain}`,
  pastilleJusquau: (gain: string, fin: string | null) => `${gain}${fin ? ` · until ${fin}` : ""}`,
  noteAVenir: (debut: string, fin: string | null) => `It starts on ${debut}${fin ? ` and runs until ${fin}` : ""}. Get your taste buds warmed up!`,
  reussiLu: "Challenge completed",
  aVenirLu: "Coming soon",
  avanceeLu: (fait: number, objectif: number) => `Progress: ${fait} of ${objectif}`,
  jusquauLu: (fin: string) => `, until ${fin}`,
  reussi: "Completed ✅",
};

export const TEXTES_LISTE_DEFIS_ANGLAIS: Traduction<typeof TEXTES_LISTE_DEFIS> = {
  titre: "Current challenges",
  sousTitre: "Tasty little quests, extra points.",
  horsLigne: "Your challenges will land as soon as you're back online. We're keeping them warm for you!",
  sieste: "Your challenges are having a little nap. Pop back to your profile in a moment to wake them up.",
  aucun: "No challenges right now – the Brigade's cooking up some new ones. Come back soon for a taste!",
};

export const TEXTES_RESUME_DEFIS_ANGLAIS: Traduction<typeof TEXTES_RESUME_DEFIS> = {
  premierPas: (nom: string) => `First step towards ${nom} – over to you!`,
  encoreUn: (nom: string) => `1 more and ${nom} is in the bag!`,
  plusQue: (reste: number, nom: string) => `Just ${reste} more for ${nom} – things are heating up in the kitchen!`,
  toutReussi: "All done – the Brigade doffs its toque to you! 🎉",
  caMijote: "Something's simmering in the kitchen – get your taste buds ready for the next ones!",
  enCours: (nombre: number) => `${nombre} in progress`,
  aVenir: (nombre: number) => `${nombre} coming up`,
  reussis: (nombre: number) => `${nombre} completed`,
};
