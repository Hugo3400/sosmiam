// La charte Miam Safe, signée par le gérant dans l'espace pro (docs/decisions.md, « Miam Safe »).
// Les engagements viennent des décisions du 9 octobre 2026 ; le texte final reste à relire avec Hugo.

/** La phrase que les Miamis disent au comptoir (la même que packages/commun/src/regles/miam-safe.ts) */
export const PHRASE_MIAM_SAFE = "Le Capitaine est là ?";

export const ENGAGEMENTS_CHARTE_MIAM_SAFE: readonly { titre: string; texte: string }[] = [
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
