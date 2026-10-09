import { calculerDelaiChangementQr } from "../../../../../packages/commun/src/fonctions/qr/calculer-delai-changement-qr.ts";
import { calculerFenetreQr } from "../../../../../packages/commun/src/fonctions/qr/calculer-fenetre-qr.ts";
import { construireMessageQr } from "../../../../../packages/commun/src/fonctions/qr/construire-message-qr.ts";
import { construireTexteComptoir } from "../../../../../packages/commun/src/fonctions/qr/construire-texte-comptoir.ts";
import type { JetonComptoir } from "../../../../../packages/commun/src/types/code-scanne.ts";
import type { QrAffiche } from "../../../../../packages/commun/src/types/comptoir.ts";
import type { LignePresentation } from "../../services/visites-regles.ts";

/** Le QR du comptoir d'une présentation pour la fenêtre de 30 s en cours, signé par l'API (version « 1 »). */
export function construireQrAffiche(p: LignePresentation, maintenantMs: number, signer: (message: string) => string): QrAffiche {
  const fenetre = calculerFenetreQr(maintenantMs);
  const sansMac: Omit<JetonComptoir, "mac"> = { version: "1", lieuId: p.lieuId, presentationId: p.id, fenetre };
  return {
    texte: construireTexteComptoir({ ...sansMac, mac: signer(construireMessageQr(sansMac)) }),
    presentationId: p.id,
    fenetre,
    changeDansMs: calculerDelaiChangementQr(maintenantMs),
    personnes: p.personnes,
    restantes: p.restantes,
    finitLe: p.expireLe.toISOString(),
    reglement: p.reglement,
  };
}
