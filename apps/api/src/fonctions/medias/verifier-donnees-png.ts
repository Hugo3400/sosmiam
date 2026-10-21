import { createInflate } from "node:zlib";

import type { PassePng } from "./retirer-metadonnees-png.ts";

export function verifierDonneesPng(donnees: Uint8Array, passes: readonly PassePng[]): Promise<boolean> {
  const restantes = passes.filter((p) => p.lignes > 0).map((p) => ({ ...p }));
  const attendu = restantes.reduce((total, p) => total + p.lignes * (1 + p.octetsParLigne), 0);
  return new Promise((repondre) => {
    const inflate = createInflate();
    let recu = 0;
    let prochainFiltre = 0;
    let fini = false;
    const conclure = (ok: boolean) => {
      if (fini) return;
      fini = true;
      if (!ok) inflate.destroy();
      repondre(ok);
    };
    inflate.on("data", (morceau: Buffer) => {
      if (fini) return;
      const debut = recu;
      recu += morceau.length;
      if (recu > attendu) return conclure(false);
      while (restantes.length > 0 && prochainFiltre < recu) {
        if (morceau[prochainFiltre - debut]! > 4) return conclure(false);
        const passe = restantes[0]!;
        prochainFiltre += 1 + passe.octetsParLigne;
        passe.lignes -= 1;
        if (passe.lignes === 0) restantes.shift();
      }
    });
    inflate.on("error", () => conclure(false));
    inflate.on("end", () => conclure(recu === attendu));
    inflate.end(Buffer.from(donnees.buffer, donnees.byteOffset, donnees.byteLength));
  });
}
