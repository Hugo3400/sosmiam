// Expédition d'un mail par le serveur SMTP de l'hébergement mail (chiffré : TLS direct sur le port 465, ou STARTTLS
// obligatoire sur un autre port ; seul un serveur local d'essai peut s'en passer).
import nodemailer, { type Transporter } from "nodemailer";
import MailComposer from "nodemailer/lib/mail-composer";

import type { ReglagesEnvoi } from "./reglages-envoi.ts";
import { rangerDansEnvoyes } from "./ranger-envoye.ts";

export type MessageCourriel = {
  a: string;
  objet: string;
  html: string;
  texte: string;
  /** Newsletter : « répondre STOP » devient le bouton de désinscription des messageries (Gmail, Outlook…) */
  newsletter?: boolean;
  /** Écrit par une personne dans le logiciel : pas marqué « généré automatiquement » */
  ecritALaMain?: boolean;
  /** Réponse à un mail reçu : il reste dans le même fil de discussion chez la personne */
  enReponseA?: { messageId: string; references: string | null };
  /** Liens personnels (nouveau mot de passe, vérification…) : masqués dans la copie rangée dans « Envoyés » */
  secrets?: string[];
  /** Pas de copie dans « Envoyés » (envoi groupé : une seule copie est rangée au lancement) */
  sansCopie?: boolean;
};
export type ExpedierCourriel = (reglages: ReglagesEnvoi, message: MessageCourriel) => Promise<void>;

const LOCAL = new Set(["127.0.0.1", "localhost", "::1"]);
let transport: { cle: string; envoyeur: Transporter } | null = null;

function lireTransport(reglages: ReglagesEnvoi): Transporter {
  const cle = JSON.stringify([reglages.serveur, reglages.port, reglages.utilisateur, reglages.motDePasse]);
  if (transport?.cle === cle) return transport.envoyeur;
  transport?.envoyeur.close();
  const local = LOCAL.has(reglages.serveur);
  const envoyeur = nodemailer.createTransport({
    host: reglages.serveur,
    port: reglages.port,
    secure: reglages.port === 465,
    requireTLS: !local && reglages.port !== 465,
    auth: { user: reglages.utilisateur, pass: reglages.motDePasse },
    // Le nom annoncé au serveur : celui du site, jamais celui de la machine
    name: "sosmiam.fr",
    connectionTimeout: 20_000,
    greetingTimeout: 20_000,
    socketTimeout: 60_000,
  });
  transport = { cle, envoyeur };
  return envoyeur;
}

/** Vérifie la connexion au serveur d'envoi (identifiants compris), sans rien envoyer ; lève l'erreur sinon. */
export async function verifierConnexionEnvoi(reglages: ReglagesEnvoi): Promise<void> {
  await lireTransport(reglages).verify();
}

const MASQUE = "[lien personnel masqué]";
const echapperHtml = (texte: string) => texte.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Le mail brut (en-têtes compris), tel qu'il part ; `messageId` : le même pour la copie que pour l'envoi */
export function composerCourriel(reglages: ReglagesEnvoi, message: MessageCourriel, messageId?: string): Promise<Buffer> {
  const adresse = reglages.utilisateur;
  return new MailComposer({
    from: { name: reglages.nomExpediteur, address: adresse },
    ...(messageId ? { messageId } : {}),
    to: message.a,
    subject: message.objet,
    html: message.html,
    text: message.texte,
    headers: message.newsletter
      ? { "List-Unsubscribe": `<mailto:${adresse}?subject=STOP>` }
      : message.ecritALaMain ? {} : { "Auto-Submitted": "auto-generated" },
    ...(message.enReponseA
      ? { inReplyTo: message.enReponseA.messageId, references: [message.enReponseA.references, message.enReponseA.messageId].filter(Boolean).join(" ") }
      : {}),
  }).compile().build();
}

/** Le même mail, liens personnels remplacés par « [lien personnel masqué] » (dans le texte et dans le HTML) */
export function masquerSecrets(message: MessageCourriel): MessageCourriel {
  let { html, texte } = message;
  for (const secret of message.secrets ?? []) {
    if (!secret) continue;
    texte = texte.split(secret).join(MASQUE);
    html = html.split(secret).join(MASQUE).split(echapperHtml(secret)).join(MASQUE);
  }
  return { ...message, html, texte };
}

/**
 * Envoie un mail tout de suite ; lève l'erreur de nodemailer s'il est refusé (voir classerErreurEnvoi). Une fois parti,
 * une copie (liens personnels masqués) est rangée dans « Envoyés », sans attendre ni bloquer.
 */
export const expedierCourriel: ExpedierCourriel = async (reglages, message) => {
  const brut = await composerCourriel(reglages, message);
  await lireTransport(reglages).sendMail({ envelope: { from: reglages.utilisateur, to: message.a }, raw: brut });
  if (message.newsletter || message.sansCopie) return;
  const messageId = /^Message-ID:\s*(<[^>\r\n]+>)/im.exec(brut.toString("latin1"))?.[1];
  const copie = message.secrets?.length ? await composerCourriel(reglages, masquerSecrets(message), messageId) : brut;
  void rangerDansEnvoyes(copie);
};
