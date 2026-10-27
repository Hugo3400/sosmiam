import type { ParLangue, Traduction } from "../types/traduction.ts";
import { TEXTES_COURRIELS_COMPTES_ANGLAIS } from "./anglais/courriels-comptes.ts";

export const TEXTES_COURRIELS_COMPTES = {
  ambassadeurValide: {
    objet: (prenom: string) => `C'est validé, ${prenom} : bienvenue chez les ambassadeurs 🛟`,
    titre: (prenom: string) => `Bienvenue dans l'équipe, ${prenom} !`,
    paragraphes: [
      "On a lu ton inscription et c'est tout bon : ton espace ambassadeur est ouvert.",
      "Tu peux y proposer tes pépites, suivre tes points et tes badges, et retrouver les missions et les messages de l'équipe. Les lieux qu'on aide comptent sur des gens comme toi pour se faire connaître : merci d'être là.",
      "Une question ? Réponds simplement à ce mail, on lit tout.",
    ],
    bouton: "Ouvrir mon espace",
    pied: "Tu reçois ce mail parce que tu t'es inscrit à l'espace ambassadeur de SOS Miam.",
  },
  certifie: {
    objet: (prenom: string) => `Te voilà Ambassadeur certifié ✓, ${prenom} !`,
    titre: (prenom: string) => `Bravo ${prenom}, tu es certifié ✓`,
    paragraphes: [
      "On a lu ta candidature et c'est oui : tu fais désormais partie des ambassadeurs certifiés, ceux qui donnent un vrai coup de main aux lieux.",
      "Ton badge « Ambassadeur certifié ✓ » apparaîtra sur les fiches des lieux que tu aides. L'équipe pourra te confier des missions chez les lieux partenaires, et ton kit média pro t'attend dans ton espace.",
      "La règle d'or ne change pas : tu n'es jamais payé par un lieu. Si un lieu t'offre quelque chose, écris-le clairement : « Collaboration commerciale ».",
      "Une question ? Réponds simplement à ce mail, on lit tout.",
    ],
    bouton: "Ouvrir mon espace",
    pied: "Tu reçois ce mail parce que ta candidature d'ambassadeur certifié a été acceptée.",
  },
  alerteRetrait: {
    objet: (date: string) => `Ton rôle d'ambassadeur SOS Miam s'arrête dès le ${date}`,
    titre: (prenom: string) => `Tu nous manques, ${prenom} !`,
    paragraphes: (date: string) => [
      `Ton espace ambassadeur n'a pas servi depuis presque un an. Comme prévu dans nos règles, ton rôle d'ambassadeur s'arrêtera dès le ${date} : tes missions et tes messages partiront avec lui. Ton compte SOS Miam, tes points et tes badges, eux, restent.`,
      `Tu veux continuer l'aventure ? Il suffit de te connecter avant le ${date}. Sinon, tu n'as rien à faire.`,
    ],
    bouton: "Me connecter",
    pied: "Tu reçois ce mail parce que tu es ambassadeur SOS Miam. C'est le seul qu'on t'enverra à ce sujet.",
  },
  alerteEffacement: {
    objet: (date: string) => `Ton compte SOS Miam sera effacé dès le ${date}`,
    titre: (prenom: string) => `On ne t'a pas vu depuis longtemps, ${prenom}`,
    paragraphes: (date: string) => [
      `Ton compte SOS Miam n'a pas servi depuis presque deux ans. Comme promis dans notre politique de confidentialité, il sera effacé pour de bon dès le ${date}, avec tout ce qui va avec.`,
      `Tu veux le garder ? Il suffit de te connecter avant le ${date}. Sinon, tu n'as rien à faire : on efface tout, sans relance.`,
    ],
    bouton: "Me connecter",
    pied: "Tu reçois ce mail parce que tu as un compte SOS Miam. C'est le seul qu'on t'enverra à ce sujet.",
  },
  motDePasse: {
    objet: "Ton lien pour choisir un nouveau mot de passe",
    titre: (prenom: string) => `Un nouveau mot de passe, ${prenom} ?`,
    paragraphes: (echeance: string) => [
      `Voici ton lien pour choisir un nouveau mot de passe. Il marche jusqu'au ${echeance}, une seule fois.`,
      "Tu n'as rien demandé ? Ignore ce mail : ton mot de passe actuel ne change pas.",
    ],
    bouton: "Choisir mon mot de passe",
    pied: "Tu reçois ce mail parce qu'une réinitialisation de mot de passe a été préparée pour ton compte SOS Miam.",
  },
  verificationEmail: {
    objet: "Confirme ton adresse e-mail SOS Miam 🛟",
    titre: (prenom: string) => `Bienvenue, ${prenom} !`,
    paragraphes: (echeance: string) => [
      "Encore un clic : confirme que cette adresse est bien la tienne, et ton inscription part à l'équipe, qui la regarde à la main.",
      `Le lien marche jusqu'au ${echeance}, une seule fois.`,
      "Tu n'as rien demandé ? Ignore ce mail : sans confirmation, rien ne se passe.",
    ],
    bouton: "Confirmer mon adresse",
    pied: "Tu reçois ce mail parce que quelqu'un (toi, on espère !) vient de créer un compte SOS Miam avec cette adresse.",
  },
  ecrit: {
    pied: "Ce mail t'a été écrit par l'équipe de SOS Miam. Pour nous répondre, réponds simplement à ce mail.",
  },
  bouton: (texte: string, adresse: string) => `${texte} : ${adresse}`,
};

export const TEXTES_COURRIELS_COMPTES_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_COURRIELS_COMPTES>> = {
  fr: TEXTES_COURRIELS_COMPTES,
  en: TEXTES_COURRIELS_COMPTES_ANGLAIS,
};
