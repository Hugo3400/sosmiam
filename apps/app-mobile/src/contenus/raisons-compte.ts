import type { RaisonCompte } from "~/hooks/utiliser-compte-requis";

/** Ce que la feuille « Crée ton compte » dit pour un geste réservé aux inscrits. */
export type ChoixRaisonCompte = {
  emoji: string;
  /** Ce que la personne voulait faire, à la suite de « pour » : « donner une rescousse » */
  action: string;
  /** « Crée ton compte pour donner une rescousse » */
  titre: string;
  /** Une phrase drôle et bienveillante sous le titre */
  phrase: string;
};

const raisons: Record<RaisonCompte, Omit<ChoixRaisonCompte, "titre">> = {
  rescousse: {
    emoji: "🛟",
    action: "donner une rescousse",
    phrase: "Tes 3 rescousses de la semaine sont prêtes, bien au chaud. Il ne leur manque plus que toi.",
  },
  jaime: {
    emoji: "❤️",
    action: "aimer cette publication",
    phrase: "On a vu ton petit cœur s'emballer. Avec un compte, tes coups de cœur restent rangés dans ton profil.",
  },
  commenter: {
    emoji: "💬",
    action: "rejoindre la discussion",
    phrase: "Commenter, répondre, applaudir la meilleure vanne : il ne manque plus que ton grain de sel.",
  },
  suivre: {
    emoji: "⭐",
    action: "suivre tes coups de cœur",
    phrase: "Leurs nouveautés passeront en tête de ton fil. Comme le journal du matin, mais en plus appétissant.",
  },
  garder: {
    emoji: "📌",
    action: "garder ce lieu",
    phrase: "On te le met de côté, promis. Il t'attendra sagement dans ton profil, comme la dernière part de gâteau.",
  },
  partager: {
    emoji: "📣",
    action: "partager les bons plans",
    phrase: "Faire tourner les bonnes adresses, c'est notre sport préféré. Il ne manque plus que ton maillot.",
  },
  envoyer: {
    emoji: "💌",
    action: "l'envoyer à un pote",
    phrase: "Ta bande mérite de savoir ! Inscris-toi, ajoute tes potes, et vous n'aurez plus qu'à choisir l'heure.",
  },
  masquer: {
    emoji: "🙈",
    action: "régler ton fil à ton goût",
    phrase: "Pas ton truc ? Aucun souci. Avec un compte, on retient tes goûts et on t'en montre moins.",
  },
  signaler: {
    emoji: "🚩",
    action: "nous signaler un souci",
    phrase: "Merci d'ouvrir l'œil ! Un compte nous aide à prendre chaque signalement au sérieux (et à éviter les signalements en rafale).",
  },
  potes: {
    emoji: "👯",
    action: "retrouver tes potes",
    phrase: "Ta bande, vos sorties, vos discussions : tout ça t'attend juste de l'autre côté de l'inscription.",
  },
  profil: {
    emoji: "🙋",
    action: "avoir ton profil",
    phrase: "Ton avatar, tes points, tes badges : ta vitrine perso n'attend plus que toi.",
  },
  scan: {
    emoji: "📷",
    action: "valider tes visites",
    phrase: "Un scan, et ta visite compte pour le lieu comme pour tes points. Encore faut-il savoir à qui les donner !",
  },
  defis: {
    emoji: "🏆",
    action: "relever des défis",
    phrase: "Des défis gourmands, des points à la clé, et ta fierté en dessert.",
  },
};

/** Pour chaque geste réservé aux inscrits : l'emoji, le titre « Crée ton compte pour … » et la phrase de la feuille. */
export const raisonsCompte = Object.fromEntries(
  Object.entries(raisons).map(([cle, raison]) => [cle, { ...raison, titre: `Crée ton compte pour ${raison.action}` }]),
) as Record<RaisonCompte, ChoixRaisonCompte>;
