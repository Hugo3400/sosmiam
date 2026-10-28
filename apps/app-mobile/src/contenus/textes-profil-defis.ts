import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_CARTE_DEFI_ANGLAIS, TEXTES_LISTE_DEFIS_ANGLAIS, TEXTES_RESUME_DEFIS_ANGLAIS } from "~/contenus/anglais/textes-profil-defis";

export const TEXTES_CARTE_DEFI = {
  pourLaGloire: "Pour la gloire",
  gain: (points: number) => `+${points} ${points === 1 ? "pt" : "pts"}`,
  gainLuSansPoints: "Pour la gloire, sans points",
  pointsGagnes: (points: number) => `${points} ${points === 1 ? "point" : "points"} ${points === 1 ? "gagné" : "gagnés"}`,
  pointsAGagner: (points: number) => `${points} ${points === 1 ? "point" : "points"} à gagner`,
  pastilleGagnes: (points: number, gain: string) => `${gain} ${points === 1 ? "gagné" : "gagnés"}`,
  pastilleGloire: "Pour la gloire 🏆",
  pastilleDes: (debut: string, gain: string) => `⏳ Dès le ${debut} · ${gain}`,
  pastilleAVenir: (gain: string) => `⏳ À venir · ${gain}`,
  pastilleJusquau: (gain: string, fin: string | null) => `${gain}${fin ? ` · jusqu'au ${fin}` : ""}`,
  noteAVenir: (debut: string, fin: string | null) => `Ça commence le ${debut}${fin ? ` et ça dure jusqu'au ${fin}` : ""}. Échauffe tes papilles !`,
  reussiLu: "Défi réussi",
  aVenirLu: "À venir",
  avanceeLu: (fait: number, objectif: number) => `Avancée : ${fait} sur ${objectif}`,
  jusquauLu: (fin: string) => `, jusqu'au ${fin}`,
  reussi: "Réussi ✅",
} as const;

export const TEXTES_LISTE_DEFIS = {
  titre: "Défis du moment",
  sousTitre: "Des petites quêtes gourmandes, des points en plus.",
  horsLigne: "Tes défis arrivent dès que le réseau revient. Ils t'attendent bien au chaud !",
  sieste: "Tes défis font une petite sieste. Repasse sur ton profil dans un instant pour les réveiller.",
  aucun: "Pas de défi en ce moment : la Brigade en mijote de nouveaux. Reviens vite y goûter !",
} as const;

export const TEXTES_RESUME_DEFIS = {
  premierPas: (nom: string) => `Premier pas vers ${nom} : à toi de jouer !`,
  encoreUn: (nom: string) => `Encore 1 et ${nom}, c'est dans la poche !`,
  plusQue: (reste: number, nom: string) => `Plus que ${reste} pour ${nom} : ça chauffe en cuisine !`,
  toutReussi: "Tout est réussi : la Brigade te tire sa toque ! 🎉",
  caMijote: "Ça mijote en cuisine : échauffe tes papilles pour les prochains !",
  enCours: (nombre: number) => `${nombre} en cours`,
  aVenir: (nombre: number) => `${nombre} à venir`,
  reussis: (nombre: number) => `${nombre} réussi${nombre > 1 ? "s" : ""}`,
} as const;

export const TEXTES_CARTE_DEFI_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_CARTE_DEFI>> = { fr: TEXTES_CARTE_DEFI, en: TEXTES_CARTE_DEFI_ANGLAIS };
export const TEXTES_LISTE_DEFIS_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_LISTE_DEFIS>> = { fr: TEXTES_LISTE_DEFIS, en: TEXTES_LISTE_DEFIS_ANGLAIS };
export const TEXTES_RESUME_DEFIS_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_RESUME_DEFIS>> = { fr: TEXTES_RESUME_DEFIS, en: TEXTES_RESUME_DEFIS_ANGLAIS };
