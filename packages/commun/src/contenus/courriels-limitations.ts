import type { ParLangue, Traduction } from "../types/traduction.ts";
import { TEXTES_COURRIELS_LIMITATIONS_ANGLAIS } from "./anglais/courriels-limitations.ts";
import { DETAILS_MOTIFS_MODERATION, MOTIFS_MODERATION, type MotifModeration } from "./motifs-moderation.ts";

export const TEXTES_COURRIELS_LIMITATIONS = {
  pied: "Tu reçois ce mail parce que l'équipe SOS Miam a pris une décision sur ton compte. Une question ? Réponds simplement à ce mail.",
  ceQuiChange:
    "Tant qu'elle dure, tu ne peux plus rien publier que les autres voient (messages, commentaires, avis, sorties, listes, invitations, nouveau pseudo ou avatar). Lire, valider tes visites, Miam Safe, signaler, bloquer, tes réglages, l'export de tes données et la suppression de ton compte marchent comme d'habitude.",
  motifs: Object.fromEntries(MOTIFS_MODERATION.map((motif) => [motif, DETAILS_MOTIFS_MODERATION[motif].enClair])) as Record<MotifModeration, string>,
  regleParDefaut: "une règle de la communauté",
  jusquAu: (date: string) => `jusqu'au ${date}`,
  jusquANouvelOrdre: "jusqu'à nouvel ordre",
  motEquipe: (message: string) => `Le mot de l'équipe : « ${message} »`,
  boutonMonCompte: "Ouvrir Mon compte",
  limite: {
    objetAVenir: "Ton compte SOS Miam va être limité",
    objet: "Ton compte SOS Miam est limité",
    titre: (prenom: string) => `${prenom}, ton compte est limité`,
    aVenir: (debut: string, fin: string) => `L'équipe SOS Miam va limiter ton compte à partir du ${debut}, ${fin}.`,
    deja: (fin: string) => `L'équipe SOS Miam a limité ton compte ${fin}.`,
    regle: (regle: string) => `La règle en cause : ${regle}.`,
    explication: (motivation: string) => `Ce que l'équipe t'explique : « ${motivation} »`,
    contester: "Pas d'accord ? Dis-nous pourquoi depuis « Mon compte » (une seule fois, tant que la limitation dure) : quelqu'un d'autre dans l'équipe relit tout et te répond.",
  },
  levee: {
    objet: "Ton compte SOS Miam n'est plus limité",
    titre: (prenom: string) => `C'est levé, ${prenom}`,
    apresReexamen: "On a relu ta contestation, et tu avais raison : la limitation de ton compte est levée.",
    parEquipe: "L'équipe SOS Miam a levé la limitation de ton compte.",
    fin: "Tout remarche comme avant. Merci de ta patience, et à bientôt dans les bons coins !",
  },
  maintenue: {
    objet: "On a relu ta contestation",
    titre: (prenom: string) => `On a relu ta contestation, ${prenom}`,
    relue: (fin: string) => `Une autre personne de l'équipe a tout relu : la limitation de ton compte est maintenue, ${fin}.`,
    regle: (regle: string) => `La règle en cause reste : ${regle}.`,
    possible: "Tu peux toujours lire, valider tes visites, exporter tes données ou supprimer ton compte depuis « Mon compte ».",
  },
};

export const TEXTES_COURRIELS_LIMITATIONS_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_COURRIELS_LIMITATIONS>> = {
  fr: TEXTES_COURRIELS_LIMITATIONS,
  en: TEXTES_COURRIELS_LIMITATIONS_ANGLAIS,
};
