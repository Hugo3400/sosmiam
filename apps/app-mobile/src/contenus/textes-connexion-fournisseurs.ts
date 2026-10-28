import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_CONNEXION_FOURNISSEURS_ANGLAIS } from "~/contenus/anglais/textes-connexion-fournisseurs";

export const TEXTES_CONNEXION_FOURNISSEURS = {
  indisponibleApple: "Apple n'est pas dispo ici",
  indisponibleGoogle: "Google n'est pas dispo ici",
  indisponibleTexte: "Ce bouton marche dans l'app installée depuis l'App Store ou Google Play. En attendant, passe par ton e-mail : ça marche partout.",
};

export const TEXTES_CONNEXION_FOURNISSEURS_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_CONNEXION_FOURNISSEURS>> = { fr: TEXTES_CONNEXION_FOURNISSEURS, en: TEXTES_CONNEXION_FOURNISSEURS_ANGLAIS };
