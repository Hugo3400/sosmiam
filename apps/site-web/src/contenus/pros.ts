// Ce que SOS Miam apporte aux lieux. Tout est gratuit, sans abonnement ni commission ; la pub signalée finance (voir docs/decisions.md).
import type { ParLangue, Traduction } from "../../../../packages/commun/src/types/traduction.ts";
import { TEXTES_PROS_ANGLAIS } from "~/contenus/anglais/pros";
import { formaterPrix } from "~/fonctions/prix/formater-prix";

export const TEXTES_PROS = {
  badge: "🍽️ Pour les pros",
  titre: { haut: "Ta salle est trop calme ?", bas: "Lance un SOS." },
  avantages: [
    { fort: "Fiche gratuite", suite: "créée en 5 minutes." },
    { fort: "Alerte « place ce soir » :", suite: "les gens du quartier sont prévenus." },
    { fort: "Statistiques :", suite: "vues, rescousses, visites validées." },
    { fort: "Créateurs locaux :", suite: "demande une vidéo de ton lieu." },
    { fort: "Aucune commission", suite: "sur tes réservations." },
  ],
  bouton: "Inscrire mon lieu",
  carte: {
    pourToujours: "Pour toujours",
    titre: "Tout est gratuit",
    prix: formaterPrix(0),
    pourTonLieu: "pour ton lieu",
    outils: ["Fiche du lieu", "Avis vérifiés", "QR code de visite", "SOS « place ce soir »", "Statistiques détaillées", "Événements"],
    sansEngagement: "Sans abonnement, sans engagement, sans commission",
    pub: "SOS Miam vit de la pub, toujours signalée, qui ne change jamais le classement.",
  },
};

export const TEXTES_PROS_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_PROS>> = {
  fr: TEXTES_PROS,
  en: TEXTES_PROS_ANGLAIS,
};
