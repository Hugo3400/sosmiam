// Chiffrement de la partie sociale (décision 2 de Hugo du 14 octobre 2026 : messages chiffrés par l'API, AES-256-GCM, clé
// hors de la base ; spécification sociale A.0 et D.1). Quatre SOUS-CLÉS tirées de la clé des données par HKDF (deriverCle de
// services/chiffrement-donnees.ts, session Site : la clé maître ne sort jamais de là) : textes de la messagerie (messages,
// titres de groupes), médias (photos et notes vocales), codes d'invitation de la bande, instantanés de la modération.
// Chaque chiffré porte la version de la clé maître : « v<N>:iv:tag:données » pour un texte, « v<N>: » | iv | tag | données
// pour un fichier. On écrit toujours avec la clé courante ; on relit avec la sous-clé de la version écrite
// (deriverCleVersion), y compris une ancienne pendant un changement de clé ; le ménage de nuit rechiffre ce qui est ancien
// (estAncien, lot L7). Sans clé des données, creerChiffrementSocial rend null : les routes 🔐 répondent 503
// « chiffrement-indisponible » (middlewares/exiger-chiffrement-social.ts). Jamais un texte, un fichier ni une clé dans un
// journal ou un message d'erreur.
import { chiffrerOctets } from "../fonctions/securite/chiffrer-octets.ts";
import { chiffrerTexteVersionne } from "../fonctions/securite/chiffrer-texte-versionne.ts";
import { dechiffrerOctets } from "../fonctions/securite/dechiffrer-octets.ts";
import { dechiffrerTexteVersionne } from "../fonctions/securite/dechiffrer-texte-versionne.ts";
import type { ChiffrementDonnees } from "./chiffrement-donnees.ts";

/** Les contextes HKDF des sous-clés (D.1) : les changer rendrait illisible tout ce qui a été écrit */
export const SOUS_CLES_SOCIALES = {
  textes: "sos-miam/messagerie/textes/v1",
  medias: "sos-miam/messagerie/medias/v1",
  invitations: "sos-miam/bande/invitations/v1",
  instantanes: "sos-miam/moderation/instantanes/v1",
} as const;

export type UsageChiffrementSocial = keyof typeof SOUS_CLES_SOCIALES;
/** Les usages qui chiffrent des textes (les médias passent par chiffrerOctets) */
export type UsageTexteSocial = Exclude<UsageChiffrementSocial, "medias">;

const exigerId = (valeur: number, quoi: string) => {
  if (!Number.isSafeInteger(valeur) || valeur < 1) throw new Error(`${quoi} invalide pour un contexte de chiffrement`);
  return valeur;
};
const exigerMot = (valeur: string, quoi: string) => {
  if (!valeur || valeur.length > 80) throw new Error(`${quoi} invalide pour un contexte de chiffrement`);
  return valeur;
};

/** Les contextes authentifiés (AAD) d'A.0 : un chiffré déplacé vers un autre message, un autre groupe, un autre compte… ne se relit plus */
export const CONTEXTES_SOCIAUX = {
  /** Texte d'un message, ou le { l, m } d'un message « lieu » ; l'idClient ne change jamais, même si l'auteur part */
  message: (conversationId: number, idClient: string) => `conversation:${exigerId(conversationId, "Conversation")}:message:${exigerMot(idClient, "idClient")}`,
  optionSondage: (conversationId: number, idClient: string, ordre: number) =>
    `conversation:${exigerId(conversationId, "Conversation")}:message:${exigerMot(idClient, "idClient")}:option:${exigerId(ordre, "Option")}`,
  /** Titre d'un groupe */
  titre: (conversationId: number) => `conversation:${exigerId(conversationId, "Conversation")}:titre`,
  /** Photo ou note vocale, par le nom de son fichier (« <uuid>.bin ») */
  fichier: (fichier: string) => `fichier:${exigerMot(fichier, "Fichier")}`,
  /** Code d'invitation de la bande */
  code: (compteId: number) => `compte:${exigerId(compteId, "Compte")}`,
  /** Instantané d'un contenu signalé */
  instantane: (signalementId: number) => `signalement:${exigerId(signalementId, "Signalement")}`,
} as const;

export type ChiffrementSocial = {
  /** Version de la clé courante : tout ce qui s'écrit porte « v<versionCourante>: » */
  versionCourante: number;
  /** Un texte avec la sous-clé de cet usage et ce contexte (CONTEXTES_SOCIAUX) : « v<N>:iv:tag:données » */
  chiffrerTexte: (usage: UsageTexteSocial, contexte: string, texte: string) => string;
  /** Relit avec la sous-clé de la version écrite (courante ou ancienne) ; erreur si illisible (sans citer la valeur) */
  dechiffrerTexte: (usage: UsageTexteSocial, contexte: string, chiffre: string) => string;
  /** Un fichier, sous-clé des médias, contexte « fichier:<nom> » : « v<N>: » | iv | tag | données */
  chiffrerOctets: (octets: Uint8Array, fichier: string) => Buffer;
  dechiffrerOctets: (chiffre: Uint8Array, fichier: string) => Buffer;
  /** Texte d'un message (tel quel, pas en JSON), contexte « conversation:<id>:message:<idClient> » */
  chiffrerMessage: (contenu: string, conversationId: number, idClient: string) => string;
  /** Lève une erreur si illisible : le message est alors rendu { etat: "illisible", texte: null } */
  dechiffrerMessage: (chiffre: string, conversationId: number, idClient: string) => string;
  /** Titre d'un groupe, contexte « conversation:<id>:titre » */
  chiffrerTitre: (titre: string, conversationId: number) => string;
  dechiffrerTitre: (chiffre: string, conversationId: number) => string;
  /** Code d'invitation, sous-clé des invitations, contexte « compte:<id> » */
  chiffrerCode: (code: string, compteId: number) => string;
  dechiffrerCode: (chiffre: string, compteId: number) => string;
  /** Instantané (JSON) d'un contenu signalé, sous-clé de la modération, contexte « signalement:<id> » */
  chiffrerInstantane: (json: string, signalementId: number) => string;
  dechiffrerInstantane: (chiffre: string, signalementId: number) => string;
  /** Vrai si ce texte chiffré n'a pas été écrit avec la clé courante (à rechiffrer la nuit) */
  estAncien: (chiffre: string) => boolean;
  /** Pareil pour un fichier chiffré */
  estAncienOctets: (chiffre: Uint8Array) => boolean;
};

/**
 * Le chiffrement social, posé sur l'objet `chiffrement` de la session Site. Null sans clé des données (ou si les sous-clés
 * ne se tirent pas, avec un message clair au journal, sans rien des clés).
 */
export function creerChiffrementSocial(chiffrement: ChiffrementDonnees | null): ChiffrementSocial | null {
  if (!chiffrement) return null;
  const versionCourante = chiffrement.versionCle;
  // Sous-clés tirées une fois par version : la courante tout de suite, les anciennes à la première lecture qui en a besoin
  const sousCles = new Map<string, Buffer | null>();
  try {
    for (const [usage, contexte] of Object.entries(SOUS_CLES_SOCIALES)) sousCles.set(`${usage}:${versionCourante}`, chiffrement.deriverCle(contexte));
  } catch {
    console.error("Chiffrement social INDISPONIBLE (sous-clés impossibles à tirer de la clé des données) : les routes sociales chiffrées répondent 503 « chiffrement-indisponible ».");
    return null;
  }
  const trouverCle = (usage: UsageChiffrementSocial) => (version: number): Buffer | null => {
    const nom = `${usage}:${version}`;
    if (!sousCles.has(nom)) sousCles.set(nom, chiffrement.deriverCleVersion(SOUS_CLES_SOCIALES[usage], version));
    return sousCles.get(nom) ?? null;
  };
  const courante = (usage: UsageChiffrementSocial) => {
    const cle = sousCles.get(`${usage}:${versionCourante}`);
    if (!cle) throw new Error("Sous-clé courante absente");
    return { version: versionCourante, cle };
  };

  const chiffrerTexte = (usage: UsageTexteSocial, contexte: string, texte: string) => chiffrerTexteVersionne(texte, courante(usage), contexte);
  const dechiffrerTexte = (usage: UsageTexteSocial, contexte: string, chiffre: string) => dechiffrerTexteVersionne(chiffre, trouverCle(usage), contexte);

  return {
    versionCourante,
    chiffrerTexte,
    dechiffrerTexte,
    chiffrerOctets: (octets, fichier) => {
      const { version, cle } = courante("medias");
      return chiffrerOctets(octets, cle, version, CONTEXTES_SOCIAUX.fichier(fichier));
    },
    dechiffrerOctets: (chiffre, fichier) => dechiffrerOctets(chiffre, trouverCle("medias"), CONTEXTES_SOCIAUX.fichier(fichier)),
    chiffrerMessage: (contenu, conversationId, idClient) => chiffrerTexte("textes", CONTEXTES_SOCIAUX.message(conversationId, idClient), contenu),
    dechiffrerMessage: (chiffre, conversationId, idClient) => dechiffrerTexte("textes", CONTEXTES_SOCIAUX.message(conversationId, idClient), chiffre),
    chiffrerTitre: (titre, conversationId) => chiffrerTexte("textes", CONTEXTES_SOCIAUX.titre(conversationId), titre),
    dechiffrerTitre: (chiffre, conversationId) => dechiffrerTexte("textes", CONTEXTES_SOCIAUX.titre(conversationId), chiffre),
    chiffrerCode: (code, compteId) => chiffrerTexte("invitations", CONTEXTES_SOCIAUX.code(compteId), code),
    dechiffrerCode: (chiffre, compteId) => dechiffrerTexte("invitations", CONTEXTES_SOCIAUX.code(compteId), chiffre),
    chiffrerInstantane: (json, signalementId) => chiffrerTexte("instantanes", CONTEXTES_SOCIAUX.instantane(signalementId), json),
    dechiffrerInstantane: (chiffre, signalementId) => dechiffrerTexte("instantanes", CONTEXTES_SOCIAUX.instantane(signalementId), chiffre),
    estAncien: (chiffre) => chiffrement.estAncien(chiffre),
    // L'en-tête d'un fichier est le même « v<N>: » que celui d'un texte, en ASCII
    estAncienOctets: (chiffre) => chiffrement.estAncien(Buffer.from(chiffre.buffer, chiffre.byteOffset, Math.min(5, chiffre.byteLength)).toString("latin1")),
  };
}
