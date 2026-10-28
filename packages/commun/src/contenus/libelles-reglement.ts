// Libellés du règlement d'une visite (payée, avec réduction, offerte) et des avantages (liste fermée, décidée le
// 9 octobre 2026). Côté lieu, on dit ce que l'équipe a fait ; côté client, ce que ça veut dire pour lui.

import type { ParLangue, Traduction } from "../types/traduction.ts";
import type { AvantageVisite, TypeReglement } from "../types/visite.ts";
import {
  LIBELLES_AVANTAGE_ANGLAIS,
  LIBELLES_REGLEMENT_CLIENT_ANGLAIS,
  LIBELLES_REGLEMENT_LIEU_ANGLAIS,
  MENTIONS_AVIS_REGLEMENT_ANGLAIS,
  TEXTE_VISITE_OFFERTE_ANGLAIS,
} from "./anglais/libelles-reglement.ts";

/** Ce que choisit l'équipe en validant */
export const LIBELLES_REGLEMENT_LIEU: Readonly<Record<TypeReglement, string>> = {
  paye: "Payé",
  reduction: "Payé avec réduction",
  offert: "Offert par le lieu",
};

/** Ce que lit le client sur sa visite */
export const LIBELLES_REGLEMENT_CLIENT: Readonly<Record<TypeReglement, string>> = {
  paye: "Payée",
  reduction: "Payée avec réduction",
  offert: "Offerte par le lieu",
};

/** Un avantage, en étiquette courte (comptoir, visite, avis) */
export const LIBELLES_AVANTAGE: Readonly<Record<AvantageVisite, string>> = {
  "recompense-fidelite": "Récompense fidélité",
  "happy-hour": "Happy hour ou formule",
  "offre-sos": "Offre SOS",
  partenariat: "Collaboration commerciale",
  autre: "Autre avantage",
};

/** Mention sur un avis public, pour la transparence (jamais sur un avis d'une visite simplement payée) */
export const MENTIONS_AVIS_REGLEMENT: Readonly<Record<TypeReglement, string | null>> = {
  paye: null,
  reduction: "Avec réduction",
  offert: "Repas offert",
};

/** Ce que lit le client d'une visite offerte : pourquoi ni points ni tampon, et ce qui reste (l'avis, marqué « Repas offert ») */
export const TEXTE_VISITE_OFFERTE =
  "Offerte par le lieu : pas de points ni de tampon cette fois, pour que les avis restent honnêtes. Ton avis compte quand même, marqué « Repas offert ».";

export const LIBELLES_REGLEMENT_LIEU_PAR_LANGUE: ParLangue<Traduction<typeof LIBELLES_REGLEMENT_LIEU>> = { fr: LIBELLES_REGLEMENT_LIEU, en: LIBELLES_REGLEMENT_LIEU_ANGLAIS };

export const LIBELLES_REGLEMENT_CLIENT_PAR_LANGUE: ParLangue<Traduction<typeof LIBELLES_REGLEMENT_CLIENT>> = { fr: LIBELLES_REGLEMENT_CLIENT, en: LIBELLES_REGLEMENT_CLIENT_ANGLAIS };

export const LIBELLES_AVANTAGE_PAR_LANGUE: ParLangue<Traduction<typeof LIBELLES_AVANTAGE>> = { fr: LIBELLES_AVANTAGE, en: LIBELLES_AVANTAGE_ANGLAIS };

export const MENTIONS_AVIS_REGLEMENT_PAR_LANGUE: ParLangue<Traduction<typeof MENTIONS_AVIS_REGLEMENT>> = { fr: MENTIONS_AVIS_REGLEMENT, en: MENTIONS_AVIS_REGLEMENT_ANGLAIS };

export const TEXTE_VISITE_OFFERTE_PAR_LANGUE: ParLangue<Traduction<typeof TEXTE_VISITE_OFFERTE>> = { fr: TEXTE_VISITE_OFFERTE, en: TEXTE_VISITE_OFFERTE_ANGLAIS };
