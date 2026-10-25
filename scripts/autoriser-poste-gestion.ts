// Autorise un ordinateur à utiliser le logiciel de gestion de SOS Miam, et prépare le code à 6 chiffres.
// À lancer par Hugo lui-même, en root, dans un terminal du serveur (pas à travers une session Claude : le secret du code
// s'affiche à l'écran et ne doit être vu que par lui).
//
//   npm run gestion:autoriser -- <clé publique> ["Nom du poste"]   ajoute un poste (la clé est affichée par le logiciel)
//   npm run gestion:autoriser -- --liste                           liste les postes autorisés
//   npm run gestion:autoriser -- --retirer <identifiant>           retire un poste (coupé aussitôt)
//   npm run gestion:autoriser -- --nouveau-code                    change le secret du code (l'ancien ne marche plus)
//   npm run gestion:autoriser -- --distance                        ouvre (ou change) l'ajout de PC depuis n'importe où
//   npm run gestion:autoriser -- --fermer-distance                 ferme l'ajout de PC à distance
//
// Fichier : /root/sos-miam-secrets/gestion.json (ou FICHIER_GESTION), lisible par root seul. L'API le relit dès qu'il change.
import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { createInterface } from "node:readline/promises";
import { Writable } from "node:stream";

import { calculerIdPoste } from "../apps/api/src/fonctions/securite/calculer-id-poste.ts";
import { encoderBase32 } from "../apps/api/src/fonctions/securite/encoder-base32.ts";
import { hacherMotDePasse } from "../apps/api/src/fonctions/securite/hacher-mot-de-passe.ts";
import { creerRegistrePostesDistance } from "../apps/api/src/services/gestion/postes-distance.ts";

type Poste = { id: string; nom: string; clePublique: string; ajouteLe: string };
type Fichier = { postes: Poste[]; totp?: { secret: string; creeLe: string }; distance?: { motDePasse: string; courriel: string | null; creeLe: string } };

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

const registreDistance = creerRegistrePostesDistance();

function lireDistance() {
  const distance = registreDistance.lire();
  if (!distance) {
    console.error("Le fichier des PC ajoutés à distance est illisible ou lisible par d'autres : corrige-le (chmod 600) avant de continuer.");
    process.exit(1);
  }
  return distance;
}

function ouvrirLecture() {
  let muet = false;
  const sortie = new Writable({
    write(morceau, _encodage, suite) {
      if (!muet) process.stdout.write(morceau);
      suite();
    },
  });
  const lecture = createInterface({ input: process.stdin, output: sortie, terminal: process.stdin.isTTY });
  return {
    async demander(question: string, cache = false): Promise<string> {
      muet = false;
      const reponse = lecture.question(question);
      muet = cache;
      const texte = await reponse;
      if (cache) process.stdout.write("\n");
      return texte;
    },
    fermer: () => lecture.close(),
  };
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
  console.error("Usage : npm run gestion:autoriser -- <clé publique> [\"Nom du poste\"] | --liste | --retirer <id> | --nouveau-code | --distance | --fermer-distance");
  process.exit(1);
} else if (premier === "--liste") {
  const distance = lireDistance();
  const coupes = new Set(distance.coupes);
  const maintenant = Date.now();
  const actifs = distance.postes.filter((poste) => poste.expireLe === null || Date.parse(poste.expireLe) > maintenant);
  if (fichier.postes.length + actifs.length === 0) console.log("Aucun poste autorisé.");
  for (const poste of fichier.postes) console.log(`${poste.id}  ${poste.nom}  (ajouté le ${poste.ajouteLe}${coupes.has(poste.id) ? ", COUPÉ depuis le logiciel" : ""})`);
  for (const poste of actifs) console.log(`${poste.id}  ${poste.nom}  (ajouté à distance le ${poste.ajouteLe.slice(0, 16).replace("T", " à ")}, ${poste.expireLe ? `jusqu'au ${new Date(poste.expireLe).toLocaleString("fr-FR", { timeZone: "Europe/Paris" })}` : "sans fin"})`);
  console.log(fichier.totp ? `Code à 6 chiffres : en place depuis le ${fichier.totp.creeLe}.` : "Code à 6 chiffres : pas encore créé.");
  console.log(fichier.distance ? `Ajout de PC à distance : ouvert depuis le ${fichier.distance.creeLe}${fichier.distance.courriel ? `, alertes à ${fichier.distance.courriel}` : ", sans mail d'alerte"}.` : "Ajout de PC à distance : fermé (--distance pour l'ouvrir).");
} else if (premier === "--retirer") {
  const distance = lireDistance();
  const avant = fichier.postes.length + distance.postes.length;
  fichier.postes = fichier.postes.filter((poste) => poste.id !== second);
  const postesDistance = distance.postes.filter((poste) => poste.id !== second);
  if (!second || fichier.postes.length + postesDistance.length === avant) {
    console.error(`Aucun poste « ${second} ». Liste : npm run gestion:autoriser -- --liste`);
    process.exit(1);
  }
  ecrire(fichier);
  if (postesDistance.length !== distance.postes.length) registreDistance.ecrire({ postes: postesDistance, coupes: [...new Set([...distance.coupes, second])] });
  console.log(`Poste ${second} retiré : il est coupé dès maintenant.`);
} else if (premier === "--distance") {
  if (!fichier.totp) {
    console.error("Autorise d'abord un premier PC : c'est lui qui crée le code à 6 chiffres, indispensable pour l'accès à distance.");
    process.exit(1);
  }
  console.log(`
Avec ce mot de passe et ton code à 6 chiffres, tu pourras autoriser n'importe quel PC Windows depuis le logiciel lui-même,
sans passer par le serveur. Choisis-le long (une petite phrase) et différent de tes autres mots de passe :
range-le dans ton gestionnaire de mots de passe.
`);
  const lecture = ouvrirLecture();
  const motDePasse = await lecture.demander("Mot de passe de gestion (12 caractères au moins) : ", true);
  const confirmation = motDePasse.length < 12 ? "" : await lecture.demander("Le même, encore une fois : ", true);
  const actuel = fichier.distance?.courriel ?? null;
  const saisi = motDePasse.length < 12 || confirmation !== motDePasse ? "" : (await lecture.demander(`Adresse qui reçoit un mail à chaque nouveau PC${actuel ? ` [Entrée : ${actuel}]` : ""} : `)).trim();
  lecture.fermer();
  if (motDePasse.length < 12) {
    console.error("Trop court : 12 caractères au moins. Rien n'a changé.");
    process.exit(1);
  }
  if (confirmation !== motDePasse) {
    console.error("Les deux ne sont pas pareils. Rien n'a changé.");
    process.exit(1);
  }
  const courriel = saisi || actuel;
  if (!courriel || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(courriel)) {
    console.error("Il faut une adresse mail valable : c'est elle qui te prévient si quelqu'un d'autre ajoute un PC. Rien n'a changé.");
    process.exit(1);
  }
  fichier.distance = { motDePasse: await hacherMotDePasse(motDePasse), courriel, creeLe: new Date().toISOString().slice(0, 10) };
  ecrire(fichier);
  console.log(`Ajout de PC à distance ouvert : un mail part vers ${courriel} à chaque nouveau PC. Les PC déjà autorisés ne changent pas.`);
} else if (premier === "--fermer-distance") {
  delete fichier.distance;
  ecrire(fichier);
  console.log("Ajout de PC à distance fermé. Les PC déjà ajoutés à distance restent autorisés jusqu'à leur fin : --liste pour les voir, --retirer pour les couper.");
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
  const distance = lireDistance();
  if (distance.coupes.includes(id)) registreDistance.ecrire({ ...distance, coupes: distance.coupes.filter((coupe) => coupe !== id) });
  const nom = (second ?? "PC de Hugo").trim().slice(0, 40) || "PC de Hugo";
  fichier.postes = [...fichier.postes.filter((poste) => poste.id !== id), { id, nom, clePublique: cle.toString("base64url"), ajouteLe: new Date().toISOString().slice(0, 10) }];
  const nouveauCode = !fichier.totp;
  if (nouveauCode) fichier.totp = { secret: encoderBase32(randomBytes(20)), creeLe: new Date().toISOString().slice(0, 10) };
  ecrire(fichier);
  console.log(`Poste autorisé : « ${nom} » (identifiant ${id}). Vérifie que le logiciel affiche le même identifiant.`);
  if (nouveauCode && fichier.totp) afficherCode(fichier.totp.secret);
  else console.log("Le code à 6 chiffres reste le même qu'avant (--nouveau-code pour le changer).");
}
