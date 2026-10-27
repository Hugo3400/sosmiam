import type { ParLangue, Traduction } from "../../../../packages/commun/src/types/traduction.ts";
import { TEXTES_INSCRIPTION_COMPTE_ANGLAIS } from "~/contenus/anglais/inscription-compte";

export const TEXTES_INSCRIPTION_COMPTE = {
  espaces: {
    ambassadeur: {
      titre: "Deviens ambassadeur",
      description: "Crée ton compte ambassadeur SOS Miam, dès 18 ans : l'équipe valide chaque inscription.",
      chapo: "C'est gratuit, dès 18 ans. L'équipe lit chaque inscription : une fois la tienne validée, ton espace s'ouvre.",
      aidePrenom: "Il pourra s'afficher « Déniché par … » sur la fiche d'un lieu que tu as proposé.",
      apres: "L'équipe lit chaque inscription avant d'ouvrir ton espace. Ce compte sera aussi celui de l'app SOS Miam quand elle sortira. Ce qu'on fait de tes données : ",
    },
    pro: {
      titre: "Crée ton compte pro",
      description: "Crée ton compte SOS Miam pour gérer la fiche de ton lieu, dès 18 ans : gratuit, sans abonnement ni commission.",
      chapo: "C'est gratuit, dès 18 ans, sans abonnement ni commission. Ensuite, tu cherches ton lieu et l'équipe vérifie qu'il est bien à toi.",
      aidePrenom: "Ton équipe le verra quand tu l'inviteras.",
      apres: "Un seul compte SOS Miam : le même pour l'app quand elle sortira. Ce qu'on fait de tes données : ",
    },
  },
  separateur: "ou crée ton compte avec ton e-mail",
  emailPris: "Un compte existe déjà avec cette adresse. Connecte-toi, ou passe par « Mot de passe oublié ».",
  champInvalide: "Un champ ne va pas : vérifie le formulaire.",
  tropDInscriptions: "Doucement ! Trop d'inscriptions d'affilée depuis ta connexion : réessaie dans une heure.",
  pasPassee: "Oups, ton inscription n'est pas passée. Réessaie dans un instant, ou écris-nous à bonjour@sosmiam.fr.",
  newsletter: "Oui, envoie-moi la newsletter de SOS Miam : nouveaux lieux, nouvelles villes et BIG SOS près de chez moi. Désinscription en un clic, sans rancune 🍟",
  creerMonCompte: "Créer mon compte",
  dejaUnCompte: "Déjà un compte ? ",
  connecteToi: "Connecte-toi",
  aideDateNaissance: "Elle sert seulement à vérifier que tu as 18 ans. On ne la garde pas.",
  refusAge: {
    titre: "Encore un peu de patience !",
    rienGarde: "SOS Miam, c'est dès 18 ans : l'app, le programme Ambassadeurs et l'espace pro. On n'a rien gardé : ni ton e-mail, ni ta date de naissance.",
    enAttendant: "En attendant, tu peux suivre l'aventure SOS Miam avec la newsletter. Et pour tes 18 ans, on t'attend !",
    bouton: "Je m'inscris à la newsletter",
  },
};

export const TEXTES_INSCRIPTION_COMPTE_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_INSCRIPTION_COMPTE>> = {
  fr: TEXTES_INSCRIPTION_COMPTE,
  en: TEXTES_INSCRIPTION_COMPTE_ANGLAIS,
};
