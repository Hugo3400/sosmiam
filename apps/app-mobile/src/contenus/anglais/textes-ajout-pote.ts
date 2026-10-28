import type { Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_ESPACE_COMMUNAUTE_ANGLAIS } from "~/contenus/anglais/textes-miamis";
import { TEXTES_ONGLETS_POTES_ANGLAIS } from "~/contenus/anglais/textes-onglets-potes";
import type { TEXTES_AJOUT_POTE } from "~/contenus/textes-ajout-pote";

const COMMUNAUTE = TEXTES_ESPACE_COMMUNAUTE_ANGLAIS.titre;
const AJOUTER_POTE = TEXTES_ONGLETS_POTES_ANGLAIS.bande.ajouterPote;
const SCANNER = "Scan a QR code";

export const TEXTES_AJOUT_POTE_ANGLAIS: Traduction<typeof TEXTES_AJOUT_POTE> = {
  recherche: {
    aucun: (pseudo: string) => `No one matches @${pseudo}. Check the spelling, or ask them for their link or QR code instead!`,
    resultats: (n: number, pseudo: string) => `${n} result${n === 1 ? "" : "s"} for @${pseudo}`,
    ajoute: (prenom: string) => `${prenom} has joined your crew!`,
    demande: (prenom: string) => `Request sent to ${prenom}. As soon as it's accepted, you're in the same crew.`,
    deja: (prenom: string) => `${prenom}'s already in your crew.`,
    bloque: (prenom: string) => `You've blocked ${prenom}. To add them, unblock them first from their profile.`,
    demandesFermees: (prenom: string) => `${prenom} doesn't take requests by username – ask them for their link or QR code instead!`,
    erreur: "That didn't work this time. Try again in a moment?",
    champ: "Your friend's username",
    aide: "With or without “@” – the start of the username is enough.",
    tropCourt: "Type at least 2 letters.",
    enCours: "Searching…",
    rechercheRatee: "The search didn't work this time. Try again in a moment!",
    profilIndice: "Opens their profile",
    dejaDansBande: "Already in your crew",
    demandeEnvoyee: "Request sent",
    ajouterLu: (prenom: string, pseudo: string) => `Add ${prenom}, @${pseudo}`,
    ajouterIndice: "Asks them to join your crew",
    ajouter: "Add",
  },
  retour: {
    ajoute: { titre: (prenom: string) => `${prenom} has joined your crew!`, detail: "Now you can organise get-togethers and send each other places." },
    deja: { titre: (prenom: string) => `${prenom}'s already in your crew`, detail: "You can't add someone twice – not even a friend worth their weight in gold." },
    demande: {
      titre: (prenom: string) => `Request sent to ${prenom}`,
      detail: "As soon as it's accepted, you're in the same crew. With their link or QR code, it's instant!",
    },
    demandeSansPote: { titre: "Request sent", detail: "As soon as it's accepted, you're in the same crew." },
    bloque: {
      titre: (prenom: string) => `You've blocked ${prenom}`,
      detail: "While they're blocked, they can't join your crew. You can change your mind from their profile.",
    },
    introuvable: {
      titre: (pseudo: string) => `We can't find @${pseudo}`,
      detail: `Check the spelling, or ask them for their link or QR code instead (in ${COMMUNAUTE}, “${AJOUTER_POTE}”).`,
    },
    demandesFermees: {
      titre: (prenom: string) => `${prenom} doesn't take requests`,
      titreSansPote: "This person doesn't take requests",
      detail: "They've chosen not to be found by username. To join their crew, ask them for their link or QR code!",
    },
    lienChange: { titre: "This link has changed", detail: "Your friend has changed their username since. Ask them for their new link or their QR code." },
    invitationInvalide: {
      titre: "This link doesn't work any more",
      detail: "Your friend may have changed their link. Ask them for the new one, or their QR code – sorted in 2 seconds.",
    },
    erreur: { titre: "That didn't work this time", detail: "Try again in a moment. If it keeps happening, ask your friend to show you their QR code again." },
    pasInvitation: {
      titre: "This isn't an SOS Miam invitation",
      detail: `Ask your friend for their QR code, in ${COMMUNAUTE} then “${AJOUTER_POTE}”. Or paste their link – it starts with sosmiam.fr/invitation/.`,
    },
    toi: { titre: "Wait, that's you!", detail: "Good one, but you're already in your own crew. Show your QR code to a friend instead." },
    voirProfil: "See their profile",
    voirProfilIndice: (prenom: string) => `Opens ${prenom}'s profile`,
  },
  scanner: {
    pote: {
      messages: {
        refuse: `No camera, no scan. No worries – tap “${SCANNER}” again if you change your mind, or paste your friend's link just below.`,
        bloque: "The camera is turned off for SOS Miam. You can allow it in your phone's Settings app, or paste your friend's link just below.",
        panne: "The camera wouldn't switch on. Try again in a moment, or paste your friend's link just below.",
      },
      viseur: "Camera viewfinder: point it at your friend's QR code and it'll be read automatically",
      aide: "Point at your friend's QR code – we'll do the rest.",
      indice: "Turns on the camera to read a friend's QR code",
      web: "No camera in the web preview – scanning works in the app, on your phone. Here, paste your friend's link just below instead.",
    },
    appareil: {
      messages: {
        refuse: `No camera, no scan. No worries – tap “${SCANNER}” again if you change your mind.`,
        bloque: "The camera is turned off for SOS Miam. You can allow it in your phone's Settings app.",
        panne: "The camera wouldn't switch on. Try again in a moment.",
      },
      viseur: "Camera viewfinder: point it at the QR code of the device you're connecting and it'll be read automatically",
      aide: "Point at the QR code shown on the device you're connecting.",
      indice: "Turns on the camera to read the QR code of the device you're connecting",
      web: "No camera in the web preview – scanning works in the app, on your phone. Here, paste the QR code's link just below instead.",
    },
    arreter: "Stop scanning",
    scanner: SCANNER,
    ouvrirReglages: "Open phone settings",
  },
};
