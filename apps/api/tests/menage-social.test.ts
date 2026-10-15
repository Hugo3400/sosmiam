// Tests du ménage social de la nuit (lot L7, spécification E.1) : seuils et lignes du journal (fonctions pures), rechiffrement
// d'un texte et d'un fichier pendant un changement de clé (vraies clés de test, ancienne et nouvelle), protection de chaque
// étape, de chaque paquet et de chaque sous-étape (ce qui échoue n'arrête pas la suite ; le journal ne garde que des noms et
// des codes), liste du dossier des médias jusqu'à une page vide, ordre des verrous (sorties puis conversations ; compte puis
// conversation pour un signalement de message), sur des bases factices. Les requêtes SQL des étapes 1 à 9 sont essayées sur
// PGlite, hors de ces tests (scratchpad essai-l7/essai-menage-l7.mts).
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { test } from "node:test";

import { Prisma } from "../src/base-de-donnees/client-genere/client.ts";
import { calculerSeuilsMenageSocial } from "../src/fonctions/social/calculer-seuils-menage-social.ts";
import { decrireBilanMenageSocial } from "../src/fonctions/social/decrire-bilan-menage-social.ts";
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
const { effacerFichiersOrphelins } = await import("../src/services/menage-social-etapes.ts");
const { rechiffrerSocial } = await import("../src/services/rechiffrement-social.ts");
const { creerSignalementsSociaux } = await import("../src/services/signalements-sociaux.ts");

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
    contenusRetires: ilYa(365), orphelins: ilYa(1),
  });
  assert.notEqual(s.medias, T, "une copie : le ménage ne peut pas déplacer maintenant");
});

test("lignes du journal : seulement ce qui ne vaut pas zéro, des nombres, et le rechiffrement même à zéro", () => {
  assert.deepEqual(decrireBilanMenageSocial(BILAN_VIDE), []);
  const lignes = decrireBilanMenageSocial({ ...BILAN_VIDE, medias: 3, invitationsGroupes: 2, cloche: 40 });
  assert.deepEqual(lignes, [
    [3, "Médias du chat effacés (90 jours)"],
    [2, "Invitations à des groupes expirées (30 jours)"],
    [40, "Notifications de la cloche effacées (90 jours ou au-delà de 200)"],
  ]);
  const rotation = decrireBilanMenageSocial({ ...BILAN_VIDE, rechiffrement: { rechiffres: 0, illisibles: 0, restants: 0 }, etapesRatees: ["cloche"] });
  assert.deepEqual(rotation, [
    [0, "Chiffrés sociaux réécrits avec la nouvelle clé (0 illisible(s), 0 restant(s))"],
    [1, "Ménage social : étape(s) ratée(s) (cloche), voir le journal du serveur"],
  ], "« 0 restant(s) » : l'ancienne clé n'est plus utile à la partie sociale");
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
  // Sans l'ancienne clé, rien ne se relit (c'est pourquoi on ne la retire qu'à « 0 restant(s) »)
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
  const base = { messageConversation: { findMany: async () => [] }, signalement: { findMany: async () => [] } } as unknown as BaseMenage;
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
    signalement: { updateMany: async () => ({ count: 0 }) },
  } as unknown as BaseMenage;
  const bilan = await rechiffrerSocial(v2, avecDisparition(medias, PREMIER), base, { fichiersParNuit: 1 });
  assert.deepEqual(bilan, { rechiffres: 1, illisibles: 0, restants: 1 }, "avant : la liste s'arrêtait à la page de 999, et disait 0 restant");
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
  assert.deepEqual(bilan, { rechiffres: 0, illisibles: 2, restants: 2 }, "restants = illisibles : rien d'autre ne demande l'ancienne clé");
  assert.deepEqual(notes, [
    "Rechiffrement social : illisible, table messages_conversations, id 2003 (laissé tel quel)",
    `Rechiffrement social : illisible, fichier ${DERNIER} (laissé tel quel)`,
  ]);
});

test("signaler un message : verrou du compte, puis de sa conversation, AVANT de lire le message (le ménage ne le croise plus)", async () => {
  const ordre: string[] = [];
  const tx = {
    signalement: { findFirst: async () => null },
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
      ordre.push(text.includes("FROM conversations") && text.includes("FOR UPDATE") ? `verrou de la conversation ${values.join()}` : text);
      return [{ id: 9 }];
    },
  };
  const relations = { verrouillerComptes: async (_tx: unknown, ids: number[]) => void ordre.push(`verrou du compte ${ids.join()}`) };
  const base = { $transaction: async (faire: (t: typeof tx) => Promise<unknown>) => faire(tx) };
  const services = creerSignalementsSociaux({ relations: relations as never, chiffrement: deuxCles().s2 }, base as never);
  const signalement = { cible: "message", cibleId: "42", raison: "haine", precision: null, explication: "" };
  assert.deepEqual(await services.signaler(1, signalement as never, T), { ok: false, erreur: "contenu-inconnu" });
  assert.deepEqual(ordre, ["verrou du compte 1", "conversation du message", "verrou de la conversation 9", "lecture du message"]);
});
