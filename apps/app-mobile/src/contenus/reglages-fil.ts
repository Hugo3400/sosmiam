import type { ChoixMenu } from "~/composants/fil/MenuPublication";
import type { RaisonCompte } from "~/hooks/utiliser-compte-requis";

// Une publication compte comme « à l'écran » dès qu'on en voit la moitié : pendant un glissé, il y en a toujours une
// (à 60 %, entre 40 et 60 % du geste, aucune ne l'était : la vidéo qu'on quittait se figeait encore à l'écran)
export const VISIBILITE = { itemVisiblePercentThreshold: 50 };
// Ce que demande chaque choix du menu « ⋯ » (rien pour l'adresse : elle se regarde sans compte)
export const raisonsMenu: Record<ChoixMenu, RaisonCompte | null> = {
  rescousse: "rescousse",
  inviter: "partager",
  adresse: null,
  envoyer: "envoyer",
  "pas-interesse": "masquer",
  signaler: "signaler",
};
// La fiche d'un lieu se prépare en coulisses quand tu t'arrêtes un moment sur une publication (pas pendant que tu fais défiler)
export const DELAI_PRECHARGEMENT = 1500;
// Compte créé depuis le fil : le fil revient à l'écran dans ces quelques secondes (sinon, l'inscription venait d'ailleurs)
export const FENETRE_ACCUEIL = 3000;
// « Compte créé ! » attend que l'inscription ait fini de s'effacer (VoiceOver annonce d'abord l'écran retrouvé)
export const DELAI_ACCUEIL = 600;
export const AUCUN_SUIVI: readonly string[] = [];
