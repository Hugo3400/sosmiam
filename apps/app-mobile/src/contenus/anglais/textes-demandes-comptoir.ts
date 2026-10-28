import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { TEXTES_DEMANDES_COMPTOIR } from "~/contenus/textes-demandes-comptoir";

export const TEXTES_DEMANDES_COMPTOIR_ANGLAIS: Traduction<typeof TEXTES_DEMANDES_COMPTOIR> = {
  recompense: (recompense: string) => `Reward: ${recompense}`,
  saRecompense: "their reward",
  addition: (tampons: number) => `Bill · ${tampons} stamp${tampons === 1 ? "" : "s"} here`,
  demandeLu: (nom: string, attente: string, detail: string, code: string) => `${nom}, ${attente}. ${detail}. Code: ${code}`,
  offrir: "Hand over",
  offrirLu: (nom: string) => `Hand ${nom} their reward`,
  reglee: "Paid",
  regleeLu: (nom: string) => `Mark ${nom}'s bill as paid`,
  refuser: "Decline",
  refuserLu: (nom: string) => `Decline ${nom}'s bill`,
  attente: {
    instant: "just now",
    minutes: (minutes: number) => `waiting ${minutes} min`,
    heures: (heures: number) => `waiting ${heures} hr`,
    heuresMinutes: (heures: number, minutes: number) => `waiting ${heures} hr ${minutes} min`,
  },
  vide: "Nothing waiting. The calm before the rush: bills requested in the app will land here, with their code.",
  reglement: {
    titre: (nom: string) => `${nom}'s bill`,
    codeRequis: "Several bills are waiting: type in the code the customer shows you, so you don't mix up the tables.",
    validerOfferte: "Confirm gifted visit",
    valider: "Confirm the visit",
    indiceCode: "Type in the 4-digit code first",
    code: "Customer's code",
    codeLu: "Customer's code, 4 digits",
    codeLuErreur: (erreur: string) => `Customer's code, 4 digits. ${erreur}`,
  },
  refus: {
    choisirMotif: "Pick a reason first",
    rester: "Actually, no",
  },
  validees: {
    titre: "Just confirmed",
    modes: { addition: "bill", comptoir: "counter QR code", reservation: "booking" },
    modesLu: { addition: "the bill", comptoir: "the counter QR code", reservation: "a booking" },
    moinsDUneMinute: "for less than a minute",
    encoreMinutes: (minutes: number) => `for ${minutes} more min`,
    lu: (nom: string, mode: string, reglement: string, reste: string) => `${nom}, confirmed via ${mode}. ${reglement}. You can undo it ${reste}.`,
    ligne: (mode: string, reste: string) => `${mode} · can be undone ${reste}`,
    annulerLu: (nom: string) => `Undo ${nom}'s confirmation`,
    annulerIndice: "By mistake? The points and the stamp are taken back",
    annuler: "Undo",
  },
  reservation: {
    passageLu: (nom: string) => `Mark ${nom} as arrived`,
    absenceLu: (nom: string) => `Mark ${nom} as a no-show`,
    etiquetteValeur: (etiquette: string, valeur: string) => `${etiquette}: ${valeur}`,
  },
};
