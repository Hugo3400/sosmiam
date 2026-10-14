// Textes de « Continuer avec Apple » et « Continuer avec Google » (services/connexion-externe.server.ts). Les messages
// arrivent par « ?externe=<code> » sur la page qui montre les boutons : jamais un texte venu d'ailleurs.
// Aucun import ici : les tests (tests/connexion-externe.test.ts) lancent ce fichier directement avec Node.

/** Ce qui peut mal tourner, dit à la page de départ */
export type CodeConnexionExterne =
  | "annule" | "expire" | "refuse" | "deja-rattache" | "email-manquant" | "indisponible" | "trop-de-demandes" | "autre-compte";

export const messagesConnexionExterne: Record<CodeConnexionExterne, string> = {
  annule: "Pas de souci, rien n'a bougé. Tu peux réessayer quand tu veux, ou passer par ton e-mail.",
  expire: "Ta connexion a pris un peu trop de temps (10 minutes au plus). Recommence, ça va vite !",
  refuse: "Apple ou Google n'a pas pu confirmer qui tu es. Réessaie dans un instant, ou passe par ton e-mail.",
  "deja-rattache": "Ton compte SOS Miam est déjà lié à un autre compte Apple ou Google. Connecte-toi avec celui-là, ou avec ton e-mail.",
  "email-manquant": "Il nous faut ton adresse e-mail pour créer ton compte (avec Apple, l'adresse masquée marche très bien). Autorise son partage, puis réessaie.",
  indisponible: "Oups, la connexion avec Apple ou Google ne répond pas pour l'instant. Réessaie dans un instant, ou passe par ton e-mail.",
  "trop-de-demandes": "Doucement ! Trop d'essais d'affilée : réessaie dans quelques minutes.",
  "autre-compte": "Ce n'est pas le compte Apple ou Google lié à ton compte SOS Miam : reprends avec le bon.",
};

/** Le texte des boutons (libellés officiels en français d'Apple et de Google) */
export const libellesFournisseurs = { apple: "Continuer avec Apple", google: "Continuer avec Google" } as const;
