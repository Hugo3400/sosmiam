import type { StatutReponseLieuActus } from "@sos-miam/commun/types/actus";
import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_ACTUS_PRO_ANGLAIS } from "~/contenus/anglais/textes-actus-pro";

const REPONSES: Record<StatutReponseLieuActus, string> = {
  "en-relecture": "Ta réponse est en relecture par la Brigade.",
  publie: "Ta réponse est publiée sous l'article.",
  refuse: "Ta réponse n'a pas été publiée.",
};

export const TEXTES_ACTUS_PRO = {
  ligneTitre: "On parle de toi dans Actus",
  ligneDetail: "Les articles qui citent ton lieu, et ta réponse publique",
  titre: "On parle de toi",
  intro: "Quand un article des Actus cite ton lieu, tu le retrouves ici. Tu peux laisser une réponse publique, une seule par article.",
  par: (prenom: string, date: string) => `Par ${prenom} · publié le ${date}`,
  lire: "Lire l'article",
  repondre: "Répondre",
  reponses: REPONSES,
  motif: (motif: string) => `Motif : ${motif}.`,
  reecrire: "Écrire une nouvelle réponse",
  vide: "Aucun article ne parle encore de ton lieu. Ça viendra !",
  feuille: {
    titre: "Ta réponse publique",
    sousTitre: (nom: string) => `Signée ${nom}, sous l'article.`,
    champ: "Ta réponse",
    placeholder: "Un merci, une précision, une invitation…",
    compteur: (n: number, max: number) => `${n} / ${max}`,
    regle: "Relue par la Brigade avant d'apparaître. On remercie, on précise, on invite : jamais de promo d'alcool, jamais un mot sur la personne qui a écrit.",
    envoyer: "Envoyer ma réponse",
    pasMaintenant: "Pas maintenant",
  },
  envoyee: "Réponse envoyée : la Brigade la relit avant de la publier.",
} as const;

export const TEXTES_ACTUS_PRO_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_ACTUS_PRO>> = { fr: TEXTES_ACTUS_PRO, en: TEXTES_ACTUS_PRO_ANGLAIS };
