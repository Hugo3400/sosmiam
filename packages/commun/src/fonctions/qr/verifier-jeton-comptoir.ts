import type { JetonComptoir } from "../../types/code-scanne.ts";
import { FENETRES_QR_ACCEPTEES } from "../../regles/visites.ts";
import { calculerFenetreQr } from "./calculer-fenetre-qr.ts";
import { comparerEnTempsConstant } from "./comparer-en-temps-constant.ts";
import { construireMessageQr } from "./construire-message-qr.ts";

/**
 * Vérifie un jeton du comptoir : sa fenêtre doit être celle en cours ou la précédente (plus ancienne : « qr-expire »,
 * dans le futur : « qr-invalide »), puis sa signature, comparée en temps constant. La signature est calculée par
 * l'appelant (HMAC de l'API, ou signature de démo) : commun ne contient aucun secret.
 * Ne regarde ni la présentation ni le nombre de scans : c'est au serveur de le faire ensuite.
 */
export async function verifierJetonComptoir(
  j: JetonComptoir,
  o: { maintenantMs: number; calculerMac: (message: string) => Promise<string> | string },
): Promise<{ ok: true } | { ok: false; erreur: "qr-expire" | "qr-invalide" }> {
  const fenetreEnCours = calculerFenetreQr(o.maintenantMs);
  if (!Number.isSafeInteger(j.fenetre) || j.fenetre > fenetreEnCours) return { ok: false, erreur: "qr-invalide" };
  if (j.fenetre <= fenetreEnCours - FENETRES_QR_ACCEPTEES) return { ok: false, erreur: "qr-expire" };

  const attendu = await o.calculerMac(
    construireMessageQr({ version: j.version, lieuId: j.lieuId, presentationId: j.presentationId, fenetre: j.fenetre }),
  );
  return comparerEnTempsConstant(j.mac, attendu) ? { ok: true } : { ok: false, erreur: "qr-invalide" };
}
