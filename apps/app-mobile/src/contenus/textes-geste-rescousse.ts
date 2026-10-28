import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_GESTE_RESCOUSSE_ANGLAIS } from "~/contenus/anglais/textes-geste-rescousse";

export const TEXTES_GESTE_RESCOUSSE = {
  nonVerifie: "Ce lieu n'a pas encore de compte SOS Miam : invite-le ! 📣",
  epuisee: "Plus de rescousse cette semaine, reviens lundi ! 🛟",
  sansSession: "🔑 Connecte-toi à ton compte pour donner tes rescousses",
  horsLignePasPartie: "📶 Pas de réseau : ta rescousse n'est pas partie, réessaie dans un instant",
  horsLigneToujoursLa: "📶 Pas de réseau : ta rescousse est toujours là, réessaie dans un instant",
  echecService: (emoji: string, titre: string, donnee: boolean) => `${emoji} ${titre}, ${donnee ? "ta rescousse n'est pas partie" : "ta rescousse est toujours là"}`,
  merci: (reste: number) => `🛟 Merci ! Encore ${reste} rescousse${reste > 1 ? "s" : ""} cette semaine`,
  derniere: "Dernière rescousse donnée, merci pour eux ! 🦸",
  premierSauveteur: (nom: string, points: number) => `🚀 Premier sauveteur ! ${nom} vient d'arriver et tu es déjà là : +${points} points`,
  reprise: "Rescousse reprise",
};

export const TEXTES_GESTE_RESCOUSSE_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_GESTE_RESCOUSSE>> = { fr: TEXTES_GESTE_RESCOUSSE, en: TEXTES_GESTE_RESCOUSSE_ANGLAIS };
