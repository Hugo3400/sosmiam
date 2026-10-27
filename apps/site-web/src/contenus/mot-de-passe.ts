import type { ParLangue, Traduction } from "../../../../packages/commun/src/types/traduction.ts";
import { TEXTES_MOT_DE_PASSE_ANGLAIS } from "~/contenus/anglais/mot-de-passe";

export const TEXTES_MOT_DE_PASSE = {
  oublie: {
    titreMeta: "Mot de passe oublié",
    description: "Mot de passe oublié sur ton compte SOS Miam : reçois un lien pour en choisir un nouveau.",
    titre: "Mot de passe oublié ?",
    chapo: "Pas de panique, ça arrive à tout le monde. Donne-nous ton e-mail : on t'envoie un lien pour en choisir un nouveau.",
    cestNote: "C'est noté !",
    /** La même réponse, que l'adresse ait un compte ou non : personne ne peut s'en servir pour savoir qui est inscrit. */
    reponseEnvoi:
      "Si un compte existe avec cette adresse, tu vas recevoir un lien pour choisir un nouveau mot de passe. Il marche 24 heures, une seule fois. Pense à regarder tes indésirables !",
    retourConnexion: "Retour à la connexion",
    bouton: "Recevoir le lien",
    aideEmail: "L'adresse de ton compte.",
    rienRecu: "Rien reçu, même dans tes indésirables ? Écris-nous depuis l'adresse de ton compte à ",
    tropDeDemandes: (attente: string) => `Doucement ! Trop de demandes d'affilée depuis ta connexion : réessaie dans ${attente}.`,
    pasPassee: (email: string) => `Oups, ta demande n'est pas passée. Réessaie dans un instant, ou écris-nous à ${email}.`,
  },
  nouveau: {
    titre: "Nouveau mot de passe",
    description: "Choisis un nouveau mot de passe pour ton compte SOS Miam.",
    chapo: "Choisis-en un nouveau : il remplace l'ancien tout de suite.",
    cestFait: "C'est fait !",
    connecteToi: "Connecte-toi avec ton nouveau mot de passe.",
    meConnecter: "Me connecter",
    jetonInvalide: "Ce lien ne marche plus : il a déjà servi, ou il a plus de 24 heures. Demandes-en un nouveau sur la page Mot de passe oublié.",
    tropDEssais: "Trop d'essais : réessaie dans 10 minutes.",
    bouton: "Enregistrer mon mot de passe",
    lienReconnu: "Ton lien est bien reconnu.",
  },
  changer: {
    bouton: "Changer mon mot de passe",
  },
};

export const TEXTES_MOT_DE_PASSE_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_MOT_DE_PASSE>> = {
  fr: TEXTES_MOT_DE_PASSE,
  en: TEXTES_MOT_DE_PASSE_ANGLAIS,
};
