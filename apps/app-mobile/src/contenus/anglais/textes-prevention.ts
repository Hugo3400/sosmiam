import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { TEXTES_PREVENTION } from "~/contenus/textes-prevention";

export const TEXTES_PREVENTION_ANGLAIS: Traduction<typeof TEXTES_PREVENTION> = {
  traductionMessageSanitaire: "Alcohol abuse is dangerous to health. Consume in moderation.",
  besoinDEnParler: (service: string) =>
    `Need to talk about it, for yourself or someone close to you? ${service} (French-language helpline) is there for you, anonymously and with no premium charge.`,
  telephone: (telephone: string) => `${telephone} (+33 9 80 98 09 30)`,
  appelerLu: (service: string, telephone: string) => `Call ${service}, ${telephone}, anonymous, no premium charge (the service is in French)`,
  ouvrirSiteLu: (service: string) => `Open the ${service} website`,
  besoinDAideLu: (service: string) => `Need help? Open the ${service} website`,
  besoinDAide: "Need help?",
};
