// Affiche la clé de restauration des sauvegardes de la base, à noter dans un gestionnaire de mots de passe :
// sans elle, aucune sauvegarde ne se relit. À lancer par Hugo lui-même dans un terminal du serveur (pas à travers
// une session Claude) : npm run sauvegardes:cle
import { readFileSync } from "node:fs";

const chemin = process.env.FICHIER_CLE_SAUVEGARDES || "/root/sos-miam-secrets/cle-sauvegardes";
try {
  const cle = readFileSync(chemin, "utf8").trim();
  console.log(`Clé de restauration des sauvegardes SOS Miam :\n\n  ${cle}\n\nNote-la dans ton gestionnaire de mots de passe (pas dans un fichier du serveur, ni dans un chat).`);
} catch {
  console.error(`Pas encore de clé (${chemin}) : elle est créée à la première sauvegarde (bouton « Sauvegarder maintenant » du logiciel).`);
  process.exit(1);
}
