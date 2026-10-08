// Ce que lireCodeScanne reconnaît dans un QR : le QR du comptoir (jeton signé), le QR de vitrine d'un lieu, ou autre chose.

/** « 1 » : signé par l'API ; « d » : QR de démo, refusé net par l'API */
export type VersionJetonComptoir = "1" | "d";

export type JetonComptoir = { version: VersionJetonComptoir; lieuId: number; presentationId: number; fenetre: number; mac: string };

export type CodeScanne = { type: "comptoir"; jeton: JetonComptoir } | { type: "lieu"; codePublic: string } | { type: "autre" };
