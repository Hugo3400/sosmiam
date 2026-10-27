import type { Traduction } from "../../../../../packages/commun/src/types/traduction.ts";
import type { TEXTES_EQUIPE_PRO } from "~/contenus/equipe-pro";

export const TEXTES_EQUIPE_PRO_ANGLAIS: Traduction<typeof TEXTES_EQUIPE_PRO> = {
  meta: {
    titre: (nom: string) => `My staff · ${nom}`,
    titreParDefaut: "My staff",
    description: "Your venue's staff on SOS Miam.",
  },
  page: "My staff",
  chapo: "Your colleagues can see the listing, the suggested edits and the table card. Only the manager can make changes.",
  reserveAuGerant: "Only the manager manages the venue's staff.",
  qui: "Who's on the staff?",
  illisible: "Oops, your staff list didn't load. Reload the page in a moment.",
  inviter: {
    titre: "Invite someone",
    texte: "They'll need an SOS Miam account (it's free). Their invitation will be waiting in their pro dashboard.",
    bouton: "Invite",
    email: "Their email",
    exemple: "name@example.com",
  },
  messages: {
    erreurs: {
      "compte-inconnu": "Nobody has an SOS Miam account with this address. Ask them to create one (it's free, on pro.sosmiam.fr), then invite them again.",
      "deja-membre": "This person is already on your staff, or already invited.",
      "trop-d-invitations": "That's a lot of invitations for one day: try again tomorrow.",
      "equipe-complete": "Your staff list is full (30 people). Remove someone to invite someone else.",
      "trop-de-demandes": "That's a lot of invitations in one go: try again a bit later.",
      "reserve-au-gerant": "Only the manager can invite people to the staff.",
    },
    retire: "Done.",
    membreInconnu: "This person is no longer on your staff.",
    panne: "Oops, that didn't work. Try again in a moment.",
    emailInvalide: "That email address doesn't look right.",
    invitationEnvoyee: "Invitation sent! It shows up in their pro dashboard – all they need to do is accept it.",
    invitationPanne: "Oops, the invitation didn't go through. Try again in a moment.",
  },
  liste: {
    gerant: "Manager",
    equipe: "Staff",
    invite: "Invited, not accepted yet",
    retirer: "Remove",
    annulerInvitation: "Cancel the invitation",
    precision: (prenom: string) => `: ${prenom}`,
  },
};
