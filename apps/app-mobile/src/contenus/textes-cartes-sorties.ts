import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_CARTES_SORTIES_ANGLAIS } from "~/contenus/anglais/textes-cartes-sorties";

export const TEXTES_CARTES_SORTIES = {
  invitation: {
    souci: "Ça n'a pas marché cette fois. Réessaie dans un instant.",
    unPote: "Un pote",
    quelquUnParti: "Quelqu'un qui a quitté SOS Miam",
    quand: (jour: string, heure: string) => `${jour} à ${heure}`,
    dejaOui: (participants: number) => `${participants} ont déjà dit oui.`,
    personne: "Personne n'a encore répondu : à toi l'honneur !",
    noteDiscret: "C'est noté, en toute discrétion.",
    invite: (qui: string, titre: string) => `${qui} t'invite : ${titre}`,
    ouiLu: (titre: string) => `Carrément, je viens à ${titre}`,
    indiceOui: "Ouvre la sortie : tu pourras voter et discuter",
    unInstant: "Un instant…",
    oui: "Carrément !",
    nonLu: (titre: string) => `Pas cette fois, ${titre}`,
    indiceNon: "Personne n'est prévenu",
    non: "Pas cette fois",
    aide: "Dis oui pour voter et discuter avec la bande.",
  },
  carte: {
    aujourdhui: "aujourd'hui",
    demain: "demain",
    hier: "hier",
    jourDate: (jour: string, date: string) => `${jour} ${date}`,
    moment: (jour: string, heure: string) => `${jour} à ${heure}`,
    lieuRetenu: (nom: string) => `Lieu retenu : ${nom}`,
    onVaChez: (nom: string) => `On va chez ${nom.replace(/^chez\s+/i, "")}`,
    voteEnCours: (fin: string) => `Vote en cours, fin ${fin}`,
    voteTermine: "Vote terminé, aucun lieu retenu",
    cetait: (moment: string) => `C'était ${moment}`,
    toi: "toi",
    participants: (nombre: number, noms: string) => `${nombre} participant${nombre > 1 ? "s" : ""} : ${noms}`,
    organisee: (qui: string) => `Organisée par ${qui}`,
    aToiDeVoterLu: "À toi de voter",
    aToiDeVoter: "À toi de voter !",
    messages: (messages: number) => `${messages} message${messages > 1 ? "s" : ""}`,
    nonLus: (nonLus: number) => `${nonLus} message${nonLus > 1 ? "s" : ""} pas encore lu${nonLus > 1 ? "s" : ""}`,
    nouveaux: (nonLus: number) => `${nonLus > 99 ? "99+" : nonLus} nouveau${nonLus > 1 ? "x" : ""}`,
    indiceOuvrir: "Ouvre la sortie : vote, lieux proposés et discussion",
    optionsLu: (titre: string) => `Plus d'options sur la sortie ${titre}`,
    indiceRetirer: "La retirer de tes sorties",
    indiceQuitter: "La quitter",
  },
  enTete: {
    retour: "Retour",
  },
};

export const TEXTES_CARTES_SORTIES_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_CARTES_SORTIES>> = { fr: TEXTES_CARTES_SORTIES, en: TEXTES_CARTES_SORTIES_ANGLAIS };
