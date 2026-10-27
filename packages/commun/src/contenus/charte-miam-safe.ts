import { PHRASE_MIAM_SAFE } from "../regles/miam-safe.ts";
import type { ParLangue } from "../types/traduction.ts";
import { ENGAGEMENTS_CHARTE_MIAM_SAFE_ANGLAIS } from "./anglais/charte-miam-safe.ts";

export type EngagementCharteMiamSafe = { titre: string; texte: string };

export const ENGAGEMENTS_CHARTE_MIAM_SAFE: readonly EngagementCharteMiamSafe[] = [
  {
    titre: "Toute l'équipe connaît la phrase et l'écran",
    texte: `Quand quelqu'un demande « ${PHRASE_MIAM_SAFE} » ou montre l'écran sombre avec le Capitaine Bouiboui, c'est qu'il ou elle a besoin d'aide, sans que ça se voie.`,
  },
  {
    titre: "On met la personne à l'abri, sans bruit",
    texte: "On l'accompagne à l'écart, on l'écoute et on lui demande ce qu'il lui faut : un taxi, appeler un proche, les secours. Pas d'annonce en salle, et on ne confronte pas seul la personne qui pose problème.",
  },
  {
    titre: "Les alertes silencieuses sont reçues pendant le service",
    texte: "Au moins un téléphone du comptoir a l'app SOS Miam en mode pro avec les notifications activées. Quand une alerte arrive, on appuie sur « On arrive » et on va voir, le plus vite possible.",
  },
  {
    titre: "On répond à l'équipe SOS Miam",
    texte: "Si quelqu'un nous raconte un souci dans le lieu, l'équipe SOS Miam peut te contacter. Après un signalement grave, elle peut retirer la charte et le badge.",
  },
];

export const ENGAGEMENTS_CHARTE_MIAM_SAFE_PAR_LANGUE: ParLangue<readonly EngagementCharteMiamSafe[]> = {
  fr: ENGAGEMENTS_CHARTE_MIAM_SAFE,
  en: ENGAGEMENTS_CHARTE_MIAM_SAFE_ANGLAIS,
};
