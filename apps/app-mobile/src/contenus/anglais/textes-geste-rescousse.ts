import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { TEXTES_GESTE_RESCOUSSE } from "~/contenus/textes-geste-rescousse";

export const TEXTES_GESTE_RESCOUSSE_ANGLAIS: Traduction<typeof TEXTES_GESTE_RESCOUSSE> = {
  nonVerifie: "This place doesn't have an SOS Miam account yet – invite them! 📣",
  epuisee: "No rescues left this week. Back on Monday! 🛟",
  sansSession: "🔑 Log in to your account to give your rescues",
  horsLignePasPartie: "📶 No signal – your rescue didn't go through. Try again in a moment",
  horsLigneToujoursLa: "📶 No signal – your rescue's still there. Try again in a moment",
  echecService: (emoji: string, titre: string, donnee: boolean) => `${emoji} ${titre} – ${donnee ? "your rescue didn't go through" : "your rescue's still there"}`,
  merci: (reste: number) => `🛟 Thanks! ${reste} rescue${reste === 1 ? "" : "s"} left this week`,
  derniere: "That was your last rescue – thanks on their behalf! 🦸",
  premierSauveteur: (nom: string, points: number) => `🚀 First to the rescue! ${nom} has just joined and you're already there: +${points} points`,
  reprise: "Rescue taken back",
};
