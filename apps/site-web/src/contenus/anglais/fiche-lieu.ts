import { accorder } from "../../../../../packages/commun/src/fonctions/langue/accorder.ts";
import type { Traduction } from "../../../../../packages/commun/src/types/traduction.ts";
import type { TEXTES_FICHE_LIEU } from "~/contenus/fiche-lieu";

export const TEXTES_FICHE_LIEU_ANGLAIS: Traduction<typeof TEXTES_FICHE_LIEU> = {
  meta: {
    titre: (nom: string, ville: string) => `${nom} in ${ville}`,
    description: (nom: string, ville: string) => `${nom}, in ${ville}, on SOS Miam.`,
    introuvable: "Place not found — SOS Miam",
    indisponible: "This place's page is temporarily unavailable",
  },
  filAriane: {
    etiquette: "Breadcrumb",
    accueil: "Home",
  },
  badge: {
    verifie: "✓ Verified",
    nonVerifie: "Not verified",
    detailVerifie: "This place has an SOS Miam account: it runs its own page.",
    detailNonVerifie: "It doesn't have an SOS Miam account yet.",
  },
  nonVerifie: (source: string | null) =>
    `Not verified: this place doesn't have an SOS Miam account yet. Its details come from ${source ?? "the SOS Miam team or an ambassador"}.`,
  denichePar: (prenom: string) => `Spotted by ${prenom}`,
  ouverture: {
    ouvert: (heure: string) => `Open · closes at ${heure}`,
    ouvertSansArret: "Open 24 hours",
    minuit: "midnight",
    fermeAujourdhui: (heure: string) => `Closed · opens at ${heure}`,
    fermeDemain: (heure: string) => `Closed · opens tomorrow at ${heure}`,
    fermeJour: (jour: string, heure: string) => `Closed · opens on ${jour} at ${heure}`,
  },
  actions: {
    etiquette: "Actions for this place",
    itineraire: "Directions",
    vers: (nom: string) => ` to ${nom}`,
    appeler: "Call",
    appelerLe: (numero: string) => ` ${numero}`,
    reserverDansApp: "Book in the app",
    appelerPourReserver: "Call to book",
    siteWeb: "Website",
    instagram: "Instagram",
    partager: "Share",
    copie: "Link copied!",
    lienCopie: "Link copied – now send it to your friends!",
    copieImpossible: "The link didn't copy – grab the page address instead.",
    ouvrirApp: "Open the app",
  },
  etiquettes: "What the Miamis say",
  sos: {
    surtitre: "SOS tonight",
    places: (nombre: number, heure: string | null) =>
      `${nombre} free ${accorder(nombre, "en", "seat", "seats")}${heure ? ` until ${heure}` : " tonight"}`,
    bouton: "Open the app to head there",
  },
  lieu: {
    titre: { resto: "The place", patisserie: "The place", bar: "The place", sortie: "The activity" },
    specialite: "The speciality: ",
  },
  specialites: "The specialities",
  ambiance: {
    titre: "The atmosphere",
    note: "Tags given by the Miamis in the app, about the atmosphere and the food – never about alcohol.",
  },
  commentReserver: {
    titre: "How to book",
    texte: "On their website, by phone or on the spot – the place lets you know which it prefers.",
    site: "Book on their website",
    telephone: "Book by phone",
  },
  carte: {
    titre: { carte: "The menu", formules: "The packages" },
    rubriques: "Menu sections",
    majLe: (date: string) => `Updated by the venue on ${date}`,
    majCarte: (date: string) => `Menu updated by the venue on ${date}.`,
    voirTout: "See the full menu",
  },
  bonASavoir: {
    titre: "Good to know",
    paiement: (liste: string) => `Payment: ${liste}`,
  },
  infosPratiques: "Good to know",
  horaires: "Opening hours",
  ouCest: {
    titre: "Where to find it",
    itineraire: "Directions",
    agrandir: "Expand the map",
  },
  app: {
    titre: "In the SOS Miam app",
    texte: "Save this place, get its SOS alerts and earn points with every confirmed visit.",
    bouton: "Open in the app",
    bientot: "Don't have the app yet? It's coming soon to the stores.",
  },
  tonLieu: {
    titre: { resto: "Is this your restaurant?", patisserie: "Is this your patisserie?", bar: "Is this your bar?", sortie: "Is this your activity?" },
    texteNonVerifie:
      "Take charge of your listing: your description, opening hours, menu, and SOS alerts on quiet evenings. Your venue gets the Verified ✓ badge. It's free, with no subscription and no commission.",
    texteVerifie: "Part of the team? Join the pro area to run the listing together. It's free.",
    boutonNonVerifie: "Claim my listing",
    boutonVerifie: "Join the pro area",
  },
  signaler: {
    lien: "Wrong info? Report it",
    objet: (nom: string, id: number) => `Wrong info on the page for ${nom} (#${id})`,
    texte: (adresse: string) => `Hi SOS Miam team,\n\nOn the page ${adresse}, this info isn't right:\n\nThe correct info:\n`,
    image: "Report an image",
  },
  autour: {
    titre: "Around this place",
    titreSortie: "Somewhere to eat afterwards?",
    sos: "SOS tonight",
  },
  barreMobile: "Quick actions",
  source: {
    debut: "Text and details: ",
    licence: ", under ",
  },
  prevention: {
    etiquette: "Health and wellbeing",
    besoin: "Need to talk about it? ",
    service: (nom: string) => `${nom} (French-language helpline): `,
    anonyme: " (+33 9 80 98 09 30 · anonymous, no premium charge) or ",
    page: "Health and wellbeing",
  },
};
