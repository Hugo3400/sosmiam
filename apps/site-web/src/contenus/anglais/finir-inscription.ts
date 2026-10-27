import type { Traduction } from "../../../../../packages/commun/src/types/traduction.ts";
import type { TEXTES_FINIR_INSCRIPTION } from "~/contenus/finir-inscription";

export const TEXTES_FINIR_INSCRIPTION_ANGLAIS: Traduction<typeof TEXTES_FINIR_INSCRIPTION> = {
  titre: "Finish signing up",
  description: "Three more details and your SOS Miam account is ready.",
  chapo: "Welcome to the Miamis! Just three more details and your SOS Miam account is ready.",
  laisserTomber: "Actually, no – I'll leave it",
  lieA: (fournisseur: string) => `Your SOS Miam account will be linked to ${fournisseur}, with the address `,
  aideDateNaissance: "It's stored encrypted with your account, just like for an account created in the app.",
  ville: "Where in France are you?",
  aideVille: "So we can show you places nearby in the app.",
};
