import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_CONTESTATION_ANGLAIS } from "~/contenus/anglais/textes-contestation";

export const TEXTES_CONTESTATION = {
  nombre: (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " "),
  tropCourtTitre: "Encore un petit effort",
  tropCourt: (min: number) => `Au moins ${min} caractères, pour qu'on comprenne ce qui cloche.`,
  tropLongTitre: "Un peu long",
  tropLong: (max: string) => `${max} caractères au plus : resserre un peu, on lit tout.`,
  envoiEnCours: "Envoi en cours",
  onEnvoie: "On envoie…",
  reessayer: "Réessayer",
  envoyer: "Envoyer ma contestation",
  indiceTropCourt: (min: number) => `Écris d'abord au moins ${min} caractères`,
  indiceDecision: "Une autre personne de l'équipe réexamine la décision",
  indiceLimitation: "Une autre personne de l'équipe relit la limitation",
  rienEnvoye: "Rien n'est envoyé",
  finalementNon: "Finalement non",
  fermer: "Fermer",
  titreEnvoye: "C'est envoyé 📮",
  titre: "Tu n'es pas d'accord ?",
  sousTitreDecision: "Explique-nous pourquoi, on réexamine. Tu as 6 mois.",
  sousTitreLimitation: "Explique-nous pourquoi : une autre personne de l'équipe relit tout. Une seule contestation par limitation.",
  envoyeeDecision: "Contestation envoyée : une autre personne de l'équipe réexamine.",
  suiteDecision: "Tu retrouveras sa décision ici. Merci d'avoir pris le temps de nous écrire.",
  envoyeeLimitation: "Contestation envoyée : une autre personne de l'équipe la relit.",
  suiteLimitation: "Tu retrouveras sa réponse ici. Merci d'avoir pris le temps de nous écrire.",
  pourquoi: "Pourquoi ?",
  mention: (min: number, max: string) => `${min} à ${max} caractères`,
  placeholderDecision: "Ce que l'équipe n'a peut-être pas vu, le contexte, ce qui te paraît injuste…",
  placeholderLimitation: "Ce qui s'est passé, le contexte, ce qui nous a peut-être échappé…",
  aide: (longueur: number, max: string) => `${longueur}/${max} · Seule l'équipe SOS Miam lit ta contestation.`,
};

export const TEXTES_CONTESTATION_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_CONTESTATION>> = { fr: TEXTES_CONTESTATION, en: TEXTES_CONTESTATION_ANGLAIS };
