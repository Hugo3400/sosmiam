// Connexion par QR code sur le site (sosmiam.fr/mon-compte, /connexion d'ambassadeur. et de pro.) : le site affiche le QR,
// l'app SOS Miam déjà connectée le scanne et valide (services/connexion-qr.server.ts).
import type { EspaceConnexion, PageDepart } from "./connexion-externe.ts";

/** Ce que montre le bloc : « erreur » (l'API ne répond pas) et « trop » (trop de QR demandés) en plus des états de l'API */
export type EtatQrSite = "attente" | "scanne" | "accepte" | "refuse" | "expire" | "erreur" | "trop";

/** Ce que garde le cookie court du QR (2 minutes, chiffré, HttpOnly) : le secret ne quitte jamais le serveur du site */
export type AttenteQr = {
  secret: string;
  /** Le code du QR, pour le redessiner sans JavaScript (il est dans le QR, il n'a rien de secret pour qui voit l'écran) */
  code: string;
  /** Fin de validité, en millisecondes */
  expire: number;
  depart: PageDepart;
  /** Chemin sûr à ouvrir une fois connecté (null : l'accueil de l'espace) */
  retour: string | null;
  espace: EspaceConnexion;
};

/** Le QR tel que le bloc le montre (rendu par la page, ou par POST /connexion/qr) */
export type QrAffiche = { svg: string | null; expireLe: number | null; etat: EtatQrSite };
