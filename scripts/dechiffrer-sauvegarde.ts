// Déchiffre une sauvegarde de la base (fichier .sauvegarde, voir apps/api/src/services/gestion/sauvegardes.ts) en un
// fichier pg_dump ordinaire, à restaurer ensuite avec pg_restore. Ne touche jamais à la base elle-même.
//
//   npm run sauvegardes:dechiffrer -- <fichier.sauvegarde> [fichier.dump]
//
// Clé : /root/sos-miam-secrets/cle-sauvegardes (ou FICHIER_CLE_SAUVEGARDES). Sur une autre machine (serveur perdu),
// la donner par la variable CLE_SAUVEGARDES, recopiée depuis le gestionnaire de mots de passe.
// Restaurer ensuite (exemple, dans une base vide) : pg_restore --no-owner --dbname=<base> fichier.dump
import { createDecipheriv } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

const ENTETE = "SOSMIAM-SAUVEGARDE-1\n";
const [source, destination = source?.replace(/\.sauvegarde$/, "") + ".dump"] = process.argv.slice(2);
if (!source) {
  console.error("Usage : npm run sauvegardes:dechiffrer -- <fichier.sauvegarde> [fichier.dump]");
  process.exit(1);
}
const texteCle = process.env.CLE_SAUVEGARDES || readFileSync(process.env.FICHIER_CLE_SAUVEGARDES || "/root/sos-miam-secrets/cle-sauvegardes", "utf8");
const cle = Buffer.from(texteCle.trim(), "base64url");
const contenu = readFileSync(source);
if (cle.length !== 32 || contenu.subarray(0, ENTETE.length).toString() !== ENTETE) {
  console.error("Clé ou fichier invalide (ce n'est pas une sauvegarde SOS Miam, ou la clé n'a pas la bonne forme).");
  process.exit(1);
}
const iv = contenu.subarray(ENTETE.length, ENTETE.length + 12);
const etiquette = contenu.subarray(contenu.length - 16);
const dechiffrement = createDecipheriv("aes-256-gcm", cle, iv);
dechiffrement.setAuthTag(etiquette);
try {
  const clair = Buffer.concat([dechiffrement.update(contenu.subarray(ENTETE.length + 12, contenu.length - 16)), dechiffrement.final()]);
  writeFileSync(destination, clair, { mode: 0o600 });
  console.log(`Sauvegarde déchiffrée et vérifiée : ${destination} (${clair.length} octets). Restaurer avec pg_restore.`);
} catch {
  console.error("Déchiffrement impossible : mauvaise clé, ou fichier abîmé (il a été modifié ou tronqué).");
  process.exit(1);
}
