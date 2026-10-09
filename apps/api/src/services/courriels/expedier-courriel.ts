// Expédition d'un mail par le serveur SMTP de l'hébergement mail (chiffré : TLS direct sur le port 465, ou STARTTLS
// obligatoire sur un autre port ; seul un serveur local d'essai peut s'en passer).
import nodemailer, { type Transporter } from "nodemailer";

import type { ReglagesEnvoi } from "./reglages-envoi.ts";

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

/** Envoie un mail tout de suite ; lève l'erreur de nodemailer s'il est refusé (voir classerErreurEnvoi). */
export const expedierCourriel: ExpedierCourriel = async (reglages, message) => {
  const adresse = reglages.utilisateur;
  await lireTransport(reglages).sendMail({
    from: { name: reglages.nomExpediteur, address: adresse },
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
  });
};
