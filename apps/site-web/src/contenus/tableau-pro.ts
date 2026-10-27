import type { ParLangue, Traduction } from "../../../../packages/commun/src/types/traduction.ts";
import { TEXTES_TABLEAU_PRO_ANGLAIS } from "~/contenus/anglais/tableau-pro";
import type { StatutRattachement } from "~/types/pro";

export const TEXTES_TABLEAU_PRO = {
  meta: { titre: "Mon tableau pro", description: "Tes lieux sur SOS Miam." },
  salut: (prenom: string) => `Salut, ${prenom} !`,
  chapo: "Ton tableau pro : tes lieux, leur fiche, ton équipe.",
  demandeEnvoyee: "Ta demande est partie ! L'équipe SOS Miam vérifie que ce lieu est bien à toi, puis sa fiche s'ouvre ici.",
  invitations: "Invitations",
  mesLieux: "Mes lieux",
  rattacher: "Rattacher un lieu",
  lieuxIllisibles: "Oups, tes lieux ne se sont pas affichés. Recharge la page dans un instant.",
  reussites: {
    accepter: "Bienvenue dans l'équipe ! La fiche du lieu est dans ta liste.",
    retirer: "C'est fait.",
  },
  erreurs: {
    dejaBouge: "Ça a déjà bougé entre-temps : la liste ci-dessous est à jour.",
    panne: "Oups, ça n'a pas marché. Réessaie dans un instant.",
  },
  precision: (texte: string) => ` : ${texte}`,
  statuts: {
    "en-attente": "En attente",
    valide: "Vérifié ✓",
    refuse: "Refusé",
  } satisfies Record<StatutRattachement, string>,
  lieu: {
    gerant: "Gérant",
    equipe: "Équipe",
    maFiche: "Ma fiche",
    laFiche: "La fiche",
    maCarte: "Ma carte",
    laCarte: "La carte",
    suggestions: "Suggestions",
    monEquipe: "Mon équipe",
    affichette: "Affichette",
    kit: "Kit média",
    quitter: "Quitter ce lieu",
    enAttente: "L'équipe SOS Miam vérifie que ce lieu est bien à toi. Repasse un peu plus tard : sa fiche s'ouvrira ici.",
    annuler: "Annuler ma demande",
    refuse: "L'équipe n'a pas pu confirmer que ce lieu est à toi.",
    motEquipe: "Le mot de l'équipe : ",
    redemander: "Redemander",
    retirer: "Retirer de ma liste",
  },
  invitation: {
    debut: "Tu es invité dans l'équipe de ",
    accepter: "Accepter",
    refuser: "Refuser",
    precision: (nom: string) => `l'invitation de ${nom}`,
  },
  sansLieu: {
    titre: "Pas encore de lieu par ici !",
    texte: "Cherche ton resto, ton bar, ta pâtisserie ou ta sortie : une fois que l'équipe a vérifié qu'il est à toi, sa fiche s'ouvre ici.",
    rattacher: "Rattacher mon lieu",
    pasSurSosMiam: "Mon lieu n'est pas sur SOS Miam",
  },
};

export const TEXTES_TABLEAU_PRO_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_TABLEAU_PRO>> = {
  fr: TEXTES_TABLEAU_PRO,
  en: TEXTES_TABLEAU_PRO_ANGLAIS,
};
