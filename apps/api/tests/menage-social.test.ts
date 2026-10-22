// Tests du ménage social de la nuit (lot L7, spécification E.1) : seuils (fonction pure ; les lignes du journal sont
// dans menage-social-journal.test.ts), rechiffrement d'un texte et d'un fichier pendant un changement de clé (vraies
// clés de test, ancienne et nouvelle), protection de chaque étape, de chaque paquet et de chaque sous-étape (ce qui
// échoue n'arrête pas la suite ; le journal ne garde que des noms et des codes), liste du dossier des médias jusqu'à
// une page vide, ordre des verrous (sorties puis conversations ; compte puis conversation pour un signalement de
// message), garde des fichiers signalés (ouvert, ou jugé depuis moins de 183 jours) aux étapes 1, 2, 7 et 8, arrêt du
// rechiffrement quand le disque se remplit (et sa ligne au journal du logiciel), sur des bases factices. Les requêtes
// SQL des étapes 1 à 9 sont essayées sur PGlite, hors de ces tests (scratchpad essai-l7/essai-menage-l7.mts).
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { test } from "node:test";

import { Prisma } from "../src/base-de-donnees/client-genere/client.ts";
import { calculerSeuilsMenageSocial } from "../src/fonctions/social/calculer-seuils-menage-social.ts";
import { decrireBilanMenageSocial } from "../src/fonctions/social/decrire-bilan-menage-social.ts";
import { estFichierGardeParSignalement } from "../src/fonctions/social/est-fichier-garde-par-signalement.ts";
import { rechiffrerMediaSocial } from "../src/fonctions/social/rechiffrer-media-social.ts";
import { rechiffrerTexteSocial } from "../src/fonctions/social/rechiffrer-texte-social.ts";
import { creerChiffrementDonnees } from "../src/services/chiffrement-donnees.ts";
import { CONTEXTES_SOCIAUX, creerChiffrementSocial, type ChiffrementSocial } from "../src/services/chiffrement-social.ts";
import type { BaseMenage } from "../src/services/menage-social-etapes.ts";
import type { BilanMenageSocial } from "../src/services/menage-social.ts";
import {
  creerStockageMediasChatEnMemoire, type StockageMediasChat, type StockageMediasChatEnMemoire,
} from "../src/services/stockage-medias-chat.ts";

// Le ménage charge la connexion de l'API seulement sans `base`, les signalements dès leur import : une adresse d'essai suffit
// (jamais utilisée ici)
process.env.DATABASE_URL ??= "postgresql://essai@127.0.0.1:1/essai";
const { faireLeMenageSocial } = await import("../src/services/menage-social.ts");
const { effacerContenusRetires, effacerConversationsAnciennes, effacerFichiersOrphelins, effacerMediasExpires } = await import("../src/services/menage-social-etapes.ts");
const { rechiffrerSocial } = await import("../src/services/rechiffrement-social.ts");
const { creerSignalementsSociaux } = await import("../src/services/signalements-sociaux.ts");
const { signalementsGardantLeurFichier } = await import("../src/services/effacer-conversations.ts");

const JOUR = 86_400_000;
const T = new Date("2027-03-01T03:30:00Z");
const ilYa = (jours: number) => new Date(T.getTime() - jours * JOUR);

/** Une erreur de la base dont le message cite un faux contenu (il ne doit jamais aller au journal) */
const erreurDeBase = () => Object.assign(new Error("SELECT … 'Coucou la Brigade' …"), { name: "ErreurDeBase" });
/** Une base qui refuse tout : chaque requête lève erreurDeBase */
const baseEnPanne = new Proxy({}, {
  get: () => () => {
    throw erreurDeBase();
  },
}) as unknown as BaseMenage;

/** Le texte SQL (avec $1, $2…) et les valeurs d'une requête écrite avec le gabarit de Prisma (base.$queryRaw`…`) */
const rendre = (morceaux: TemplateStringsArray, valeurs: unknown[]) => Prisma.sql(morceaux, ...(valeurs as never[]));

/** Ce que `faire` écrit au journal du serveur (console.error), sans l'afficher */
async function ecouterJournal<T>(faire: () => Promise<T>): Promise<{ resultat: T; notes: string[] }> {
  const notes: string[] = [];
  const avant = console.error;
  console.error = (...morceaux: unknown[]) => void notes.push(morceaux.map(String).join(" "));
  try {
    return { resultat: await faire(), notes };
  } finally {
    console.error = avant;
  }
}

/** Des noms de fichiers de la bonne forme, rangés en tête et en queue du dossier */
const PREMIER = "00000000-0000-4000-8000-000000000000.bin";
const AVANT_DERNIER = "ffffffff-ffff-4fff-bfff-fffffffffffe.bin";
const DERNIER = "ffffffff-ffff-4fff-bfff-ffffffffffff.bin";

/** Le stockage en mémoire, dont `fichier` disparaît pendant le listage (entre readdir et stat, comme le vrai lister le saute) */
function avecDisparition(medias: StockageMediasChatEnMemoire, fichier: string): StockageMediasChat {
  return {
    ...medias,
    lister: async (apres, nombre) => {
      const page = await medias.lister(apres, nombre);
      if (!page.some((f) => f.fichier === fichier)) return page;
      medias.fichiers.delete(fichier);
      return page.filter((f) => f.fichier !== fichier);
    },
  };
}

const BILAN_VIDE: BilanMenageSocial = {
  medias: 0, conversations: 0, sorties: 0, conversationsVides: 0, demandesBande: 0, demandesSuivi: 0, invitationsSorties: 0, invitationsGroupes: 0,
  invitationsCoAuteurs: 0, departsGroupes: 0, clesIdempotence: 0, cloche: 0, masques: 0, contenusRetires: 0, commentairesSupprimes: 0,
  fichiersOrphelins: 0, rechiffrement: null, etapesRatees: [],
};

test("seuils : les durées décidées (90 jours, 1 an, 30 jours, 24 h, 6 et 13 mois)", () => {
  const s = calculerSeuilsMenageSocial(T);
  assert.deepEqual(s, {
    medias: T, conversations: ilYa(365), demandesBande: ilYa(30), demandesSuivi: ilYa(30), invitationsGroupes: ilYa(30), coAuteurs: ilYa(30),
    sortiesPassees: T, departs: ilYa(30), cles: ilYa(1), cloche: ilYa(90), clocheModeration: ilYa(183), masques: ilYa(395),
    contenusRetires: ilYa(365), orphelins: ilYa(1), fichiersSignales: ilYa(183),
  });
  assert.notEqual(s.medias, T, "une copie : le ménage ne peut pas déplacer maintenant");
});

/** Une clé v1, puis la v2 qui garde la v1 en ancienne (changement de clé en cours) */
function deuxCles() {
  const ancienne = randomBytes(32);
  const v1 = creerChiffrementDonnees(ancienne);
  const v2 = creerChiffrementDonnees(randomBytes(32), { version: 2, anciennes: [{ version: 1, cle: ancienne }] });
  return { v1, v2, s1: creerChiffrementSocial(v1)!, s2: creerChiffrementSocial(v2)! };
}

test("rechiffrer un texte : relu avec l'ancienne clé, réécrit avec la courante, même contexte", () => {
  const { s1, s2 } = deuxCles();
  const idClient = randomUUID();
  const ancien = s1.chiffrerMessage("Coucou la Brigade", 42, idClient);
  const contexte = CONTEXTES_SOCIAUX.message(42, idClient);
  const nouveau = rechiffrerTexteSocial(s2, "textes", contexte, ancien);
  assert.ok(nouveau?.startsWith("v2:") && ancien.startsWith("v1:"));
  assert.equal(s2.dechiffrerMessage(nouveau!, 42, idClient), "Coucou la Brigade");
  assert.equal(rechiffrerTexteSocial(s2, "textes", contexte, nouveau!), null, "déjà à la clé courante : rien à faire");
  assert.throws(() => rechiffrerTexteSocial(s2, "textes", CONTEXTES_SOCIAUX.message(42, randomUUID()), ancien), "déplacé vers un autre message : illisible");
  assert.throws(() => rechiffrerTexteSocial(s2, "textes", contexte, "v1:abc:def:ghi"), "abîmé : illisible");
  const code = rechiffrerTexteSocial(s2, "invitations", CONTEXTES_SOCIAUX.code(7), s1.chiffrerCode("CODESECRET23", 7));
  assert.equal(s2.dechiffrerCode(code!, 7), "CODESECRET23");
  const instantane = rechiffrerTexteSocial(s2, "instantanes", CONTEXTES_SOCIAUX.instantane(3), s1.chiffrerInstantane('{"texte":"x"}', 3));
  assert.equal(s2.dechiffrerInstantane(instantane!, 3), '{"texte":"x"}');
  // Sans l'ancienne clé, rien ne se relit : on ne la retire qu'une fois restants = illisibles deux nuits de suite, sans
  // étape « rechiffrement » ratée ces nuits-là (règle de fin de docs/procedure-changement-cle.md)
  const sansAncienne = creerChiffrementSocial(creerChiffrementDonnees(randomBytes(32), { version: 2 }))!;
  assert.throws(() => rechiffrerTexteSocial(sansAncienne, "textes", contexte, ancien));
});

test("rechiffrer un fichier : un nouveau nom, jamais l'ancien écrasé ; l'ancien nom ne relit pas le nouveau", () => {
  const { s1, s2 } = deuxCles();
  const medias = creerStockageMediasChatEnMemoire();
  const [ancien, nouveau] = [medias.tirerNom(), medias.tirerNom()];
  const chiffre = s1.chiffrerOctets(Buffer.from("photo de pâtes"), ancien);
  const rechiffre = rechiffrerMediaSocial(s2, chiffre, ancien, nouveau)!;
  assert.equal(s2.estAncienOctets(rechiffre), false);
  assert.equal(s2.dechiffrerOctets(rechiffre, nouveau).toString(), "photo de pâtes");
  assert.throws(() => s2.dechiffrerOctets(rechiffre, ancien), "le contexte suit le nom du fichier");
  assert.equal(rechiffrerMediaSocial(s2, rechiffre, nouveau, medias.tirerNom()), null);
  assert.throws(() => rechiffrerMediaSocial(s2, Buffer.from("pas un chiffré"), ancien, nouveau));
});

test("rechiffrement : rien n'est lu sans changement de clé", async () => {
  const medias = creerStockageMediasChatEnMemoire();
  assert.equal(await rechiffrerSocial(null, medias, baseEnPanne), null);
  assert.equal(await rechiffrerSocial(creerChiffrementDonnees(randomBytes(32)), medias, baseEnPanne), null, "une seule clé : rien à faire");
});

test("une étape qui échoue n'arrête pas les autres ; le journal ne garde que le nom et le code", async () => {
  const { resultat: bilan, notes } = await ecouterJournal(() =>
    faireLeMenageSocial({ medias: creerStockageMediasChatEnMemoire(), chiffrement: null, maintenant: T, base: baseEnPanne }));
  assert.deepEqual(bilan.etapesRatees, ["médias", "conversations", "conversations vides", "demandes", "cloche", "masques", "contenus retirés"],
    "les fichiers orphelins (dossier vide) et le rechiffrement (pas d'ancienne clé) passent quand même ; chaque nom une fois");
  assert.deepEqual([bilan.fichiersOrphelins, bilan.rechiffrement], [0, null]);
  // Une note par sous-étape essayée : 1 (médias) + 1 + 1 (conversations) + 7 (demandes) + 2 (cloche) + 1 (masques) + 5 (contenus retirés)
  assert.equal(notes.length, 18);
  assert.ok(notes.every((n) => n.includes("ErreurDeBase") && !n.includes("Coucou")), "jamais le message d'une erreur (il peut citer un contenu)");
  assert.ok(notes.some((n) => n.includes("« demandes » (co_auteurs_listes)")), "l'étape et la table (des noms constants)");
  assert.deepEqual(decrireBilanMenageSocial(bilan).at(-1)?.[0], 7);
});

test("un paquet ou une sous-étape qui échoue n'arrête pas la suite ; le bilan garde ce qui est fait ; les sorties verrouillées d'abord", async () => {
  const dansLaTransaction: string[] = [];
  const tx = {
    $queryRaw: async (morceaux: TemplateStringsArray, ...valeurs: unknown[]) => {
      const { text } = rendre(morceaux, valeurs);
      if (!text.includes("FOR UPDATE")) {
        dansLaTransaction.push("relecture");
        return [{ id: 501, type: "sortie" }, { id: 502, type: "groupe" }];
      }
      dansLaTransaction.push(text.includes("FROM sorties") ? "verrou des sorties" : "verrou des conversations");
      return [];
    },
    messageConversation: { findMany: async () => [] },
    conversation: { deleteMany: async () => ({ count: 2 }) },
  };
  let transactions = 0;
  const base = {
    // Étape 2 : deux paquets de candidates (500, puis 2) ; rien ailleurs
    $queryRaw: async (morceaux: TemplateStringsArray, ...valeurs: unknown[]) => {
      const { text, values } = rendre(morceaux, valeurs);
      if (!text.includes("SELECT c.id FROM conversations c") || !text.includes("dernier_message_le")) return [];
      if (values[0] === 0) return Array.from({ length: 500 }, (_, i) => ({ id: i + 1 }));
      return values[0] === 500 ? [{ id: 501 }, { id: 502 }] : [];
    },
    // Étape 4 : la sous-étape des suivis échoue, celles d'avant et d'après effacent
    $executeRaw: async (morceaux: TemplateStringsArray, ...valeurs: unknown[]) => {
      const { text } = rendre(morceaux, valeurs);
      if (text.includes("FROM suivis_personnes")) throw erreurDeBase();
      return text.includes("FROM demandes_bandes") ? 3 : text.includes("FROM invitations_sorties") ? 2 : 0;
    },
    // Le premier paquet de conversations échoue (un interblocage, par exemple), le second passe
    $transaction: async (faire: (t: typeof tx) => Promise<unknown>) => {
      transactions += 1;
      if (transactions === 1) throw erreurDeBase();
      return faire(tx);
    },
  } as unknown as BaseMenage;
  const { resultat: bilan, notes } = await ecouterJournal(() =>
    faireLeMenageSocial({ medias: creerStockageMediasChatEnMemoire(), chiffrement: null, maintenant: T, base }));
  assert.deepEqual(bilan, {
    ...BILAN_VIDE, conversations: 2, sorties: 1, demandesBande: 3, invitationsSorties: 2, etapesRatees: ["conversations", "demandes"],
  }, "le second paquet et les sous-étapes d'après sont faits, et comptés");
  assert.deepEqual(dansLaTransaction, ["verrou des sorties", "verrou des conversations", "relecture", "verrou des conversations"],
    "même ordre que sorties.ts : les sorties, puis leurs conversations");
  assert.equal(notes.length, 2);
  assert.ok(notes[0]!.includes("« conversations » (paquet de conversations)") && notes[1]!.includes("« demandes » (suivis_personnes)"));
  assert.ok(notes.every((n) => n.includes("ErreurDeBase") && !n.includes("Coucou")));
});

test("fichiers orphelins : un fichier qui disparaît pendant le listage n'arrête pas la liste (seule une page vide la finit)", async () => {
  const medias = creerStockageMediasChatEnMemoire({ horloge: () => ilYa(2).getTime() });
  await medias.ecrire(PREMIER, Buffer.from("chiffre"));
  for (let i = 0; i < 501; i++) await medias.ecrire(medias.tirerNom(), Buffer.from("chiffre"));
  const base = {
    messageConversation: { findMany: async () => [] }, conversation: { findMany: async () => [] }, signalement: { findMany: async () => [] },
  } as unknown as BaseMenage;
  const effaces = await effacerFichiersOrphelins(base, calculerSeuilsMenageSocial(T), avecDisparition(medias, PREMIER));
  assert.equal(effaces, 501, "les 499 de la première page (plus courte d'un nom), puis les 2 de la suivante");
  assert.equal(medias.fichiers.size, 0);
});

test("rechiffrement : un fichier qui disparaît pendant le listage ne fait plus annoncer un faux « 0 restant(s) »", async () => {
  const { s1, s2, v2 } = deuxCles();
  const medias = creerStockageMediasChatEnMemoire();
  const ecrire = async (nom: string, cle: ChiffrementSocial, jours: number) => {
    await medias.ecrire(nom, cle.chiffrerOctets(Buffer.from("photo de pâtes"), nom));
    medias.fichiers.get(nom)!.modifieLe = ilYa(jours);
  };
  await ecrire(PREMIER, s2, 1);
  for (let i = 0; i < 1000; i++) await ecrire(medias.tirerNom(), s2, 1);
  // Les deux seuls anciens (clé v1, écrits avant le changement) : leurs noms viennent après la première page de 1000
  await ecrire(AVANT_DERNIER, s1, 10);
  await ecrire(DERNIER, s1, 9);
  const repointes: string[] = [];
  const base = {
    $queryRaw: async (morceaux: TemplateStringsArray) => (morceaux.join("?").includes("count(*)") ? [{ restants: 0 }] : []),
    $transaction: (requetes: Promise<unknown>[]) => Promise.all(requetes),
    messageConversation: {
      updateMany: async (a: { where: { fichier: string } }) => {
        repointes.push(a.where.fichier);
        return { count: 1 };
      },
    },
    conversation: { updateMany: async () => ({ count: 0 }) },
    signalement: { updateMany: async () => ({ count: 0 }) },
  } as unknown as BaseMenage;
  const bilan = await rechiffrerSocial(v2, avecDisparition(medias, PREMIER), base, { fichiersParNuit: 1 });
  assert.deepEqual(bilan, { rechiffres: 1, illisibles: 0, restants: 1, enAttenteDePlace: 0 },
    "avant : la liste s'arrêtait à la page de 999, et disait 0 restant ; le plafond de la nuit n'est pas une pause du disque");
  assert.deepEqual(repointes, [AVANT_DERNIER], "le plus ancien d'abord");
  assert.ok(medias.fichiers.has(AVANT_DERNIER), "l'ancien fichier reste sur le disque : l'étape 8 le retire la nuit suivante");
});

test("rechiffrement : un illisible va au journal par sa table et son id (ou son fichier), jamais par son contenu", async () => {
  const { s1, v2 } = deuxCles();
  const medias = creerStockageMediasChatEnMemoire();
  await medias.ecrire(DERNIER, s1.chiffrerOctets(Buffer.from("Coucou la Brigade"), PREMIER));
  const base = {
    $queryRaw: async (morceaux: TemplateStringsArray, ...valeurs: unknown[]) => {
      const { text } = rendre(morceaux, valeurs);
      if (text.includes("count(*)")) return [{ restants: text.includes("messages_conversations") ? 1 : 0 }];
      return text.includes("FROM messages_conversations") && valeurs.includes(0)
        ? [{ id: 2003, chiffre: "v1:Q291Y291:bGE:QnJpZ2FkZQ", conversationId: 20, idClient: randomUUID() }] : [];
    },
  } as unknown as BaseMenage;
  const { resultat: bilan, notes } = await ecouterJournal(() => rechiffrerSocial(v2, medias, base));
  assert.deepEqual(bilan, { rechiffres: 0, illisibles: 2, restants: 2, enAttenteDePlace: 0 }, "restants = illisibles : rien d'autre ne demande l'ancienne clé");
  assert.deepEqual(notes, [
    "Rechiffrement social : illisible, table messages_conversations, id 2003 (laissé tel quel)",
    `Rechiffrement social : illisible, fichier ${DERNIER} (laissé tel quel)`,
  ]);
});

test("signaler un message : verrou du compte (FOR NO KEY UPDATE), puis de sa conversation, AVANT de lire le message", async () => {
  const ordre: string[] = [];
  let deja: { id: number } | null = null;
  const tx = {
    signalement: { findFirst: async () => deja },
    messageConversation: {
      findUnique: async (a: { select: Record<string, unknown> }) => {
        const saConversation = Object.keys(a.select).join() === "conversationId";
        ordre.push(saConversation ? "conversation du message" : "lecture du message");
        // Le ménage est passé pendant l'attente du verrou : le message n'est plus là
        return saConversation ? { conversationId: 9 } : null;
      },
    },
    $queryRaw: async (morceaux: TemplateStringsArray, ...valeurs: unknown[]) => {
      const { text, values } = rendre(morceaux, valeurs);
      if (text === "SELECT id FROM comptes WHERE id = $1 FOR NO KEY UPDATE") ordre.push(`verrou du compte ${values.join()}`);
      else ordre.push(text.includes("FROM conversations") && text.includes("FOR UPDATE") ? `verrou de la conversation ${values.join()}` : text);
      return [{ id: 9 }];
    },
  };
  // Plus de relations.verrouillerComptes (FOR UPDATE) : l'appeler lèverait une erreur ici
  const relations = {};
  const base = { $transaction: async (faire: (t: typeof tx) => Promise<unknown>) => faire(tx) };
  const services = creerSignalementsSociaux({ relations: relations as never, chiffrement: deuxCles().s2 }, base as never);
  const signalement = { cible: "message", cibleId: "42", raison: "haine", precision: null, explication: "" };
  assert.deepEqual(await services.signaler(1, signalement as never, T), { ok: false, erreur: "contenu-inconnu" });
  assert.deepEqual(ordre, ["verrou du compte 1", "conversation du message", "verrou de la conversation 9", "lecture du message"],
    "FOR NO KEY UPDATE : la clé étrangère d'un message ou d'une réaction du même compte (FOR KEY SHARE) passe, sans interblocage");
  // Déjà signalé : relu sous le verrou du compte, rien d'autre
  ordre.length = 0;
  deja = { id: 5 };
  assert.deepEqual(await services.signaler(1, signalement as never, T), { ok: true, deja: true, masquePourTous: false, effets: [] });
  assert.deepEqual(ordre, ["verrou du compte 1"]);
});

/** Un filtre Prisma (AND, OR, égalité, in, { not: null }, gt) rejoué sur une ligne en mémoire ; un opérateur inconnu lève */
function verifierFiltre(ligne: Record<string, unknown>, filtre: Record<string, unknown>): boolean {
  return Object.entries(filtre).every(([cle, attendu]) => {
    if (cle === "AND") return (attendu as Record<string, unknown>[]).every((f) => verifierFiltre(ligne, f));
    if (cle === "OR") return (attendu as Record<string, unknown>[]).some((f) => verifierFiltre(ligne, f));
    const valeur = ligne[cle] ?? null;
    if (attendu === null || typeof attendu !== "object") return valeur === attendu;
    const o = attendu as { in?: unknown[]; not?: null; gt?: Date };
    if (o.in) return o.in.includes(valeur);
    if ("not" in o && o.not === null) return valeur !== null;
    if (o.gt) return valeur instanceof Date && valeur.getTime() > o.gt.getTime();
    throw new Error(`Opérateur inconnu pour ${cle}`);
  });
}

/** Les cas de la décision du 15/10/2026 : le fichier reste tant que le signalement est ouvert, ou jugé depuis moins de 183 jours */
const CAS_SIGNALES: { nom: string; garde: boolean; s: Record<string, unknown> | null }[] = [
  { nom: "sans signalement", garde: false, s: null },
  { nom: "ouvert", garde: true, s: { statut: "a-traiter", traiteLe: null, contesteLe: null, reexamineLe: null } },
  { nom: "retenu il y a 10 jours", garde: true, s: { statut: "retenu", traiteLe: ilYa(10), contesteLe: null, reexamineLe: null } },
  { nom: "rejeté il y a 182 jours", garde: true, s: { statut: "rejete", traiteLe: ilYa(182), contesteLe: null, reexamineLe: null } },
  { nom: "jugé il y a 200 jours, sans contestation", garde: false, s: { statut: "retenu", traiteLe: ilYa(200), contesteLe: null, reexamineLe: null } },
  { nom: "contesté, pas encore réexaminé", garde: true, s: { statut: "retenu", traiteLe: ilYa(200), contesteLe: ilYa(20), reexamineLe: null } },
  { nom: "réexaminé il y a 10 jours", garde: true, s: { statut: "retenu", traiteLe: ilYa(300), contesteLe: ilYa(100), reexamineLe: ilYa(10) } },
  { nom: "réexaminé il y a 200 jours", garde: false, s: { statut: "rejete", traiteLe: ilYa(380), contesteLe: ilYa(300), reexamineLe: ilYa(200) } },
];

test("garde d'un fichier signalé : la règle en mémoire et le filtre de la base disent la même chose", () => {
  const seuil = calculerSeuilsMenageSocial(T).fichiersSignales;
  for (const cas of CAS_SIGNALES.filter((c) => c.s)) {
    assert.equal(estFichierGardeParSignalement(cas.s as never, seuil), cas.garde, cas.nom);
    assert.equal(verifierFiltre({ ...cas.s, fichierMedia: "f" }, signalementsGardantLeurFichier(seuil) as never), cas.garde, cas.nom);
  }
});

test("étapes 1, 2, 7 et 8 : le fichier d'un signalement ouvert ou jugé depuis moins de 183 jours reste, les autres partent", async () => {
  const seuils = calculerSeuilsMenageSocial(T);
  for (const etape of ["1 (médias de 90 jours)", "2 (conversations d'un an)", "7 (contenus retirés)", "8 (orphelins)"]) {
    const medias = creerStockageMediasChatEnMemoire();
    const fichiers = new Map<string, (typeof CAS_SIGNALES)[number]>();
    for (const cas of CAS_SIGNALES) {
      const nom = medias.tirerNom();
      await medias.ecrire(nom, Buffer.from("chiffre"));
      medias.fichiers.get(nom)!.modifieLe = ilYa(100);
      fichiers.set(nom, cas);
    }
    const lignes = () => [...fichiers.keys()].map((fichier) => ({ fichier }));
    const signalements = [...fichiers].flatMap(([fichierMedia, cas]) => (cas.s ? [{ ...cas.s, fichierMedia }] : []));
    const requetes: string[] = [];
    const tx = {
      $queryRaw: async (morceaux: TemplateStringsArray) => (morceaux.join("?").includes("FOR UPDATE") ? [] : [{ id: 1, type: "groupe" }]),
      messageConversation: { findMany: async () => lignes() },
      conversation: { deleteMany: async () => ({ count: 1 }) },
    };
    const base = {
      $queryRaw: async (morceaux: TemplateStringsArray, ...valeurs: unknown[]) => {
        const { text, values } = rendre(morceaux, valeurs);
        requetes.push(text);
        if (text.includes("media_expire_le") || (text.includes("retire_le") && text.includes("messages_conversations"))) return lignes();
        return text.includes("SELECT c.id FROM conversations c") && values[0] === 0 ? [{ id: 1 }] : [];
      },
      $executeRaw: async () => 0,
      $transaction: async (faire: (t: typeof tx) => Promise<unknown>) => faire(tx),
      // Les messages ne citent plus ces fichiers (fichier à NULL) : seuls les signalements peuvent les garder
      messageConversation: { findMany: async () => [] },
      conversation: { findMany: async () => [] },
      signalement: {
        findMany: async (a: { where: Record<string, unknown> }) =>
          signalements.filter((l) => verifierFiltre(l, a.where)).map((l) => ({ fichierMedia: l.fichierMedia })),
      },
    } as unknown as BaseMenage;
    if (etape.startsWith("1")) await effacerMediasExpires(base, seuils, medias);
    else if (etape.startsWith("2")) await effacerConversationsAnciennes(base, seuils, medias);
    else if (etape.startsWith("7")) await effacerContenusRetires(base, seuils, medias, T);
    else await effacerFichiersOrphelins(base, seuils, medias);
    for (const [fichier, cas] of fichiers) assert.equal(medias.fichiers.has(fichier), cas.garde, `étape ${etape} : ${cas.nom}`);
    if (etape.startsWith("1")) {
      const expires = requetes.find((r) => r.includes("media_expire_le"))!;
      assert.ok(!expires.includes("signalements"), "le média signalé quitte quand même la conversation (fichier à NULL) : seule sa copie reste");
    }
  }
});

test("rechiffrement : sous 15 % + 2 points de disque libre, les fichiers attendent une autre nuit et le reste est compté", async () => {
  const { s1, v2 } = deuxCles();
  const base = {
    $queryRaw: async (morceaux: TemplateStringsArray) => (morceaux.join("?").includes("count(*)") ? [{ restants: 0 }] : []),
    $transaction: (requetes: Promise<unknown>[]) => Promise.all(requetes),
    messageConversation: { updateMany: async () => ({ count: 1 }) },
    conversation: { updateMany: async () => ({ count: 0 }) },
    signalement: { updateMany: async () => ({ count: 0 }) },
  } as unknown as BaseMenage;
  const preparer = async (partLibre: number) => {
    const medias = creerStockageMediasChatEnMemoire({ partLibre, horloge: () => T.getTime() });
    for (let i = 0; i < 3; i++) {
      const nom = medias.tirerNom();
      await medias.ecrire(nom, s1.chiffrerOctets(Buffer.from("photo de pâtes"), nom));
      medias.fichiers.get(nom)!.modifieLe = ilYa(10 - i);
    }
    const ecrits: string[] = [];
    // Chaque fichier réécrit prend de la place : après le premier, le disque passe à 16,9 % libre
    const surveille: StockageMediasChat = {
      ...medias,
      ecrire: async (nom, octets) => {
        ecrits.push(nom);
        await medias.ecrire(nom, octets);
        medias.reglerPartLibre(0.169);
      },
    };
    return { medias, ecrits, surveille };
  };
  const a = await preparer(0.17);
  const { resultat: bilan, notes } = await ecouterJournal(() => rechiffrerSocial(v2, a.surveille, base));
  assert.deepEqual(bilan, { rechiffres: 1, illisibles: 0, restants: 2, enAttenteDePlace: 2 },
    "17 % : un fichier passe ; à 16,9 %, les 2 autres sont comptés comme au plafond, et attendent de la place");
  assert.equal(a.ecrits.length, 1, "rien n'est écrit sous la marge");
  assert.deepEqual(notes, ["Rechiffrement social : disque presque plein (16 % libre), les fichiers attendent une autre nuit"], "des nombres seulement");
  const b = await preparer(0.1);
  const plein = (await ecouterJournal(() => rechiffrerSocial(v2, b.surveille, base))).resultat;
  assert.deepEqual(plein, { rechiffres: 0, illisibles: 0, restants: 3, enAttenteDePlace: 3 });
  assert.deepEqual([b.ecrits.length, b.medias.fichiers.size], [0, 3], "disque déjà sous la marge : rien n'est écrit, tout est compté");
  // Le journal du logiciel dit pourquoi les restants ne baissent pas
  assert.deepEqual(decrireBilanMenageSocial({ ...BILAN_VIDE, rechiffrement: plein }), [
    [0, "Rechiffrement social : 0 illisible(s), 3 restant(s)"],
    [3, "Fichiers à rechiffrer en pause : disque presque plein"],
  ]);
});

test("la photo d'un groupe : jamais un orphelin (étape 8), et suivie par le rechiffrement (nouveau nom dans conversations.photo)", async () => {
  const medias = creerStockageMediasChatEnMemoire({ horloge: () => ilYa(2).getTime() });
  const [photo, orphelin] = [PREMIER, DERNIER];
  for (const nom of [photo, orphelin]) await medias.ecrire(nom, Buffer.from("chiffre"));
  const cherche: unknown[] = [];
  const base = {
    messageConversation: { findMany: async () => [] },
    conversation: {
      findMany: async (a: { where: { photo: { in: string[] } } }) => (cherche.push(a.where), a.where.photo.in.filter((f) => f === photo).map((p) => ({ photo: p }))),
    },
    signalement: { findMany: async () => [] },
  } as unknown as BaseMenage;
  assert.equal(await effacerFichiersOrphelins(base, calculerSeuilsMenageSocial(T), medias), 1);
  assert.deepEqual([medias.fichiers.has(photo), medias.fichiers.has(orphelin)], [true, false]);
  assert.equal(cherche.length, 1);

  const { s1, v2 } = deuxCles();
  const anciens = creerStockageMediasChatEnMemoire();
  await anciens.ecrire(photo, s1.chiffrerOctets(Buffer.from("photo du groupe"), photo));
  const repointes: { where: { photo: string }; data: { photo: string } }[] = [];
  const rechiffrement = {
    $queryRaw: async (morceaux: TemplateStringsArray) => (morceaux.join("?").includes("count(*)") ? [{ restants: 0 }] : []),
    $transaction: (requetes: Promise<unknown>[]) => Promise.all(requetes),
    messageConversation: { updateMany: async () => ({ count: 0 }) },
    conversation: { updateMany: async (a: { where: { photo: string }; data: { photo: string } }) => (repointes.push(a), { count: 1 }) },
    signalement: { updateMany: async () => ({ count: 0 }) },
  } as unknown as BaseMenage;
  const bilan = await rechiffrerSocial(v2, anciens, rechiffrement);
  assert.deepEqual(bilan, { rechiffres: 1, illisibles: 0, restants: 0, enAttenteDePlace: 0 });
  assert.equal(repointes.length, 1);
  assert.equal(repointes[0]!.where.photo, photo);
  assert.ok(anciens.fichiers.has(repointes[0]!.data.photo), "le rechiffré est sur le disque, sous son nouveau nom");
});
