import type { Traduction } from "../../../../../packages/commun/src/types/traduction.ts";
import type { TEXTES_CONSENTEMENT } from "~/contenus/cookies-consentement";

export const TEXTES_CONSENTEMENT_ANGLAIS: Traduction<typeof TEXTES_CONSENTEMENT> = {
  titre: "Cookies? Only if you want 🍪",
  invitation: (pour, plusieurs) => `To ${pour}, ${plusieurs ? "some partners would like" : "a partner would like"} to set cookies in your browser.`,
  et: " and ",
  sansAccord: "Without your consent, nothing is set, and SOS Miam works just as well.",
  changerDAvis: (lien) => `You can change your mind any time with “${lien}”, at the bottom of every page.`,
  portee: "Your choice is kept for 6 months, for sosmiam.fr and its ambassador and pro areas.",
  lienPage: "All about our cookies",
  apercu: "Preview: imaginary partner. Nothing is loaded or set, apart from your choice.",
  apercuReglages: "Preview: the partner is imaginary.",
  toutAccepter: "Accept all",
  toutRefuser: "Reject all",
  choisir: "Choose",
  enregistrer: "Save my choices",
  fermerSansAccepter: "Close and continue without accepting",
  fermerSansChanger: "Close without changing anything",
  titrePanneau: "Your choices, category by category",
  introPanneau: "Everything starts unticked: without your consent, the answer's no. Only tick what you're happy with.",
  introGestion: "Here are your current choices. Change what you like, then save – withdrawing consent is as easy as giving it.",
  toujoursActifs: "Always on",
  oui: "Yes",
  non: "No",
  voirPartenaires: (partenaires, traceurs) =>
    `Who sets what (${partenaires} ${partenaires === 1 ? "partner" : "partners"}, ${traceurs} ${traceurs === 1 ? "tracker" : "trackers"})`,
  deuxPoints: ": ",
  politique: "Their privacy policy",
  aucunTraceur: "No cookies, no trackers.",
  choixEnregistre: "Noted – your choice has been saved.",
  choixValable: (debut, fin) => `Your choice of ${debut} is valid until ${fin}. After that, we'll ask you again.`,
  sansChoix: "You haven't chosen anything yet. Until you say otherwise, the answer's no.",
  information: {
    titre: "Zero tracking cookies here 🍪",
    texte:
      "The only cookies we love are the ones from the patisserie round the corner. The site only uses the ones it needs to work (security, your login, your language): no ads, no tracking, so there's nothing to accept or reject.",
    compris: "OK, got it",
  },
  contenuExterne: {
    video: { vientDe: (fournisseur) => `This video comes from ${fournisseur}, which sets cookies.`, toujours: "Always show videos" },
    carte: { vientDe: (fournisseur) => `This map comes from ${fournisseur}, which sets cookies.`, toujours: "Always show maps" },
    publication: { vientDe: (fournisseur) => `This post comes from ${fournisseur}, which sets cookies.`, toujours: "Always show posts" },
    afficherQuandMeme: "Show anyway",
    voirSur: (fournisseur) => `View on ${fournisseur}`,
    portee: (lien) => ` · “Always show” applies to all content from other sites (videos, maps, posts). You can change your mind in “${lien}”.`,
  },
  categories: {
    necessaires: {
      nom: "Strictly necessary",
      explication:
        "Like salt in pasta – without them, nothing holds together. They protect the site, keep you logged in and remember your choices. The law doesn't require your consent for them, and they're never used for ads or to track you.",
      pourBandeau: "make the site work",
    },
    "contenus-externes": {
      nom: "Videos and content from other sites",
      explication:
        "YouTube videos, maps, and Instagram or TikTok posts embedded in our pages. These platforms set their own cookies as soon as their content appears, and may use them to recognise you. Without your consent, you'll see a thumbnail instead, with a button to show it anyway.",
      pourBandeau: "show videos and content from other sites (YouTube, Instagram, TikTok…)",
    },
    publicite: {
      nom: "Advertising",
      explication:
        "The ads that pay the bill so SOS Miam stays free, always labelled as ads. With your consent, our advertising partners set cookies to choose the ads and count how often they're shown. Without your consent, there are no advertising cookies, and the ranking of places doesn't budge an inch.",
      pourBandeau: "show ads that help us stay free",
    },
    "mesure-audience": {
      nom: "Audience measurement",
      explication:
        "Our current statistics don't need cookies: our server counts visits on its own, without leaving anything on your device, so they don't need your consent. This box will only be used if, one day, a measurement tool needs it.",
      pourBandeau: "measure our audience with an outside tool",
    },
  },
  partenaires: {
    "SOS Miam": { role: "Your login, your opt-out from statistics, your language, your cookie choices and where you are on the page." },
    Cloudflare: { role: "Protects the site from attacks and bots." },
    "Exemple (aperçu)": {
      nom: "Example (preview)",
      role: "An imaginary partner, just so you can see the banner. It doesn't load or leave anything.",
    },
  },
  traceurs: {
    "__Host-sosmiam-session": { finalite: "Keep you logged in.", duree: "90 days max" },
    "__Host-sosmiam-connexion-externe": { finalite: "Check the response from Apple or Google.", duree: "10 minutes max" },
    "__Host-sosmiam-inscription-externe": { finalite: "Finish signing up with Apple or Google.", duree: "10 minutes max" },
    "__Host-sosmiam-confirmation-externe": { finalite: "Link Apple or Google to an account without a password.", duree: "10 minutes max" },
    "__Host-sosmiam-connexion-qr": { finalite: "Wait for the app to confirm “Log in with the app”.", duree: "2 minutes max" },
    "sosmiam-sans-statistiques": { finalite: "Remember that you'd rather not be counted.", duree: "13 months" },
    "sosmiam-langue": { finalite: "Remember the language you chose.", duree: "1 year" },
    "sosmiam-consentement": { finalite: "Remember your cookie choices.", duree: "6 months" },
    "react-router-scroll-positions": { finalite: "Bring you back to where you were on a page (session storage).", duree: "Until you close the tab" },
    "react-router-manifest-version": { finalite: "Reload just once after an update (session storage).", duree: "Until you close the tab" },
    cf_clearance: { finalite: "Remember that you've passed the bot check.", duree: "1 year" },
    __cf_bm: { finalite: "Tell humans and bots apart.", duree: "About 30 minutes" },
  },
};
