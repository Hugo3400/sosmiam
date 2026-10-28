import type { Traduction } from "../../types/traduction.ts";
import type {
  LIBELLES_AVANTAGE,
  LIBELLES_REGLEMENT_CLIENT,
  LIBELLES_REGLEMENT_LIEU,
  MENTIONS_AVIS_REGLEMENT,
  TEXTE_VISITE_OFFERTE,
} from "../libelles-reglement.ts";

export const LIBELLES_REGLEMENT_LIEU_ANGLAIS: Traduction<typeof LIBELLES_REGLEMENT_LIEU> = {
  paye: "Paid",
  reduction: "Paid with a discount",
  offert: "Gifted by the venue",
};

export const LIBELLES_REGLEMENT_CLIENT_ANGLAIS: Traduction<typeof LIBELLES_REGLEMENT_CLIENT> = {
  paye: "Paid",
  reduction: "Paid with a discount",
  offert: "Gifted by the venue",
};

export const LIBELLES_AVANTAGE_ANGLAIS: Traduction<typeof LIBELLES_AVANTAGE> = {
  "recompense-fidelite": "Loyalty reward",
  "happy-hour": "Happy hour or set menu",
  "offre-sos": "SOS offer",
  partenariat: "Collaboration commerciale",
  autre: "Other perk",
};

export const MENTIONS_AVIS_REGLEMENT_ANGLAIS: Traduction<typeof MENTIONS_AVIS_REGLEMENT> = {
  paye: null,
  reduction: "Discounted",
  offert: "Gifted meal",
};

export const TEXTE_VISITE_OFFERTE_ANGLAIS: Traduction<typeof TEXTE_VISITE_OFFERTE> =
  "Gifted by the venue: no points or stamp this time, to keep reviews honest. Your review still counts, marked “Gifted meal”.";
