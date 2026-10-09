import { calculerDelaiChangementQr } from "@sos-miam/commun/fonctions/qr/calculer-delai-changement-qr";
import { calculerFenetreQr } from "@sos-miam/commun/fonctions/qr/calculer-fenetre-qr";
import { construireMessageQr } from "@sos-miam/commun/fonctions/qr/construire-message-qr";
import { construireTexteComptoir } from "@sos-miam/commun/fonctions/qr/construire-texte-comptoir";
import type { QrAffiche } from "@sos-miam/commun/types/comptoir";
import type { JetonComptoir } from "@sos-miam/commun/types/code-scanne";

import { signerDemo } from "~/fonctions/demo/signer-demo";

import type { PresentationDemo } from "./types-demo";

/**
 * Le QR du comptoir d'une présentation, pour la fenêtre de 30 s en cours. Version « d » (démo), signée par signerDemo :
 * l'API le refusera net (« qr-demo »).
 */
export function construireQrDemo(p: PresentationDemo, maintenantMs: number): QrAffiche {
  const fenetre = calculerFenetreQr(maintenantMs);
  const sansMac: Omit<JetonComptoir, "mac"> = { version: "d", lieuId: p.lieuId, presentationId: p.id, fenetre };
  const texte = construireTexteComptoir({ ...sansMac, mac: signerDemo(construireMessageQr(sansMac)) });
  return {
    texte,
    presentationId: p.id,
    fenetre,
    changeDansMs: calculerDelaiChangementQr(maintenantMs),
    personnes: p.personnes,
    restantes: p.restantes,
    finitLe: p.expireLe,
    reglement: p.reglement ?? null,
  };
}
