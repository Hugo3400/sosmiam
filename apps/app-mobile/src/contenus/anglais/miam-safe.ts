import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { ECHEC_ALERTE_MIAM_SAFE, ECHECS_ALERTE_MIAM_SAFE, LIBELLES_ENDROIT_ALERTE, LIBELLES_RAISON_MIAM_SAFE, NUMEROS_URGENCE } from "~/contenus/miam-safe";

export const NUMEROS_URGENCE_ANGLAIS: Traduction<typeof NUMEROS_URGENCE> = [
  { numero: "112", libelle: "Emergencies", lien: "tel:112", lu: "Call 112 for any emergency, anywhere in Europe" },
  { numero: "17", libelle: "Police", lien: "tel:17", lu: "Call 17 for the police" },
  { numero: "18", libelle: "Fire & rescue", lien: "tel:18", lu: "Call 18 for fire and rescue" },
  { numero: "15", libelle: "Ambulance (SAMU)", lien: "tel:15", lu: "Call 15 for a medical emergency, SAMU" },
  { numero: "114", libelle: "By text (SMS)", lien: "sms:114", lu: "Text 114 if you can't speak" },
];

export const LIBELLES_ENDROIT_ALERTE_ANGLAIS: Traduction<typeof LIBELLES_ENDROIT_ALERTE> = {
  salle: "Inside",
  terrasse: "On the terrace",
  toilettes: "In the toilets",
  ailleurs: "Somewhere else",
};

export const ECHECS_ALERTE_MIAM_SAFE_ANGLAIS: Traduction<typeof ECHECS_ALERTE_MIAM_SAFE> = {
  "hors-ligne": "No signal here. Emergency numbers still work without internet.",
  "trop-de-demandes": "Too many requests in a short time, so the alert can't go out right now.",
  "pas-miam-safe": "This venue doesn't receive alerts: it hasn't signed the Miam Safe charter.",
};

export const ECHEC_ALERTE_MIAM_SAFE_ANGLAIS: Traduction<typeof ECHEC_ALERTE_MIAM_SAFE> = "We couldn't send it.";

export const LIBELLES_RAISON_MIAM_SAFE_ANGLAIS: Traduction<typeof LIBELLES_RAISON_MIAM_SAFE> = {
  harcelement: { titre: "Harassment", detail: "Someone wouldn't take no for an answer, followed you, or made inappropriate comments or gestures." },
  agression: { titre: "Assault", detail: "Someone hurt you, or tried to." },
  discrimination: { titre: "Discrimination", detail: "You were treated differently because of who you are." },
  personnel: { titre: "A member of staff", detail: "The behaviour of someone who works there." },
  autre: { titre: "Something else", detail: "Tell us in your own words." },
};
