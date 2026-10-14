/** Une boîte d'un fichier MP4 (ISO BMFF) : son type (4 caractères, « ©xyz » compris), où elle commence, où commence son
 *  contenu (après l'en-tête de 8 ou 16 octets) et où elle finit */
export type BoiteMp4 = { type: string; debut: number; contenu: number; fin: number };

/**
 * Les boîtes d'un même niveau, de `debut` à `fin` (tout le fichier par défaut, ou le contenu d'une boîte conteneur) :
 * taille sur 4 octets, 1 pour une taille sur 8 octets (largesize), 0 pour « jusqu'à la fin ». null si une boîte est mal
 * formée ou déborde de son niveau : le fichier est alors refusé, jamais lu à moitié.
 */
export function listerBoitesMp4(octets: Uint8Array, debut = 0, fin = octets.length): BoiteMp4[] | null {
  const vue = new DataView(octets.buffer, octets.byteOffset, octets.byteLength);
  const boites: BoiteMp4[] = [];
  let i = debut;
  while (i < fin) {
    if (fin - i < 8) return null;
    let taille = vue.getUint32(i);
    let entete = 8;
    if (taille === 1) {
      if (fin - i < 16) return null;
      const grande = vue.getBigUint64(i + 8);
      if (grande > BigInt(fin - i)) return null;
      taille = Number(grande);
      entete = 16;
    } else if (taille === 0) {
      taille = fin - i;
    }
    if (taille < entete || taille > fin - i) return null;
    boites.push({ type: String.fromCharCode(octets[i + 4], octets[i + 5], octets[i + 6], octets[i + 7]), debut: i, contenu: i + entete, fin: i + taille });
    i += taille;
  }
  return boites;
}
