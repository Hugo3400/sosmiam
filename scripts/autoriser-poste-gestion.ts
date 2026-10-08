// Autorise un ordinateur à utiliser le logiciel de gestion de SOS Miam, et prépare le code à 6 chiffres.
// À lancer par Hugo lui-même, en root, dans un terminal du serveur (pas à travers une session Claude : le secret du code
// s'affiche à l'écran et ne doit être vu que par lui).
//
//   npm run gestion:autoriser -- <clé publique> ["Nom du poste"]   ajoute un poste (la clé est affichée par le logiciel)
//   npm run gestion:autoriser -- --liste                           liste les postes autorisés
//   npm run gestion:autoriser -- --retirer <identifiant>           retire un poste (coupé aussitôt)
//   npm run gestion:autoriser -- --nouveau-code                    change le secret du code (l'ancien ne marche plus)
//
// Fichier : /root/sos-miam-secrets/gestion.json (ou FICHIER_GESTION), lisible par root seul. L'API le relit dès qu'il change.
import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import { calculerIdPoste } from "../apps/api/src/fonctions/securite/calculer-id-poste.ts";
import { encoderBase32 } from "../apps/api/src/fonctions/securite/encoder-base32.ts";

type Poste = { id: string; nom: string; clePublique: string; ajouteLe: string };
type Fichier = { postes: Poste[]; totp?: { secret: string; creeLe: string } };

const CHEMIN = process.env.FICHIER_GESTION || "/root/sos-miam-secrets/gestion.json";

function lire(): Fichier {
  if (!existsSync(CHEMIN)) return { postes: [] };
  return JSON.parse(readFileSync(CHEMIN, "utf8")) as Fichier;
}

function ecrire(fichier: Fichier) {
  mkdirSync(dirname(CHEMIN), { recursive: true, mode: 0o700 });
  const temporaire = `${CHEMIN}.${process.pid}.tmp`;
  writeFileSync(temporaire, `${JSON.stringify(fichier, null, 2)}\n`, { mode: 0o600 });
  renameSync(temporaire, CHEMIN); // remplacement d'un coup : l'API ne lit jamais un fichier à moitié écrit
}

function afficherCode(secret: string) {
  const groupes = secret.match(/.{1,4}/g)?.join(" ") ?? secret;
  const lien = `otpauth://totp/SOS%20Miam:Gestion?secret=${secret}&issuer=SOS%20Miam&algorithm=SHA1&digits=6&period=30`;
  console.log(`
Ajoute ce compte dans ton application d'authentification (Google Authenticator, Microsoft Authenticator, Aegis…) :
  « Ajouter un compte » → « Saisir une clé de configuration »
  Nom du compte : SOS Miam Gestion
  Clé           : ${groupes}
  Type          : basé sur le temps (6 chiffres, 30 secondes)

Ou, si ton gestionnaire de mots de passe sait lire ce lien : ${lien}

Ne copie cette clé nulle part ailleurs : avec elle, on peut fabriquer tes codes.`);
}

const [premier, second] = process.argv.slice(2);
const fichier = lire();

if (!premier) {
  console.error("Usage : npm run gestion:autoriser -- <clé publique> [\"Nom du poste\"] | --liste | --retirer <id> | --nouveau-code");
  process.exit(1);
} else if (premier === "--liste") {
  if (fichier.postes.length === 0) console.log("Aucun poste autorisé.");
  for (const poste of fichier.postes) console.log(`${poste.id}  ${poste.nom}  (ajouté le ${poste.ajouteLe})`);
  console.log(fichier.totp ? `Code à 6 chiffres : en place depuis le ${fichier.totp.creeLe}.` : "Code à 6 chiffres : pas encore créé.");
} else if (premier === "--retirer") {
  const avant = fichier.postes.length;
  fichier.postes = fichier.postes.filter((poste) => poste.id !== second);
  if (fichier.postes.length === avant) {
    console.error(`Aucun poste « ${second} ». Liste : npm run gestion:autoriser -- --liste`);
    process.exit(1);
  }
  ecrire(fichier);
  console.log(`Poste ${second} retiré : il est coupé dès maintenant.`);
} else if (premier === "--nouveau-code") {
  fichier.totp = { secret: encoderBase32(randomBytes(20)), creeLe: new Date().toISOString().slice(0, 10) };
  ecrire(fichier);
  console.log("Nouveau secret créé : l'ancien code ne marche plus. Supprime l'ancien compte de ton application.");
  afficherCode(fichier.totp.secret);
} else {
  const cle = Buffer.from(premier.trim(), "base64url");
  if (cle.length !== 32 || cle.toString("base64url") !== premier.trim()) {
    console.error("Cette clé publique n'a pas la bonne forme : copie-la telle quelle depuis le logiciel (bouton « Copier »).");
    process.exit(1);
  }
  const id = calculerIdPoste(cle);
  const nom = (second ?? "PC de Hugo").trim().slice(0, 40) || "PC de Hugo";
  fichier.postes = [...fichier.postes.filter((poste) => poste.id !== id), { id, nom, clePublique: cle.toString("base64url"), ajouteLe: new Date().toISOString().slice(0, 10) }];
  const nouveauCode = !fichier.totp;
  if (nouveauCode) fichier.totp = { secret: encoderBase32(randomBytes(20)), creeLe: new Date().toISOString().slice(0, 10) };
  ecrire(fichier);
  console.log(`Poste autorisé : « ${nom} » (identifiant ${id}). Vérifie que le logiciel affiche le même identifiant.`);
  if (nouveauCode && fichier.totp) afficherCode(fichier.totp.secret);
  else console.log("Le code à 6 chiffres reste le même qu'avant (--nouveau-code pour le changer).");
}
