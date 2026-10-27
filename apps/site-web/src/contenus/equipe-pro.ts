import type { ParLangue, Traduction } from "../../../../packages/commun/src/types/traduction.ts";
import { TEXTES_EQUIPE_PRO_ANGLAIS } from "~/contenus/anglais/equipe-pro";

export const TEXTES_EQUIPE_PRO = {
  meta: {
    titre: (nom: string) => `Mon équipe · ${nom}`,
    titreParDefaut: "Mon équipe",
    description: "L'équipe de ton lieu sur SOS Miam.",
  },
  page: "Mon équipe",
  chapo: "Tes collègues voient la fiche, les suggestions et l'affichette. Seul le gérant modifie.",
  reserveAuGerant: "Seul le gérant gère l'équipe du lieu.",
  qui: "Qui est dans l'équipe ?",
  illisible: "Oups, l'équipe ne s'est pas affichée. Recharge la page dans un instant.",
  inviter: {
    titre: "Inviter quelqu'un",
    texte: "Il lui faut un compte SOS Miam (gratuit). Son invitation l'attend dans son tableau pro.",
    bouton: "Inviter",
    email: "Son e-mail",
    exemple: "prenom@exemple.fr",
  },
  messages: {
    erreurs: {
      "compte-inconnu": "Personne n'a de compte SOS Miam avec cette adresse. Demande-lui d'en créer un (c'est gratuit, sur pro.sosmiam.fr), puis invite-le de nouveau.",
      "deja-membre": "Cette personne est déjà dans l'équipe, ou déjà invitée.",
      "trop-d-invitations": "Ça fait beaucoup d'invitations pour aujourd'hui : réessaie demain.",
      "equipe-complete": "Ton équipe est au complet (30 personnes). Retire quelqu'un pour en inviter un autre.",
      "trop-de-demandes": "Ça fait beaucoup d'invitations d'un coup : réessaie un peu plus tard.",
      "reserve-au-gerant": "Seul le gérant invite dans l'équipe.",
    },
    retire: "C'est fait.",
    membreInconnu: "Cette personne n'est déjà plus dans l'équipe.",
    panne: "Oups, ça n'a pas marché. Réessaie dans un instant.",
    emailInvalide: "Cette adresse e-mail ne semble pas valide.",
    invitationEnvoyee: "Invitation envoyée ! Elle s'affiche dans son tableau pro : il n'a plus qu'à l'accepter.",
    invitationPanne: "Oups, l'invitation n'est pas partie. Réessaie dans un instant.",
  },
  liste: {
    gerant: "Gérant",
    equipe: "Équipe",
    invite: "Invité, pas encore accepté",
    retirer: "Retirer",
    annulerInvitation: "Annuler l'invitation",
    precision: (prenom: string) => ` : ${prenom}`,
  },
};

export const TEXTES_EQUIPE_PRO_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_EQUIPE_PRO>> = {
  fr: TEXTES_EQUIPE_PRO,
  en: TEXTES_EQUIPE_PRO_ANGLAIS,
};
