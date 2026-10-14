import { listerBoitesMp4, type BoiteMp4 } from "./lister-boites-mp4.ts";

/** La boîte de ce type parmi les enfants de `parent` (première trouvée), ou null */
function trouver(octets: Uint8Array, parent: BoiteMp4 | null | undefined, type: string): BoiteMp4 | null {
  if (!parent) return null;
  return listerBoitesMp4(octets, parent.contenu, parent.fin)?.find((b) => b.type === type) ?? null;
}

/** Quatre caractères à cette place, s'ils tiennent dans la boîte */
function lireCode(octets: Uint8Array, place: number, fin: number): string | null {
  return place + 4 <= fin ? String.fromCharCode(octets[place], octets[place + 1], octets[place + 2], octets[place + 3]) : null;
}

/**
 * Une note vocale acceptable (spécification sociale B.8, D.4) : un MP4 ou M4A (boîte ftyp en tête) avec exactement UNE piste
 * (une seule boîte trak dans moov), une piste son (hdlr « soun ») encodée en AAC (première entrée de stsd « mp4a ») ; donc
 * aucune piste vidéo. Une vidéo envoyée comme vocal répond « format ». Les tailles et la durée sont vérifiées ailleurs.
 */
export function verifierVocalMp4(octets: Uint8Array): "ok" | "format" {
  const haut = listerBoitesMp4(octets);
  if (!haut || haut[0]?.type !== "ftyp") return "format";
  const moovs = haut.filter((b) => b.type === "moov");
  if (moovs.length !== 1) return "format";
  const pistes = listerBoitesMp4(octets, moovs[0].contenu, moovs[0].fin)?.filter((b) => b.type === "trak");
  if (!pistes || pistes.length !== 1) return "format";
  const mdia = trouver(octets, pistes[0], "mdia");
  // hdlr : version et drapeaux (4 octets), pre_defined (4), puis le type de piste
  const hdlr = trouver(octets, mdia, "hdlr");
  if (!hdlr || lireCode(octets, hdlr.contenu + 8, hdlr.fin) !== "soun") return "format";
  // stsd : version et drapeaux (4), nombre d'entrées (4), puis la première entrée (taille sur 4, format sur 4)
  const stsd = trouver(octets, trouver(octets, trouver(octets, mdia, "minf"), "stbl"), "stsd");
  if (!stsd || stsd.contenu + 16 > stsd.fin) return "format";
  const entrees = new DataView(octets.buffer, octets.byteOffset, octets.byteLength).getUint32(stsd.contenu + 4);
  if (entrees < 1 || lireCode(octets, stsd.contenu + 12, stsd.fin) !== "mp4a") return "format";
  return "ok";
}
