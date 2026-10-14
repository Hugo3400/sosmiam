import { listerBoitesMp4 } from "./lister-boites-mp4.ts";

/** Les boîtes dont on suit le contenu pour y chercher des métadonnées */
const CONTENEURS = new Set(["moov", "trak", "mdia", "minf", "dinf", "edts"]);
/**
 * Les boîtes de métadonnées : udta (QuickTime, dont « ©xyz », la position), meta (iTunes, ilst) et uuid (XMP d'Adobe).
 * Aucune n'est nécessaire pour lire le son
 */
const METADONNEES = new Set(["udta", "meta", "uuid"]);
const FREE = [0x66, 0x72, 0x65, 0x65];

/**
 * Une note vocale sans ses métadonnées (spécification sociale B.8, D.4) : chaque boîte udta, meta et uuid (au niveau du
 * fichier, sous moov, sous chaque trak et dans ses conteneurs) devient une boîte « free » DE MÊME TAILLE, au contenu mis à
 * zéro. Rien d'autre ne bouge : les décalages des données audio (stco, co64) restent justes et le fichier se lit toujours.
 * Rend une copie ; le fichier reçu n'est pas modifié. Une boîte mal formée arrête la descente à son niveau (le fichier a
 * déjà été vérifié par verifierVocalMp4).
 */
export function neutraliserMetadonneesMp4(octets: Uint8Array): Buffer {
  const copie = Buffer.from(octets);
  const parcourir = (debut: number, fin: number, profondeur: number) => {
    for (const boite of listerBoitesMp4(copie, debut, fin) ?? []) {
      if (METADONNEES.has(boite.type)) {
        copie.set(FREE, boite.debut + 4);
        copie.fill(0, boite.contenu, boite.fin);
      } else if (CONTENEURS.has(boite.type) && profondeur < 8) {
        parcourir(boite.contenu, boite.fin, profondeur + 1);
      }
    }
  };
  parcourir(0, copie.length, 0);
  return copie;
}
