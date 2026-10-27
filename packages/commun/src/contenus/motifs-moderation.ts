// Les motifs d'un contenu retiré par la modération : les règles de la communauté, telles que les CGU les écrivent
// (apps/site-web/src/contenus/legal/cgu.ts, « Les règles de la communauté »). Une seule liste pour l'API (décision du
// logiciel de gestion, cloche « contenu-retire » avec le code en detail), le logiciel (choix du motif, message à l'auteur)
// et l'app (la cloche nomme le motif). Ajouter ou renommer un code : prévenir les trois.

import type { ParLangue } from "../types/traduction.ts";
import { DETAILS_MOTIFS_MODERATION_ANGLAIS } from "./anglais/motifs-moderation.ts";

export const MOTIFS_MODERATION = [
  "fausse-info", "pub-cachee", "arnaque", "haine", "violence", "danger", "vie-privee", "droits", "triche", "usurpation", "illegal",
] as const;

export type MotifModeration = (typeof MOTIFS_MODERATION)[number];

/**
 * Pour chaque motif : son nom dans le logiciel (libelle), la règle mot pour mot des CGU (regle, citée dans le message à
 * l'auteur), et sa forme courte dans une phrase de la cloche de l'app (enClair : « … retiré (motif : pub cachée) »).
 */
export const DETAILS_MOTIFS_MODERATION: Readonly<Record<MotifModeration, { libelle: string; regle: string; enClair: string }>> = {
  "fausse-info": { libelle: "Fausses infos", enClair: "fausse information", regle: "pas de fausses infos : un lieu inventé ou fermé, un faux SOS, des prix ou des horaires trompeurs, un avis sans visite, payé ou écrit pour nuire à un concurrent" },
  "pub-cachee": { libelle: "Pub cachée ou spam", enClair: "pub cachée", regle: "pas de pub cachée ni de spam" },
  arnaque: { libelle: "Arnaque", enClair: "arnaque", regle: "pas d'arnaques : demande d'argent ou de coordonnées bancaires, faux jeu concours, lien douteux" },
  haine: { libelle: "Haine ou harcèlement", enClair: "propos haineux", regle: "pas de haine ni de harcèlement : insultes, moqueries, discrimination, menaces" },
  violence: { libelle: "Violence, nudité ou contenu sexuel", enClair: "violence", regle: "pas de violence, de nudité ni de contenu sexuel" },
  danger: { libelle: "Mise en danger", enClair: "mise en danger", regle: "rien qui mette en danger : drogue, alcool proposé à des mineurs, défi dangereux, arme" },
  "vie-privee": { libelle: "Vie privée", enClair: "atteinte à la vie privée", regle: "rien qui porte atteinte à la vie privée : filmer ou montrer quelqu'un sans son accord, publier ses infos personnelles" },
  droits: { libelle: "Contenu des autres", enClair: "droits d'auteur", regle: "pas de contenu des autres (vidéo, photo, musique, texte) sans leur accord" },
  triche: { libelle: "Triche ou faux signalements", enClair: "triche", regle: "pas de triche, ni de signalements exprès de publications qui respectent les règles" },
  usurpation: { libelle: "Usurpation", enClair: "usurpation d'identité", regle: "ne pas se faire passer pour quelqu'un d'autre, ou pour un lieu qu'on ne représente pas" },
  illegal: { libelle: "Contenu illégal", enClair: "contenu illégal", regle: "rien d'illégal" },
};

export const DETAILS_MOTIFS_MODERATION_PAR_LANGUE: ParLangue<typeof DETAILS_MOTIFS_MODERATION> = {
  fr: DETAILS_MOTIFS_MODERATION,
  en: DETAILS_MOTIFS_MODERATION_ANGLAIS,
};
