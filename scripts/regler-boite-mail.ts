// Règle la boîte bonjour@sosmiam.fr pour le serveur (lecture des désinscriptions en IMAP, envoi des mails en SMTP), pas
// à pas : un mot de passe d'application solide est proposé, Hugo le colle dans le panneau de sa boîte (onglet « Mots de
// passe d'applications »), puis le script vérifie IMAP et SMTP, écrit /root/sos-miam-secrets/boite-bonjour.env (lisible
// par root seul) et envoie un mail d'essai.
// Usage : npm run boite:regler, À LANCER TOI-MÊME dans un terminal (jamais à travers Claude) : le mot de passe s'affiche.
import { execFileSync } from "node:child_process";
import { randomInt } from "node:crypto";
import { chmodSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { createInterface } from "node:readline/promises";

import { habillerCourriel } from "../apps/api/src/fonctions/courriels/habiller-courriel.ts";
import { verifierEmail } from "../apps/api/src/fonctions/texte/verifier-email.ts";
import { verifierConnexionEnvoi } from "../apps/api/src/services/courriels/expedier-courriel.ts";
import { envoyerToutDeSuite } from "../apps/api/src/services/courriels/file-courriels.ts";
import { FICHIER_BOITE_MAIL, type ReglagesEnvoi } from "../apps/api/src/services/courriels/reglages-envoi.ts";

const SERVEUR = "mail.yubox.io";
const ADRESSE = "bonjour@sosmiam.fr";
/** Sans lettres ni chiffres qui se confondent (l, 1, O, 0) : il se recopie sans erreur */
const LETTRES = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** 4 groupes de 6, séparés par des tirets : minuscules, majuscules, chiffres et tirets, ce que demandent les panneaux. */
function creerMotDePasse(): string {
  for (;;) {
    const groupes = Array.from({ length: 4 }, () => Array.from({ length: 6 }, () => LETTRES[randomInt(LETTRES.length)]).join(""));
    const motDePasse = groupes.join("-");
    if (/[a-z]/.test(motDePasse) && /[A-Z]/.test(motDePasse) && /[0-9]/.test(motDePasse)) return motDePasse;
  }
}

const console_ = createInterface({ input: process.stdin, output: process.stdout });
const demander = async (question: string) => (await console_.question(question)).trim();

function verifierImap(motDePasse: string) {
  execFileSync("python3", ["-c", "import imaplib,os; m=imaplib.IMAP4_SSL(os.environ['SERVEUR'],993,timeout=30); m.login(os.environ['ADRESSE'],os.environ['MDP']); m.logout()"], {
    env: { ...process.env, SERVEUR, ADRESSE, MDP: motDePasse },
    stdio: "pipe",
    timeout: 40_000,
  });
}

console.log("\n🛟  Réglage de la boîte bonjour@sosmiam.fr pour le serveur de SOS Miam\n");
if (existsSync(FICHIER_BOITE_MAIL) && (await demander(`${FICHIER_BOITE_MAIL} existe déjà. Le remplacer ? (o/N) `)).toLowerCase() !== "o") {
  console.log("Rien n'a changé.");
  process.exit(0);
}

let motDePasse = creerMotDePasse();
console.log("1. Ouvre le panneau de ta boîte bonjour@sosmiam.fr, onglet « Mots de passe d'applications ».");
console.log("2. Crée un mot de passe d'application nommé « Serveur SOS Miam », avec ce mot de passe :\n");
console.log(`      ${motDePasse}\n`);
console.log("   (colle-le dans les deux champs ; si on te propose de choisir les protocoles, coche IMAP et SMTP), puis enregistre.");
console.log("   Ton panneau impose son propre mot de passe ? Tape « m » pour le saisir à la place.\n");

for (;;) {
  const reponse = await demander("Appuie sur Entrée quand c'est enregistré (ou « m », ou « q » pour quitter) : ");
  if (reponse === "q") process.exit(0);
  if (reponse === "m") motDePasse = await demander("Mot de passe d'application : ");
  const reglages: ReglagesEnvoi = { serveur: SERVEUR, port: 465, utilisateur: ADRESSE, motDePasse, nomExpediteur: "SOS Miam", parHeure: 100 };
  try {
    process.stdout.write("Connexion IMAP (lecture de la boîte)… ");
    verifierImap(motDePasse);
    console.log("✅");
    process.stdout.write("Connexion SMTP (envoi)… ");
    await verifierConnexionEnvoi(reglages);
    console.log("✅");
    break;
  } catch (erreur) {
    const { stderr, response, message } = erreur as { stderr?: Buffer; response?: string; message?: string };
    const detail = (response || stderr?.toString().trim().split("\n").at(-1) || message || "erreur inconnue").slice(0, 200);
    console.log(`❌\n   Refusé : ${detail}`);
    console.log("   Vérifie que le mot de passe d'application est bien enregistré (avec IMAP et SMTP), puis réessaie.\n");
  }
}

mkdirSync(dirname(FICHIER_BOITE_MAIL), { recursive: true, mode: 0o700 });
writeFileSync(FICHIER_BOITE_MAIL, `IMAP_SERVEUR=${SERVEUR}\nIMAP_UTILISATEUR=${ADRESSE}\nIMAP_MOT_DE_PASSE=${motDePasse}\n`, { mode: 0o600 });
chmodSync(FICHIER_BOITE_MAIL, 0o600);
console.log(`\n${FICHIER_BOITE_MAIL} est prêt (lisible par root seul). La lecture des désinscriptions et l'envoi des mails sont branchés.`);

const essai = await demander("\nÀ quelle adresse envoyer un mail d'essai ? (Entrée pour passer) ");
if (essai && verifierEmail(essai)) {
  const resultat = await envoyerToutDeSuite("essai", essai, {
    objet: "[Essai] Les mails de SOS Miam partent 🛟",
    ...habillerCourriel({
      titre: "Ça marche !",
      paragraphes: [
        "Ce mail est parti de ta boîte bonjour@sosmiam.fr, par ton hébergement mail, sans aucun prestataire d'envoi.",
        "Regarde s'il est bien arrivé dans ta boîte de réception (et pas dans les spams), avec « SOS Miam » comme expéditeur.",
      ],
      bouton: { texte: "Ouvrir sosmiam.fr", adresse: "https://sosmiam.fr" },
      pied: "Mail d'essai envoyé depuis le serveur de SOS Miam, à ta demande.",
    }),
  });
  console.log(resultat.ok ? `Mail d'essai envoyé à ${essai} ✅` : `L'essai n'est pas parti : ${"message" in resultat ? resultat.message : resultat.erreur}`);
} else if (essai) {
  console.log("Cette adresse ne va pas : pas d'essai. Tu peux en envoyer un depuis le logiciel (Newsletter → Envoyer…).");
}
console_.close();
process.exit(0);
