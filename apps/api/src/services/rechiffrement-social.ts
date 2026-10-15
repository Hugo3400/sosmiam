// Rechiffrement de la partie sociale après un changement de la clé des données (spécification sociale D.1 « Rotation »,
// étape 9 du ménage de nuit ; docs/procedure-changement-cle.md, « La partie sociale »). Ne fait rien tant qu'il n'y a pas
// d'ancienne clé (chiffrement.versionsAnciennes vide). Sinon, ce qui porte une ancienne version (« v<N>: ») est relu puis
// réécrit avec la clé courante : codes d'invitation, titres de groupes, textes des messages, instantanés des signalements,
// puis les photos et notes vocales. Un chiffré modifié entre la lecture et l'écriture est laissé tel quel (déjà réécrit avec
// la clé courante, ou repris la nuit suivante). Seulement des nombres en sortie : jamais un texte, un fichier ni une clé.
import { Prisma } from "../base-de-donnees/client-genere/client.ts";
import { rechiffrerMediaSocial } from "../fonctions/social/rechiffrer-media-social.ts";
import { rechiffrerTexteSocial } from "../fonctions/social/rechiffrer-texte-social.ts";
import type { ChiffrementDonnees } from "./chiffrement-donnees.ts";
import { CONTEXTES_SOCIAUX, creerChiffrementSocial, type ChiffrementSocial, type UsageTexteSocial } from "./chiffrement-social.ts";
import type { BaseMenage } from "./menage-social-etapes.ts";
import type { FichierMediaChat, StockageMediasChat } from "./stockage-medias-chat.ts";

export type BilanRechiffrementSocial = {
  /** Chiffrés réécrits avec la clé courante (textes et fichiers) */
  rechiffres: number;
  /** Ceux qu'aucune clé ne relit (laissés tels quels, à regarder) */
  illisibles: number;
  /** Encore écrits avec une ancienne clé après ce passage, illisibles compris (0 : l'ancienne clé peut partir) */
  restants: number;
};

export type OptionsRechiffrementSocial = {
  /** Textes relus par paquet (500) */
  taille?: number;
  /** Paquets de textes au plus par table et par nuit (200, soit 100 000 lignes) : la nuit reste courte */
  paquetsParTable?: number;
  /** Fichiers réécrits au plus par nuit (500) : une photo pèse jusqu'à 5 Mo */
  fichiersParNuit?: number;
};

type LigneChiffree = { id: number; chiffre: string; conversationId?: number; idClient?: string };
type TableChiffree = { table: string; cle: string; colonne: string; plus: string; usage: UsageTexteSocial; contexte: (l: LigneChiffree) => string };

/** Les colonnes chiffrées de la partie sociale (A.0), avec le contexte authentifié de chaque chiffré */
const TABLES: readonly TableChiffree[] = [
  { table: "profils_sociaux", cle: "compte_id", colonne: "code_invitation_chiffre", plus: "", usage: "invitations", contexte: (l) => CONTEXTES_SOCIAUX.code(l.id) },
  { table: "conversations", cle: "id", colonne: "titre_chiffre", plus: "", usage: "textes", contexte: (l) => CONTEXTES_SOCIAUX.titre(l.id) },
  {
    table: "messages_conversations", cle: "id", colonne: "texte_chiffre", plus: `, conversation_id AS "conversationId", id_client AS "idClient"`, usage: "textes",
    contexte: (l) => CONTEXTES_SOCIAUX.message(Number(l.conversationId), String(l.idClient ?? "")),
  },
  { table: "signalements", cle: "id", colonne: "instantane_chiffre", plus: "", usage: "instantanes", contexte: (l) => CONTEXTES_SOCIAUX.instantane(l.id) },
];

/** Les chiffrés d'une table écrits avec une ancienne clé : réécrits par paquets, dans l'ordre des clés */
async function rechiffrerTable(base: BaseMenage, social: ChiffrementSocial, t: TableChiffree, taille: number, paquets: number): Promise<BilanRechiffrementSocial> {
  const bilan: BilanRechiffrementSocial = { rechiffres: 0, illisibles: 0, restants: 0 };
  const [table, cle, colonne] = [Prisma.raw(t.table), Prisma.raw(t.cle), Prisma.raw(t.colonne)];
  // « v12: » ne commence pas par « v1: » : le motif ne prend jamais la clé courante pour une autre
  const ancien = Prisma.sql`${colonne} IS NOT NULL AND ${colonne} NOT LIKE ${`v${social.versionCourante}:%`}`;
  let apres = 0;
  for (let paquet = 0; paquet < paquets; paquet++) {
    const lignes = await base.$queryRaw<LigneChiffree[]>`
      SELECT ${cle} AS id, ${colonne} AS chiffre${Prisma.raw(t.plus)} FROM ${table} WHERE ${cle} > ${apres} AND ${ancien} ORDER BY ${cle} LIMIT ${taille}`;
    for (const l of lignes) {
      apres = Number(l.id);
      let nouveau: string | null;
      try {
        nouveau = rechiffrerTexteSocial(social, t.usage, t.contexte({ ...l, id: Number(l.id) }), l.chiffre);
      } catch {
        bilan.illisibles += 1;
        continue;
      }
      if (nouveau === null) continue;
      bilan.rechiffres += await base.$executeRaw`UPDATE ${table} SET ${colonne} = ${nouveau} WHERE ${cle} = ${Number(l.id)} AND ${colonne} = ${l.chiffre}`;
    }
    if (lignes.length < taille) break;
  }
  const [compte] = await base.$queryRaw<{ restants: number }[]>`SELECT count(*)::int AS restants FROM ${table} WHERE ${ancien}`;
  bilan.restants = Number(compte?.restants ?? 0);
  return bilan;
}

/** Tous les fichiers du dossier des médias, du plus ancien au plus récent (date de modification) */
async function listerParAge(medias: StockageMediasChat): Promise<FichierMediaChat[]> {
  const tous: FichierMediaChat[] = [];
  for (let apres: string | null = null; ;) {
    const page = await medias.lister(apres, 1000);
    tous.push(...page);
    if (page.length < 1000) break;
    apres = page.at(-1)!.fichier;
  }
  return tous.sort((a, b) => a.modifieLe.getTime() - b.modifieLe.getTime() || (a.fichier < b.fichier ? -1 : 1));
}

/**
 * Les photos et notes vocales écrites avec une ancienne clé. Rien ne le dit dans la base : il faut lire l'en-tête de chaque
 * fichier. Mais tout ce qui s'écrit depuis le changement l'est avec la clé courante, et un fichier réécrit est neuf : rangés
 * par date de modification, les fichiers anciens viennent tous EN TÊTE. On les reprend dans cet ordre, et on s'arrête après
 * 20 fichiers courants de suite ; si le plafond de la nuit est atteint avant, ce qui reste d'anciens se compte par dichotomie.
 * Un fichier n'est jamais écrasé : le rechiffré prend un nouveau nom (le contexte authentifié en dépend), la base passe au
 * nouveau nom (message et signalement), puis l'ancien part. Un fichier que la base ne connaît plus est laissé à l'étape 8.
 */
async function rechiffrerFichiers(base: BaseMenage, social: ChiffrementSocial, medias: StockageMediasChat, plafond: number): Promise<BilanRechiffrementSocial> {
  const bilan: BilanRechiffrementSocial = { rechiffres: 0, illisibles: 0, restants: 0 };
  const fichiers = await listerParAge(medias);
  const estAncien = async (fichier: string) => {
    const octets = await medias.lire(fichier);
    return octets !== null && social.estAncienOctets(octets);
  };
  let i = 0;
  for (let courantsDeSuite = 0; i < fichiers.length && courantsDeSuite < 20 && bilan.rechiffres < plafond; i++) {
    const ancien = fichiers[i]!.fichier;
    const octets = await medias.lire(ancien);
    if (!octets) continue;
    const nouveau = medias.tirerNom();
    let chiffre: Buffer | null;
    try {
      chiffre = rechiffrerMediaSocial(social, octets, ancien, nouveau);
    } catch {
      bilan.illisibles += 1;
      bilan.restants += 1;
      continue;
    }
    if (chiffre === null) {
      courantsDeSuite += 1;
      continue;
    }
    courantsDeSuite = 0;
    await medias.ecrire(nouveau, chiffre);
    const [messages, signalements] = await base.$transaction([
      base.messageConversation.updateMany({ where: { fichier: ancien }, data: { fichier: nouveau } }),
      base.signalement.updateMany({ where: { fichierMedia: ancien }, data: { fichierMedia: nouveau } }),
    ]);
    if (messages.count + signalements.count === 0) {
      // Plus connu de la base (média expiré, conversation effacée entre-temps) : l'étape 8 retirera l'ancien
      await medias.supprimer([nouveau]);
      bilan.restants += 1;
      continue;
    }
    await medias.supprimer([ancien]);
    bilan.rechiffres += 1;
  }
  if (bilan.rechiffres >= plafond && i < fichiers.length) {
    // Le premier fichier courant après i : les anciens qui restent sont entre les deux
    let [bas, haut] = [i, fichiers.length];
    while (bas < haut) {
      const milieu = (bas + haut) >> 1;
      if (await estAncien(fichiers[milieu]!.fichier)) bas = milieu + 1;
      else haut = milieu;
    }
    bilan.restants += bas - i;
  }
  return bilan;
}

/**
 * Étape 9 du ménage social : rechiffre avec la clé courante ce qui porte une ancienne version. null : pas de changement de
 * clé en cours (aucune ancienne clé, ou pas de clé du tout) ; rien n'est lu. `restants` à 0 (et aucun illisible) : la partie
 * sociale n'a plus besoin de l'ancienne clé.
 */
export async function rechiffrerSocial(
  chiffrement: ChiffrementDonnees | null, medias: StockageMediasChat, base: BaseMenage, o: OptionsRechiffrementSocial = {},
): Promise<BilanRechiffrementSocial | null> {
  if (!chiffrement || chiffrement.versionsAnciennes.length === 0) return null;
  const social = creerChiffrementSocial(chiffrement);
  if (!social) throw new Error("Chiffrement social indisponible pendant un changement de clé");
  const total: BilanRechiffrementSocial = { rechiffres: 0, illisibles: 0, restants: 0 };
  const ajouter = (b: BilanRechiffrementSocial) => {
    total.rechiffres += b.rechiffres;
    total.illisibles += b.illisibles;
    total.restants += b.restants;
  };
  for (const t of TABLES) ajouter(await rechiffrerTable(base, social, t, o.taille ?? 500, o.paquetsParTable ?? 200));
  ajouter(await rechiffrerFichiers(base, social, medias, o.fichiersParNuit ?? 500));
  return total;
}
