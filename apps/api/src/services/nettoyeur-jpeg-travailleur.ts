import { parentPort } from "node:worker_threads";

import { retirerMetadonneesJpeg } from "../fonctions/medias/retirer-metadonnees-jpeg.ts";

parentPort?.on("message", (octets: Uint8Array) => {
  try {
    const propre = retirerMetadonneesJpeg(Buffer.from(octets.buffer, octets.byteOffset, octets.byteLength));
    parentPort!.postMessage({ propre });
  } catch (erreur) {
    parentPort!.postMessage({ erreur: erreur instanceof Error ? erreur.message : String(erreur) });
  }
});
