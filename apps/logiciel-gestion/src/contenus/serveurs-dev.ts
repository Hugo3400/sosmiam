import type { ActionServeur } from "../services/serveurs.ts";

export type NoteServeur = { ton: "alerte" | "conseil"; texte: string };

export const TEXTES_SERVEURS: Record<string, { role: string; notes: NoteServeur[] }> = {
  "app-dev": {
    role: "Il envoie l'app à Expo Go sur ton téléphone, à travers un tunnel public.",
    notes: [
      {
        ton: "alerte",
        texte: "Allumé, Metro (le serveur qui donne le code de l'app à Expo Go) est joignable par Internet à travers le tunnel. Tu ne testes pas sur ton téléphone ? Éteins-le : une porte ouverte de moins.",
      },
      {
        ton: "conseil",
        texte: "Tu viens d'ajouter un module natif (npx expo install …) ? Redémarre-le, sinon Expo Go plante avec « ExpoAsset ». Le QR code ne change pas.",
      },
      {
        ton: "conseil",
        texte: "Si le VPS redémarre, pm2 le rallume tout seul : repasse par ici pour l'éteindre.",
      },
    ],
  },
  "site-dev": {
    role: "Le site en mode développement (127.0.0.1:5190), que tu ouvres avec le transfert de port de VS Code.",
    notes: [
      {
        ton: "conseil",
        texte: "Ce n'est pas sosmiam.fr : l'éteindre ne coupe pas le vrai site. Il n'écoute que sur le serveur lui-même, rien d'ouvert sur Internet.",
      },
    ],
  },
  api: { role: "Le cœur : le site, l'app, le bot et ce logiciel passent par elle. Elle ne peut pas s'éteindre elle-même.", notes: [] },
  site: { role: "Le vrai site, sosmiam.fr. Pas un serveur de dev : il reste allumé.", notes: [] },
  "bot-discord": { role: "Le bot du serveur Discord SOS Miam.", notes: [] },
};

export const LIBELLES_ACTIONS: Record<ActionServeur, { bouton: string; fait: string; enCours: string }> = {
  allumer: { bouton: "Allumer", fait: "allumé", enCours: "s'allume" },
  eteindre: { bouton: "Éteindre", fait: "éteint", enCours: "s'éteint" },
  redemarrer: { bouton: "Redémarrer", fait: "redémarré", enCours: "redémarre" },
};

export const MESSAGES_ERREURS_SERVEURS: Record<string, string> = {
  "serveur-inconnu": "Ce serveur n'est pas dans la liste : le logiciel ne pilote que le serveur Expo et le site de dev.",
  "lecture-seule": "Celui-là reste en lecture seule : on ne coupe pas la production d'un clic.",
  "action-en-cours": "Un serveur est déjà en train de bouger : attends quelques secondes, puis réessaie.",
  "deja-allume": "Il est déjà allumé. Actualise pour voir son état.",
  "deja-eteint": "Il est déjà éteint. Actualise pour voir son état.",
  "serveur-absent": "pm2 ne le connaît plus : il faut le recréer dans un terminal du serveur.",
  "pm2-introuvable": "pm2 est introuvable sur le serveur : rien n'a bougé.",
  "pm2-trop-long": "pm2 n'a pas répondu en 30 secondes. Actualise : l'action a peut-être eu lieu quand même.",
  "pm2-erreur": "pm2 a refusé.",
};
