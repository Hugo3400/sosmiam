import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_PROPOSER_LIEU_ANGLAIS } from "~/contenus/anglais/textes-proposer-lieu";

export const TEXTES_PROPOSER_LIEU = {
  titre: "Proposer une modification",
  merci: "Merci, c'est envoyé !",
  merciTexte: (nom: string) => `L'équipe relit ta proposition avant de changer la fiche de ${nom}. Grâce à toi, les gourmands auront les bonnes infos 💛`,
  intro: "Tu as vu quelque chose qui a changé ? Dis-le-nous : l'équipe vérifie avant de mettre la fiche à jour.",
  quoi: "Qu'est-ce qui a changé ?",
  horaires: "Les horaires",
  exempleHoraires: "12h–14h30 · 19h–22h30 · fermé lundi",
  adresse: "La nouvelle adresse",
  exempleAdresse: "12 rue de la Loge, Montpellier",
  nom: "Le nom",
  presentation: "La présentation",
  motEquipe: "Un mot pour l'équipe",
  exempleMot: "J'y étais hier : ils sont fermés le lundi maintenant",
  envoi: "Envoi…",
  envoyer: "Envoyer ma proposition",
  cocherDAbord: "Coche d'abord ce qui a changé",
  erreurs: {
    nom: "Un nom de 80 caractères au plus, sans gros mot.",
    adresse: "Une adresse de 160 caractères au plus, sans gros mot.",
    horaires: "Des horaires de 160 caractères au plus, sans gros mot.",
    texte: "Une présentation de 1 000 caractères au plus, sans gros mot.",
    message: "Un mot de 1 000 caractères au plus, sans gros mot.",
    vide: "Change au moins une info : pour l'instant, tout est pareil que sur la fiche.",
  },
};

export const TEXTES_PROPOSER_LIEU_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_PROPOSER_LIEU>> = { fr: TEXTES_PROPOSER_LIEU, en: TEXTES_PROPOSER_LIEU_ANGLAIS };
