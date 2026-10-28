import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_PREVENTION_ANGLAIS } from "~/contenus/anglais/textes-prevention";

export const TEXTES_PREVENTION = {
  traductionMessageSanitaire: null as string | null,
  besoinDEnParler: (service: string) => `Besoin d'en parler, pour toi ou pour un proche ? ${service} répond, anonymement et sans surcoût.`,
  telephone: (telephone: string) => telephone,
  appelerLu: (service: string, telephone: string) => `Appeler ${service}, ${telephone}, appel anonyme et non surtaxé`,
  ouvrirSiteLu: (service: string) => `Ouvrir le site d'${service}`,
  besoinDAideLu: (service: string) => `Besoin d'aide ? Ouvrir le site d'${service}`,
  besoinDAide: "Besoin d'aide ?",
};

export const TEXTES_PREVENTION_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_PREVENTION>> = { fr: TEXTES_PREVENTION, en: TEXTES_PREVENTION_ANGLAIS };
