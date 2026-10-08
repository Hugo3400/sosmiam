// Où en est la demande d'ambassadeur, dit à la personne (espace ambassadeur de l'app, puis du site).
// Repris de apps/site-web/src/composants/ambassadeur/StatutAmbassadeur.tsx, sans prénom ni lien, pour servir partout.
// L'effacement à J+30 après un refus n'est pas cité : avec le compte unique, seul le rôle d'ambassadeur partira.

import type { StatutAmbassadeur } from "../types/roles.ts";

export const TEXTES_STATUT_AMBASSADEUR: Readonly<Record<StatutAmbassadeur, { titre: string; texte: string }>> = {
  "en-attente": {
    titre: "Merci, ta demande est bien arrivée !",
    texte:
      "L'équipe regarde chaque demande à la main : dès que la tienne est validée, ton espace s'ouvre ici, avec les missions et tout le reste. Repasse de temps en temps.",
  },
  actif: {
    titre: "Bienvenue chez les ambassadeurs",
    texte: "Missions sur place, avis à relire, messages de l'équipe : tout est là. Merci de donner un coup de main aux lieux de ton coin !",
  },
  refuse: {
    titre: "Ta demande n'a pas été retenue",
    texte:
      "Merci d'avoir proposé ton aide. Cette fois, l'équipe n'a pas retenu ta demande pour le programme Ambassadeurs. Tu peux toujours suivre l'aventure et donner des rescousses.",
  },
  suspendu: {
    titre: "Ton espace ambassadeur est en pause",
    texte: "Il est suspendu pour le moment. Pour en parler, écris-nous à bonjour@sosmiam.fr : un humain te répondra.",
  },
};
