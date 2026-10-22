// Rechiffrement de la partie sociale après un changement de la clé des données (spécification sociale D.1 « Rotation »,
// étape 9 du ménage de nuit ; docs/procedure-changement-cle.md, « La partie sociale »). Ne fait rien tant qu'il n'y a pas
// d'ancienne clé (chiffrement.versionsAnciennes vide). Sinon, ce qui porte une ancienne version (« v<N>: ») est relu puis
// réécrit avec la clé courante : codes d'invitation, titres de groupes, textes des messages, lieux des sondages, instantanés
// des signalements, puis les photos et notes vocales. Un chiffré modifié entre la lecture et l'écriture est laissé tel quel (déjà réécrit avec
// la clé courante, ou repris la nuit suivante). Seulement des nombres en sortie : jamais un texte, un fichier ni une clé. Un
// chiffré illisible va au journal du serveur par sa table et son id (ou le nom tiré au hasard de son fichier), jamais par son
// contenu : c'est là qu'on les retrouve (docs/procedure-changement-cle.md, « La partie sociale »).
import { PART_LIBRE_MIN_DISQUE } from "../../../../packages/commun/src/regles/chat.ts";
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
  /** Encore écrits avec une ancienne clé après ce passage, illisibles compris ; l'ancien fichier d'un média rechiffré n'y est
   *  plus (il ne sert plus : l'étape 8 le retire la nuit suivante). Égal à `illisibles` deux nuits de suite : l'ancienne
   *  clé ne sert plus à rien */
  restants: number;
  /** Fichiers anciens qui attendent de la place (déjà comptés dans `restants`) : le disque est passé sous PART_LIBRE_MIN_DISQUE
   *  + MARGE_PART_LIBRE_RECHIFFREMENT, le rechiffrement des fichiers s'est mis en pause pour la nuit ; 0 : pas de pause. Un
   *  nombre seulement : il dit au journal du logiciel pourquoi les restants ne baissent pas */
  enAttenteDePlace: number;
};

export type OptionsRechiffrementSocial = {
  /** Textes relus par paquet (500) */
  taille?: number;
  /** Paquets de textes au plus par table et par nuit (200, soit 100 000 lignes) : la nuit reste courte */
  paquetsParTable?: number;
  /** Fichiers réécrits au plus par nuit (500) : une photo pèse jusqu'à 5 Mo ; et jamais sous 15 % + 2 points de disque libre */
  fichiersParNuit?: number;
};

type LigneChiffree = { id: number; chiffre: string; conversationId?: number; idClient?: string; ordre?: number };

/**
 * Avant chaque fichier réécrit, la part libre du disque doit rester au-dessus de PART_LIBRE_MIN_DISQUE (15 %, sous laquelle
 * les envois de médias des gens sont refusés) plus cette marge : le rechiffrement ne prend jamais la place des envois. En
 * dessous, il s'arrête pour la nuit, et ce qui reste se compte comme au plafond.
 */
export const MARGE_PART_LIBRE_RECHIFFREMENT = 0.02;

/** Les illisibles détaillés au journal du serveur, par nuit au plus (au-delà, leur nombre seulement : une mauvaise ancienne
 *  clé les rendrait tous illisibles, le journal ne doit pas déborder) */
const MAX_ILLISIBLES_AU_JOURNAL = 100;

/** Le journal des illisibles d'une nuit : où ils sont (table et id, ou fichier), jamais ce qu'ils contiennent */
function creerJournalIllisibles() {
  let notes = 0;
  return {
    noter(ou: string) {
      notes += 1;
      if (notes <= MAX_ILLISIBLES_AU_JOURNAL) console.error(`Rechiffrement social : illisible, ${ou} (laissé tel quel)`);
    },
    finir() {
      if (notes > MAX_ILLISIBLES_AU_JOURNAL) console.error(`Rechiffrement social : ${notes - MAX_ILLISIBLES_AU_JOURNAL} autre(s) illisible(s) cette nuit, non détaillé(s)`);
    },
  };
}
type JournalIllisibles = ReturnType<typeof creerJournalIllisibles>;

type TableChiffree = { table: string; cle: string; colonne: string; plus: string; usage: UsageTexteSocial; contexte: (l: LigneChiffree) => string };

/** Les colonnes chiffrées de la partie sociale (A.0), avec le contexte authentifié de chaque chiffré */
const TABLES: readonly TableChiffree[] = [
  { table: "profils_sociaux", cle: "compte_id", colonne: "code_invitation_chiffre", plus: "", usage: "invitations", contexte: (l) => CONTEXTES_SOCIAUX.code(l.id) },
  { table: "conversations", cle: "id", colonne: "titre_chiffre", plus: "", usage: "textes", contexte: (l) => CONTEXTES_SOCIAUX.titre(l.id) },
  {
    table: "messages_conversations", cle: "id", colonne: "texte_chiffre", plus: `, conversation_id AS "conversationId", id_client AS "idClient"`, usage: "textes",
    contexte: (l) => CONTEXTES_SOCIAUX.message(Number(l.conversationId), String(l.idClient ?? "")),
  },
  {
    table: "options_sondages", cle: "id", colonne: "lieu_chiffre", usage: "textes",
    plus: `, (SELECT m.conversation_id FROM messages_conversations m WHERE m.id = options_sondages.message_id) AS "conversationId",
      (SELECT m.id_client FROM messages_conversations m WHERE m.id = options_sondages.message_id) AS "idClient", ordre`,
    contexte: (l) => CONTEXTES_SOCIAUX.optionSondage(Number(l.conversationId), String(l.idClient ?? ""), Number(l.ordre)),
  },
  { table: "signalements", cle: "id", colonne: "instantane_chiffre", plus: "", usage: "instantanes", contexte: (l) => CONTEXTES_SOCIAUX.instantane(l.id) },
];

/** Les chiffrés d'une table écrits avec une ancienne clé : réécrits par paquets, dans l'ordre des clés */
async function rechiffrerTable(
  base: BaseMenage, social: ChiffrementSocial, t: TableChiffree, taille: number, paquets: number, journal: JournalIllisibles,
): Promise<BilanRechiffrementSocial> {
  const bilan: BilanRechiffrementSocial = { rechiffres: 0, illisibles: 0, restants: 0, enAttenteDePlace: 0 };
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
        journal.noter(`table ${t.table}, ${t.cle} ${Number(l.id)}`);
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

/**
 * Tous les fichiers du dossier des médias, du plus ancien au plus récent (date de modification). Seule une page VIDE dit la
 * fin : lister saute un fichier disparu entre readdir et stat, une page plus courte n'est donc pas forcément la dernière (s'y
 * arrêter oublierait la suite du dossier, et annoncerait un faux « 0 restant(s) »).
 */
async function listerParAge(medias: StockageMediasChat): Promise<FichierMediaChat[]> {
  const tous: FichierMediaChat[] = [];
  for (let apres: string | null = null; ;) {
    const page = await medias.lister(apres, 1000);
    if (page.length === 0) break;
    tous.push(...page);
    apres = page.at(-1)!.fichier;
  }
  return tous.sort((a, b) => a.modifieLe.getTime() - b.modifieLe.getTime() || (a.fichier < b.fichier ? -1 : 1));
}

/**
 * Les photos et notes vocales écrites avec une ancienne clé. Rien ne le dit dans la base : il faut lire l'en-tête de chaque
 * fichier. Mais tout ce qui s'écrit depuis le changement l'est avec la clé courante, et un fichier réécrit est neuf : rangés
 * par date de modification, les fichiers anciens viennent tous EN TÊTE. On les reprend dans cet ordre, et on s'arrête après
 * 20 fichiers courants de suite ; si le plafond de la nuit est atteint avant, ou si le disque passe sous PART_LIBRE_MIN_DISQUE
 * + MARGE_PART_LIBRE_RECHIFFREMENT (relu avant chaque écriture), ce qui reste d'anciens se compte par dichotomie (disque
 * presque plein : aussi dans `enAttenteDePlace`, pour que le journal du logiciel dise la pause).
 * Un fichier n'est jamais écrasé : le rechiffré prend un nouveau nom (le contexte authentifié en dépend), il est forcé sur
 * le disque (fsync, StockageMediasChat.ecrire), puis la base passe au nouveau nom : le message (ou la photo du groupe), et
 * TOUS les signalements qui citent l'ancien, ouverts ou jugés (un signalement jugé depuis moins de 183 jours garde son fichier, décision de Hugo du
 * 15/10/2026 : sans suivre le nouveau nom, il perdrait la preuve). L'ancien fichier n'est PAS supprimé ici : un signalement
 * en cours a pu le lire avant la transaction et l'écrire après (il le garde alors, étape 8), et un « Message supprimé » peut
 * le viser au même moment. Plus cité par aucun message ni signalement qui le garde, il part avec les orphelins de plus de
 * 24 h (étape 8) la nuit suivante ; d'ici là il n'est pas compté dans les restants (cette nuit, il compte comme rechiffré).
 * Un fichier que la base ne connaît plus du tout est compté restant, et laissé à l'étape 8.
 */
async function rechiffrerFichiers(
  base: BaseMenage, social: ChiffrementSocial, medias: StockageMediasChat, plafond: number, journal: JournalIllisibles,
): Promise<BilanRechiffrementSocial> {
  const bilan: BilanRechiffrementSocial = { rechiffres: 0, illisibles: 0, restants: 0, enAttenteDePlace: 0 };
  const fichiers = await listerParAge(medias);
  const estAncien = async (fichier: string) => {
    const octets = await medias.lire(fichier);
    return octets !== null && social.estAncienOctets(octets);
  };
  let i = 0;
  // Le disque est trop plein pour écrire : la boucle s'arrête sur un ancien (fichiers[i]), compté avec la suite
  let disquePlein = false;
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
      journal.noter(`fichier ${ancien}`);
      continue;
    }
    if (chiffre === null) {
      courantsDeSuite += 1;
      continue;
    }
    courantsDeSuite = 0;
    const partLibre = await medias.lirePartLibre();
    if (!(partLibre >= PART_LIBRE_MIN_DISQUE + MARGE_PART_LIBRE_RECHIFFREMENT)) {
      disquePlein = true;
      console.error(`Rechiffrement social : disque presque plein (${Math.floor(partLibre * 100)} % libre), les fichiers attendent une autre nuit`);
      break;
    }
    await medias.ecrire(nouveau, chiffre);
    const [messages, photos, signalements] = await base.$transaction([
      base.messageConversation.updateMany({ where: { fichier: ancien }, data: { fichier: nouveau } }),
      base.conversation.updateMany({ where: { photo: ancien }, data: { photo: nouveau } }),
      base.signalement.updateMany({ where: { fichierMedia: ancien }, data: { fichierMedia: nouveau } }),
    ]);
    if (messages.count + photos.count + signalements.count === 0) {
      // Plus connu de la base (média expiré, conversation effacée entre-temps) : le nouveau, que personne ne cite, part ;
      // l'ancien reste compté jusqu'à ce que l'étape 8 le retire (la nuit suivante)
      await medias.supprimer([nouveau]);
      bilan.restants += 1;
      continue;
    }
    // L'ancien reste sur le disque : l'étape 8 d'une nuit suivante l'efface, s'il n'est plus cité (voir plus haut)
    bilan.rechiffres += 1;
  }
  if ((disquePlein || bilan.rechiffres >= plafond) && i < fichiers.length) {
    // Le premier fichier courant après i : les anciens qui restent sont entre les deux
    let [bas, haut] = [i, fichiers.length];
    while (bas < haut) {
      const milieu = (bas + haut) >> 1;
      if (await estAncien(fichiers[milieu]!.fichier)) bas = milieu + 1;
      else haut = milieu;
    }
    bilan.restants += bas - i;
    if (disquePlein) bilan.enAttenteDePlace = bas - i;
  }
  return bilan;
}

/**
 * Étape 9 du ménage social : rechiffre avec la clé courante ce qui porte une ancienne version. null : pas de changement de
 * clé en cours (aucune ancienne clé, ou pas de clé du tout) ; rien n'est lu. Fin du changement de clé, pour la partie
 * sociale : `restants` égal à `illisibles` deux nuits de suite (la nuit d'après, l'étape 8 a retiré les anciens fichiers
 * rechiffrés, et un fichier qu'un signalement aurait cité entre-temps a été repris).
 */
export async function rechiffrerSocial(
  chiffrement: ChiffrementDonnees | null, medias: StockageMediasChat, base: BaseMenage, o: OptionsRechiffrementSocial = {},
): Promise<BilanRechiffrementSocial | null> {
  if (!chiffrement || chiffrement.versionsAnciennes.length === 0) return null;
  const social = creerChiffrementSocial(chiffrement);
  if (!social) throw new Error("Chiffrement social indisponible pendant un changement de clé");
  const total: BilanRechiffrementSocial = { rechiffres: 0, illisibles: 0, restants: 0, enAttenteDePlace: 0 };
  const ajouter = (b: BilanRechiffrementSocial) => {
    total.rechiffres += b.rechiffres;
    total.illisibles += b.illisibles;
    total.restants += b.restants;
    total.enAttenteDePlace += b.enAttenteDePlace;
  };
  const journal = creerJournalIllisibles();
  try {
    for (const t of TABLES) ajouter(await rechiffrerTable(base, social, t, o.taille ?? 500, o.paquetsParTable ?? 200, journal));
    ajouter(await rechiffrerFichiers(base, social, medias, o.fichiersParNuit ?? 500, journal));
  } finally {
    journal.finir();
  }
  return total;
}
