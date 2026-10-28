import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_DEMANDES_COMPTOIR_ANGLAIS } from "~/contenus/anglais/textes-demandes-comptoir";

export const TEXTES_DEMANDES_COMPTOIR = {
  recompense: (recompense: string) => `Récompense : ${recompense}`,
  saRecompense: "sa récompense",
  addition: (tampons: number) => `Addition · ${tampons} tampon${tampons > 1 ? "s" : ""} ici`,
  demandeLu: (nom: string, attente: string, detail: string, code: string) => `${nom}, ${attente}. ${detail}. Code : ${code}`,
  offrir: "Offrir",
  offrirLu: (nom: string) => `Offrir la récompense de ${nom}`,
  reglee: "Réglée",
  regleeLu: (nom: string) => `Addition de ${nom} réglée`,
  refuser: "Refuser",
  refuserLu: (nom: string) => `Refuser l'addition de ${nom}`,
  attente: {
    instant: "à l'instant",
    minutes: (minutes: number) => `depuis ${minutes} min`,
    heures: (heures: number) => `depuis ${heures} h`,
    heuresMinutes: (heures: number, minutes: number) => `depuis ${heures} h ${String(minutes).padStart(2, "0")}`,
  },
  vide: "Rien en attente. Le calme avant le rush : les additions demandées dans l'app arriveront ici, avec leur code.",
  reglement: {
    titre: (nom: string) => `Addition de ${nom}`,
    codeRequis: "Plusieurs additions attendent : tape le code que te montre le client, pour ne pas te tromper de table.",
    validerOfferte: "Valider la visite offerte",
    valider: "Valider la visite",
    indiceCode: "Tape d'abord les 4 chiffres du code",
    code: "Code du client",
    codeLu: "Code du client, 4 chiffres",
    codeLuErreur: (erreur: string) => `Code du client, 4 chiffres. ${erreur}`,
  },
  refus: {
    choisirMotif: "Choisis d'abord un motif",
    rester: "Finalement non",
  },
  validees: {
    titre: "Validées à l'instant",
    modes: { addition: "addition", comptoir: "QR du comptoir", reservation: "réservation" },
    modesLu: { addition: "addition", comptoir: "QR du comptoir", reservation: "réservation" },
    moinsDUneMinute: "encore moins d'une minute",
    encoreMinutes: (minutes: number) => `encore ${minutes} min`,
    lu: (nom: string, mode: string, reglement: string, reste: string) => `${nom}, validé par ${mode}. ${reglement}. Annulable ${reste}.`,
    ligne: (mode: string, reste: string) => `${mode} · annulable ${reste}`,
    annulerLu: (nom: string) => `Annuler la validation de ${nom}`,
    annulerIndice: "Par erreur ? Les points et le tampon repartent",
    annuler: "Annuler",
  },
  reservation: {
    passageLu: (nom: string) => `Noter le passage de ${nom}`,
    absenceLu: (nom: string) => `Noter l'absence de ${nom}`,
    etiquetteValeur: (etiquette: string, valeur: string) => `${etiquette} : ${valeur}`,
  },
};

export const TEXTES_DEMANDES_COMPTOIR_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_DEMANDES_COMPTOIR>> = {
  fr: TEXTES_DEMANDES_COMPTOIR,
  en: TEXTES_DEMANDES_COMPTOIR_ANGLAIS,
};
