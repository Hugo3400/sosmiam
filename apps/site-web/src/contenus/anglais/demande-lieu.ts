import type { Traduction } from "../../../../../packages/commun/src/types/traduction.ts";
import type { TEXTES_DEMANDE_LIEU } from "~/contenus/demande-lieu";

export const TEXTES_DEMANDE_LIEU_ANGLAIS: Traduction<typeof TEXTES_DEMANDE_LIEU> = {
  meta: {
    titre: "List my venue",
    description: "An independent restaurant, patisserie, bar or activity anywhere in France? List your venue on SOS Miam. It's free, with no subscription and no commission.",
  },
  titre: "List your venue",
  chapo: "It's free, with no subscription and no commission. Tell us about your venue – we read every request and reply by email.",
  champs: {
    nom: { libelle: "Venue name", erreur: "Give your venue's name (80 characters max)." },
    ville: { libelle: "Town or city", erreur: "Tell us which town or city it's in (80 characters max)." },
    adresse: { libelle: "Address", erreur: "Keep the address to 160 characters max." },
    description: {
      libelle: "Your venue in a few words",
      aide: "What makes it special, the atmosphere, why it deserves a fuller room (20 characters min).",
      erreur: "Describe your venue in 20 to 1,000 characters.",
    },
    plat: { libelle: "The dish or speciality to try", exemple: "Lemon tart", erreur: "Keep the dish to 80 characters max." },
    horaires: { libelle: "Opening hours", exemple: "Tue–Sat, 12:00–14:30 and 19:00–23:00", erreur: "Keep the opening hours to 160 characters max." },
    siteWeb: { libelle: "Website", exemple: "https://myvenue.fr", erreur: "Your website needs to be an address like https://myvenue.fr." },
    instagram: { libelle: "Instagram", exemple: "@myvenue", erreur: "Keep the Instagram account to 60 characters max." },
    contactNom: { libelle: "Your first name and surname", erreur: "Tell us your name (80 characters max)." },
    contactEmail: { libelle: "Your email", exemple: "you@email.fr", erreur: "That email address doesn't look right." },
    contactTelephone: { libelle: "Your phone number", erreur: "Keep the phone number to 30 characters max." },
  },
  types: { resto: "Restaurant", patisserie: "Patisserie", bar: "Bar or pub", sortie: "Activity", autre: "Something else" },
  formulaire: {
    tonLieu: "Your venue",
    cEstPlutot: "What kind of venue?",
    facultatif: " (optional)",
    toi: "You",
    pourTeRepondre: "So we can get back to you. These details are never published.",
    compteur: (longueur, maximum) => `${longueur} / ${maximum} characters`,
    envoi: "Sending…",
    envoyer: "Send my request",
    donnees: "What we do with this information: ",
    confidentialite: "privacy",
    merci: "Thanks, it's on its way!",
    retourAccueil: "Back to the home page",
  },
  messages: {
    unChamp: "One field needs fixing.",
    plusieursChamps: (nombre) => `${nombre} fields need fixing.`,
    envoyee: "We read every request. If everything's in order, we'll create your venue's listing and email you at the address you gave.",
    champInconnu: "Something's not right – check the form.",
    tropDeDemandes: "Easy there! Too many requests in a row. Try again in half an hour, or drop us a line at bonjour@sosmiam.fr.",
    erreur: "Oops, your request didn't go through. Try again in a moment, or drop us a line at bonjour@sosmiam.fr.",
  },
};
