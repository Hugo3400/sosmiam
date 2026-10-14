import { listerBoitesMp4 } from "./lister-boites-mp4.ts";

/**
 * Durée d'un MP4 ou M4A en secondes, relue dans la boîte moov/mvhd (versions 0 et 1 : duration / timescale). La durée
 * annoncée par l'app ne compte jamais : c'est celle-ci. null : pas de moov ni de mvhd, boîte tronquée, échelle de temps
 * nulle, ou durée inconnue (tous les bits à 1).
 */
export function lireDureeMp4(octets: Uint8Array): number | null {
  const haut = listerBoitesMp4(octets);
  const moov = haut?.find((b) => b.type === "moov");
  if (!moov) return null;
  const mvhd = listerBoitesMp4(octets, moov.contenu, moov.fin)?.find((b) => b.type === "mvhd");
  if (!mvhd) return null;
  const vue = new DataView(octets.buffer, octets.byteOffset, octets.byteLength);
  const c = mvhd.contenu;
  const version = octets[c];
  let echelle: number;
  let duree: number;
  if (version === 0) {
    if (c + 20 > mvhd.fin) return null;
    echelle = vue.getUint32(c + 12);
    duree = vue.getUint32(c + 16);
    if (duree === 0xffffffff) return null;
  } else if (version === 1) {
    if (c + 32 > mvhd.fin) return null;
    echelle = vue.getUint32(c + 20);
    const grande = vue.getBigUint64(c + 24);
    if (grande === 0xffffffffffffffffn) return null;
    duree = Number(grande);
  } else {
    return null;
  }
  return echelle > 0 ? duree / echelle : null;
}
