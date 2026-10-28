import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_AJOUT_POTE_ANGLAIS } from "~/contenus/anglais/textes-ajout-pote";

export const TEXTES_AJOUT_POTE = {
  recherche: {
    aucun: (pseudo: string) => `On ne trouve personne pour @${pseudo}. Vérifie l'orthographe, ou demande-lui plutôt son lien ou son QR code !`,
    resultats: (n: number, pseudo: string) => `${n} résultat${n > 1 ? "s" : ""} pour @${pseudo}`,
    ajoute: (prenom: string) => `${prenom} a rejoint ta bande !`,
    demande: (prenom: string) => `Demande envoyée à ${prenom} : dès qu'elle est acceptée, vous êtes dans la même bande.`,
    deja: (prenom: string) => `${prenom} est déjà dans ta bande.`,
    bloque: (prenom: string) => `Tu as bloqué ${prenom} : pour l'ajouter, débloque d'abord cette personne depuis son profil.`,
    demandesFermees: (prenom: string) => `${prenom} ne reçoit pas de demandes par pseudo : demande-lui plutôt son lien ou son QR code !`,
    erreur: "Ça n'a pas marché cette fois. Réessaie dans un instant ?",
    champ: "Pseudo de ton pote",
    aide: "Avec ou sans « @ » : le début du pseudo suffit.",
    tropCourt: "Tape au moins 2 lettres.",
    enCours: "On cherche…",
    rechercheRatee: "La recherche n'a pas marché cette fois. Réessaie dans un instant !",
    profilIndice: "Ouvre son profil",
    dejaDansBande: "Déjà dans ta bande",
    demandeEnvoyee: "Demande envoyée",
    ajouterLu: (prenom: string, pseudo: string) => `Ajouter ${prenom}, @${pseudo}`,
    ajouterIndice: "Lui demande de rejoindre ta bande",
    ajouter: "Ajouter",
  },
  retour: {
    ajoute: { titre: (prenom: string) => `${prenom} a rejoint ta bande !`, detail: "Vous pouvez maintenant organiser des sorties et vous envoyer des lieux." },
    deja: { titre: (prenom: string) => `${prenom} est déjà dans ta bande`, detail: "On ne peut pas l'ajouter deux fois, même un pote en or." },
    demande: {
      titre: (prenom: string) => `Demande envoyée à ${prenom}`,
      detail: "Dès qu'elle est acceptée, vous êtes dans la même bande. Avec son lien ou son QR code, c'est immédiat !",
    },
    demandeSansPote: { titre: "Demande envoyée", detail: "Dès qu'elle est acceptée, vous êtes dans la même bande." },
    bloque: {
      titre: (prenom: string) => `Tu as bloqué ${prenom}`,
      detail: "Tant que cette personne est bloquée, elle ne rejoint pas ta bande. Tu peux changer d'avis depuis son profil.",
    },
    introuvable: {
      titre: (pseudo: string) => `On ne trouve pas @${pseudo}`,
      detail: "Vérifie l'orthographe, ou demande-lui plutôt son lien ou son QR code (dans Potes, « Ajouter un pote »).",
    },
    demandesFermees: {
      titre: (prenom: string) => `${prenom} ne reçoit pas de demandes`,
      titreSansPote: "Cette personne ne reçoit pas de demandes",
      detail: "Elle a choisi qu'on ne la trouve pas par son pseudo. Pour rejoindre sa bande, demande-lui son lien ou son QR code !",
    },
    lienChange: { titre: "Ce lien a changé", detail: "Ton pote a changé de pseudo depuis : demande-lui son nouveau lien, ou son QR code." },
    invitationInvalide: {
      titre: "Ce lien ne marche plus",
      detail: "Ton pote a peut-être changé son lien. Demande-lui le nouveau, ou son QR code : c'est réglé en 2 secondes.",
    },
    erreur: { titre: "Ça n'a pas marché cette fois", detail: "Réessaie dans un instant. Si ça continue, demande à ton pote de te remontrer son QR code." },
    pasInvitation: {
      titre: "Ce n'est pas une invitation SOS Miam",
      detail: "Demande à ton pote son QR code, dans Potes puis « Ajouter un pote ». Ou colle son lien, il commence par sosmiam.fr/invitation/.",
    },
    toi: { titre: "Hé, mais c'est toi !", detail: "Joli, mais tu fais déjà partie de ta bande. Montre plutôt ton QR code à un pote." },
    voirProfil: "Voir son profil",
    voirProfilIndice: (prenom: string) => `Ouvre le profil de ${prenom}`,
  },
  scanner: {
    pote: {
      messages: {
        refuse: "Sans l'appareil photo, pas de scan. Pas de souci : retouche « Scanner » si tu changes d'avis, ou colle le lien de ton pote juste en dessous.",
        bloque: "L'appareil photo est coupé pour SOS Miam. Tu peux l'autoriser dans les réglages de ton téléphone, ou coller le lien de ton pote juste en dessous.",
        panne: "L'appareil photo n'a pas voulu s'allumer. Réessaie dans un instant, ou colle le lien de ton pote juste en dessous.",
      },
      viseur: "Viseur de l'appareil photo : vise le QR code de ton pote, il sera lu tout seul",
      aide: "Vise le QR code de ton pote, on s'occupe du reste.",
      indice: "Allume l'appareil photo pour lire le QR code d'un pote",
      web: "Pas d'appareil photo dans l'aperçu web : le scan marche dans l'app, sur ton téléphone. Ici, colle plutôt le lien de ton pote juste en dessous.",
    },
    appareil: {
      messages: {
        refuse: "Sans l'appareil photo, pas de scan. Pas de souci : retouche « Scanner » si tu changes d'avis.",
        bloque: "L'appareil photo est coupé pour SOS Miam. Tu peux l'autoriser dans les réglages de ton téléphone.",
        panne: "L'appareil photo n'a pas voulu s'allumer. Réessaie dans un instant.",
      },
      viseur: "Viseur de l'appareil photo : vise le QR code de l'appareil à connecter, il sera lu tout seul",
      aide: "Vise le QR code affiché sur l'appareil à connecter.",
      indice: "Allume l'appareil photo pour lire le QR code de l'appareil à connecter",
      web: "Pas d'appareil photo dans l'aperçu web : le scan marche dans l'app, sur ton téléphone. Ici, colle plutôt le lien du QR juste en dessous.",
    },
    arreter: "Arrêter le scan",
    scanner: "Scanner un QR code",
    ouvrirReglages: "Ouvrir les réglages",
  },
};

export const TEXTES_AJOUT_POTE_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_AJOUT_POTE>> = { fr: TEXTES_AJOUT_POTE, en: TEXTES_AJOUT_POTE_ANGLAIS };
