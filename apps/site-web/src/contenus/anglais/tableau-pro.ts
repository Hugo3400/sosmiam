import type { Traduction } from "../../../../../packages/commun/src/types/traduction.ts";
import type { TEXTES_TABLEAU_PRO } from "~/contenus/tableau-pro";

export const TEXTES_TABLEAU_PRO_ANGLAIS: Traduction<typeof TEXTES_TABLEAU_PRO> = {
  meta: { titre: "My pro dashboard", description: "Your venues on SOS Miam." },
  salut: (prenom: string) => `Hi, ${prenom}!`,
  chapo: "Your pro dashboard: your venues, their listings, your staff.",
  demandeEnvoyee: "Your request is on its way! The SOS Miam team is checking that this venue really is yours, then its listing will open here.",
  invitations: "Staff invitations",
  mesLieux: "My venues",
  rattacher: "Claim a venue",
  lieuxIllisibles: "Oops, your venues didn't load. Reload the page in a moment.",
  reussites: {
    accepter: "You're on the staff now! The venue's listing is in your list.",
    retirer: "Done.",
  },
  erreurs: {
    dejaBouge: "Things have already changed in the meantime – the list below is up to date.",
    panne: "Oops, that didn't work. Try again in a moment.",
  },
  precision: (texte: string) => `: ${texte}`,
  statuts: {
    "en-attente": "Pending",
    valide: "Verified ✓",
    refuse: "Declined",
  },
  lieu: {
    gerant: "Manager",
    equipe: "Staff",
    maFiche: "My listing",
    laFiche: "The listing",
    maCarte: "My menu",
    laCarte: "The menu",
    suggestions: "Suggested edits",
    monEquipe: "My staff",
    affichette: "Table card",
    kit: "Media kit",
    quitter: "Leave this venue",
    enAttente: "The SOS Miam team is checking that this venue really is yours. Pop back a bit later – its listing will open here.",
    annuler: "Cancel my request",
    refuse: "The SOS Miam team couldn't confirm that this venue is yours.",
    motEquipe: "A note from the SOS Miam team: ",
    redemander: "Ask again",
    retirer: "Remove from my list",
  },
  invitation: {
    debut: "You've been invited to join the staff at ",
    accepter: "Accept",
    refuser: "Decline",
    precision: (nom: string) => `the invitation from ${nom}`,
  },
  sansLieu: {
    titre: "No venues here yet!",
    texte: "Look for your restaurant, bar, patisserie or thing to do. Once the SOS Miam team has checked it's yours, its listing opens here.",
    rattacher: "Claim my venue",
    pasSurSosMiam: "My venue isn't on SOS Miam",
  },
};
