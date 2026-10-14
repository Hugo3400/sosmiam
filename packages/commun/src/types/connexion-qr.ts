// Connexion par QR code, comme Discord (décidé le 14 octobre 2026) : le site ou un nouveau téléphone affiche un QR
// (https://sosmiam.fr/q/<code>), l'app déjà connectée le scanne et valide. Contrat : apps/api/src/routes/connexion-qr.ts.

/** « site » : une session du site ; « app » : une session de l'app (nouveau téléphone) */
export type CibleConnexionQr = "site" | "app";
/** D'où vient la demande : l'hôte du site, ou l'app (jamais une IP) */
export type OrigineConnexionQr = "sosmiam.fr" | "ambassadeur.sosmiam.fr" | "pro.sosmiam.fr" | "app";
/** Ce que voit l'appareil qui attend (« accepte » arrive avec la session, une seule fois) */
export type EtatConnexionQr = "attente" | "scanne" | "accepte" | "refuse" | "expire";

/** Un QR tout neuf : le code va dans le QR, le secret reste sur l'appareil (jamais dans le QR, jamais dans un journal) */
export type QrConnexion = { code: string; secret: string; expireLe: string };

/** Ce que l'app montre sur l'écran de confirmation, après le scan (dates ISO 8601) */
export type DemandeConnexionQr = {
  cible: CibleConnexionQr;
  /** « Chrome sur Mac », « Safari sur iPhone », « l'app SOS Miam sur Android » (60 caractères au plus) */
  appareil: string;
  origine: OrigineConnexionQr;
  creeLe: string;
  expireLe: string;
};
