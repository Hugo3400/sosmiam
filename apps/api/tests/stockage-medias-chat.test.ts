// Tests du stockage des photos et notes vocales du chat (vrai disque, dans un dossier temporaire : jamais le vrai dossier des
// médias), de ses fsync (ordre exact et pannes, par un disque espionné), des quotas de B.12, et de l'effacement des
// conversations (version Prisma avec une fausse transaction, et version en mémoire avec les mêmes cascades) : le fichier d'un
// signalement ouvert, ou jugé depuis moins de 183 jours, reste sur le disque (décision de Hugo du 15/10/2026).
import assert from "node:assert/strict";
import { mkdtempSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { open, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";

import { effacerConversations, supprimerMediasLibres } from "../src/services/effacer-conversations.ts";
import {
  creerStockageMediasChat, creerStockageMediasChatEnMemoire, FORME_FICHIER_MEDIA_CHAT, verifierQuotasMediasChat, type DisqueMediasChat,
} from "../src/services/stockage-medias-chat.ts";
import { creerTablesSocialesEnMemoire, effacerConversationsEnMemoire } from "../src/services/tables-sociales-en-memoire.ts";

const racine = mkdtempSync(join(tmpdir(), "sos-miam-medias-essai-"));
after(() => rmSync(racine, { recursive: true, force: true }));

test("disque : dossier 0700, fichiers 0600, noms tirés, jamais un chemin, pas d'écrasement", async () => {
  const dossier = join(racine, "a", "medias-chat");
  const alertes: number[] = [];
  let maintenant = 0;
  const s = creerStockageMediasChat(dossier, { quandDisquePresquePlein: (p) => alertes.push(p), horloge: () => maintenant });
  const nom = s.tirerNom();
  assert.match(nom, FORME_FICHIER_MEDIA_CHAT);
  assert.notEqual(s.tirerNom(), nom);
  await s.ecrire(nom, Buffer.from("chiffre"));
  assert.equal(statSync(dossier).mode & 0o777, 0o700);
  assert.equal(statSync(join(dossier, nom)).mode & 0o777, 0o600);
  assert.deepEqual(await s.lire(nom), Buffer.from("chiffre"));
  await assert.rejects(s.ecrire(nom, Buffer.from("autre")), (e: NodeJS.ErrnoException) => e.code === "EEXIST");
  assert.deepEqual(await s.lire(nom), Buffer.from("chiffre"), "pas écrasé");
  writeFileSync(join(racine, "secret.txt"), "x");
  for (const mauvais of ["../secret.txt", "../../etc/passwd", "secret.txt", `${nom}/x`, nom.toUpperCase(), "", "/etc/passwd"]) {
    await assert.rejects(s.ecrire(mauvais, Buffer.from("x")), /refusé/, mauvais);
    assert.equal(await s.lire(mauvais), null, mauvais);
  }
  assert.equal(await s.supprimer(["../secret.txt", "secret.txt"]), 0);
  assert.ok(readdirSync(racine).includes("secret.txt"));
  const deux = s.tirerNom();
  await s.ecrire(deux, Buffer.from("2"));
  writeFileSync(join(dossier, "intrus.txt"), "x");
  const liste = await s.lister(null, 10);
  assert.deepEqual(liste.map((f) => f.fichier), [nom, deux].sort());
  assert.ok(liste.every((f) => f.modifieLe instanceof Date));
  assert.deepEqual((await s.lister(liste[0]!.fichier, 10)).map((f) => f.fichier), [liste[1]!.fichier]);
  assert.equal((await s.lister(null, 1)).length, 1);
  assert.equal(await s.supprimer([nom, nom, deux, s.tirerNom()]), 2);
  assert.equal(await s.lire(nom), null);
  const part = await s.lirePartLibre();
  assert.ok(part > 0 && part <= 1, String(part));
  assert.deepEqual(await creerStockageMediasChat(join(racine, "absent")).lister(null, 5), []);
  assert.equal(alertes.length, part < 0.15 ? 1 : 0);
});

test("disque : une photo de 5 Mo écrite entière et forcée sur le disque ; un nom déjà pris n'est jamais écrasé", async () => {
  const dossier = join(racine, "cinq-mo");
  const s = creerStockageMediasChat(dossier);
  const nom = s.tirerNom();
  const photo = Buffer.alloc(5 * 1024 * 1024, 7);
  const debut = performance.now();
  await s.ecrire(nom, photo);
  const duree = performance.now() - debut;
  assert.ok((await s.lire(nom))!.equals(photo));
  assert.equal(statSync(join(dossier, nom)).mode & 0o777, 0o600);
  // Large marge (le disque d'essai peut être lent) : sur le VPS, une vingtaine de millisecondes avec le fsync
  assert.ok(duree < 5000, `${Math.round(duree)} ms`);
  await assert.rejects(s.ecrire(nom, Buffer.from("autre")), (e: NodeJS.ErrnoException) => e.code === "EEXIST");
  assert.ok((await s.lire(nom))!.equals(photo), "un fichier qui existait n'est jamais touché");
  assert.deepEqual(readdirSync(dossier), [nom]);
});

/**
 * node:fs/promises espionné, pour les fichiers écrits dans `dossier` : chaque ouverture, chaque appel sur une poignée et
 * chaque unlink vont dans `journal` (« open:fichier:wx:600 », « sync:dossier »…), sur le vrai disque. `pannes` fait lever
 * une erreur de ce code à l'appel choisi (« writeFile:fichier » : après en avoir écrit le début, comme un disque qui se
 * remplit en route).
 */
function espionnerDisque(dossier: string, pannes: Record<string, string> = {}) {
  const journal: string[] = [];
  const qui = (chemin: string) => (chemin === dossier ? "dossier" : "fichier");
  const panne = (appel: string) => {
    if (pannes[appel]) throw Object.assign(new Error(`Panne d'essai (${appel})`), { code: pannes[appel] });
  };
  const ouvrir = async (chemin: string, drapeaux: string, mode?: number) => {
    const nom = qui(chemin);
    journal.push(`open:${nom}:${drapeaux}${mode === undefined ? "" : `:${mode.toString(8)}`}`);
    const vraie = await open(chemin, drapeaux, mode);
    return {
      writeFile: async (octets: Uint8Array) => {
        journal.push(`writeFile:${nom}`);
        if (pannes[`writeFile:${nom}`]) await vraie.write(octets.subarray(0, 3));
        panne(`writeFile:${nom}`);
        await vraie.writeFile(octets);
      },
      sync: async () => {
        journal.push(`sync:${nom}`);
        panne(`sync:${nom}`);
        await vraie.sync();
      },
      close: async () => {
        journal.push(`close:${nom}`);
        await vraie.close();
      },
    };
  };
  const supprimer = async (chemin: string) => {
    journal.push(`unlink:${qui(chemin)}`);
    await unlink(chemin);
  };
  const disque: Partial<DisqueMediasChat> = { open: ouvrir as never, unlink: supprimer as never };
  return { journal, disque };
}

/** Ce que fait une écriture réussie, dans l'ordre : le fichier (contenu forcé AVANT de fermer), puis l'entrée du dossier */
const ECRITURE_COMPLETE = ["open:fichier:wx:600", "writeFile:fichier", "sync:fichier", "close:fichier", "open:dossier:r", "sync:dossier", "close:dossier"];

test("fsync : open(wx, 0600) → writeFile → fsync du fichier → close → fsync du dossier, dans cet ordre exact", async () => {
  const dossier = join(racine, "ordre");
  const { journal, disque } = espionnerDisque(dossier);
  const s = creerStockageMediasChat(dossier, { disque });
  const nom = s.tirerNom();
  await s.ecrire(nom, Buffer.from("chiffre"));
  assert.deepEqual(journal, ECRITURE_COMPLETE);
  assert.deepEqual(await s.lire(nom), Buffer.from("chiffre"));
  assert.equal(statSync(join(dossier, nom)).mode & 0o777, 0o600);
});

test("fsync : une écriture ou un fsync qui rate → le fichier commencé est supprimé (poignée fermée), l'erreur remonte", async () => {
  const cas: [string, string, string[]][] = [
    ["writeFile:fichier", "ENOSPC", ["open:fichier:wx:600", "writeFile:fichier", "close:fichier", "unlink:fichier"]],
    ["sync:fichier", "EIO", ["open:fichier:wx:600", "writeFile:fichier", "sync:fichier", "close:fichier", "unlink:fichier"]],
    ["sync:dossier", "EIO", [...ECRITURE_COMPLETE, "unlink:fichier"]],
  ];
  for (const [appel, code, attendu] of cas) {
    const dossier = join(racine, `panne-${appel.replace(":", "-")}`);
    const { journal, disque } = espionnerDisque(dossier, { [appel]: code });
    const s = creerStockageMediasChat(dossier, { disque });
    await assert.rejects(s.ecrire(s.tirerNom(), Buffer.alloc(64, 7)), (e: NodeJS.ErrnoException) => e.code === code, appel);
    assert.deepEqual(journal, attendu, appel);
    assert.deepEqual(readdirSync(dossier), [], `${appel} : aucun fichier entamé ne reste (rien ne sera cité en base)`);
  }
});

test("fsync : EEXIST → le fichier qui existait n'est ni réécrit ni supprimé", async () => {
  const dossier = join(racine, "deja-pris");
  const { journal, disque } = espionnerDisque(dossier);
  const s = creerStockageMediasChat(dossier, { disque });
  const nom = s.tirerNom();
  await s.ecrire(nom, Buffer.from("premier"));
  journal.length = 0;
  await assert.rejects(s.ecrire(nom, Buffer.from("second")), (e: NodeJS.ErrnoException) => e.code === "EEXIST");
  assert.deepEqual(journal, ["open:fichier:wx:600"], "ni écriture, ni unlink");
  assert.deepEqual(await s.lire(nom), Buffer.from("premier"));
});

test("fsync : un système de fichiers qui refuse le fsync d'un dossier (EINVAL, ENOTSUP, EOPNOTSUPP) → toléré, le fichier reste", async () => {
  for (const code of ["EINVAL", "ENOTSUP", "EOPNOTSUPP"]) {
    const dossier = join(racine, `sans-fsync-dossier-${code}`);
    const { journal, disque } = espionnerDisque(dossier, { "sync:dossier": code });
    const s = creerStockageMediasChat(dossier, { disque });
    const nom = s.tirerNom();
    await s.ecrire(nom, Buffer.from("chiffre"));
    assert.deepEqual(journal, ECRITURE_COMPLETE, `${code} : essayé quand même, et la poignée du dossier refermée`);
    assert.deepEqual(await s.lire(nom), Buffer.from("chiffre"), code);
  }
});

test("disque illisible : part libre 0, alerte une fois par heure", async () => {
  writeFileSync(join(racine, "fichier-pas-dossier"), "x");
  const alertes: number[] = [];
  let maintenant = 1_000_000;
  const s = creerStockageMediasChat(join(racine, "fichier-pas-dossier", "medias"), { quandDisquePresquePlein: (p) => alertes.push(p), horloge: () => maintenant });
  assert.equal(await s.lirePartLibre(), 0);
  assert.equal(await s.lirePartLibre(), 0);
  assert.equal(alertes.length, 1);
  maintenant += 3_600_000;
  await s.lirePartLibre();
  assert.equal(alertes.length, 2);
});

test("quotas B.12", () => {
  const base = { envoisCompte24h: 0, octetsCompte: 0, octetsServeur24h: 0, partLibre: 0.5 };
  assert.equal(verifierQuotasMediasChat(1000, base), "ok");
  assert.equal(verifierQuotasMediasChat(1000, { ...base, partLibre: 0.149 }), "stockage-plein");
  assert.equal(verifierQuotasMediasChat(1000, { ...base, partLibre: Number.NaN }), "stockage-plein");
  assert.equal(verifierQuotasMediasChat(1000, { ...base, octetsServeur24h: 20 * 1024 ** 3 - 999 }), "stockage-plein");
  assert.equal(verifierQuotasMediasChat(1000, { ...base, envoisCompte24h: 49 }), "ok");
  assert.equal(verifierQuotasMediasChat(1000, { ...base, envoisCompte24h: 50 }), "trop-de-medias");
  assert.equal(verifierQuotasMediasChat(1000, { ...base, octetsCompte: 1024 ** 3 - 1000 }), "ok");
  assert.equal(verifierQuotasMediasChat(1000, { ...base, octetsCompte: 1024 ** 3 - 999 }), "trop-de-medias");
});

test("en mémoire : mêmes règles de noms", async () => {
  const s = creerStockageMediasChatEnMemoire({ partLibre: 0.1 });
  const nom = s.tirerNom();
  await s.ecrire(nom, Buffer.from("a"));
  await assert.rejects(s.ecrire(nom, Buffer.from("b")));
  await assert.rejects(s.ecrire("../x", Buffer.from("b")), /refusé/);
  assert.deepEqual(await s.lire(nom), Buffer.from("a"));
  assert.equal(await s.lirePartLibre(), 0.1);
  s.reglerPartLibre(0.9);
  assert.equal(await s.lirePartLibre(), 0.9);
  assert.equal((await s.lister(null, 5)).length, 1);
  assert.equal(await s.supprimer([nom, nom]), 1);
  assert.equal(s.fichiers.size, 0);
});

test("effacerConversations : verrou trié, fichiers lus avant l'effacement, ceux que gardent les signalements restent", async () => {
  const medias = creerStockageMediasChatEnMemoire();
  const [f1, f2, f3] = [medias.tirerNom(), medias.tirerNom(), medias.tirerNom()];
  for (const f of [f1, f2, f3]) await medias.ecrire(f!, Buffer.from("x"));
  const journal: string[] = [];
  const tx = {
    $queryRaw: async (morceaux: TemplateStringsArray, ...valeurs: unknown[]) => {
      journal.push(`verrou:${morceaux.join("?")}:${JSON.stringify(valeurs.map((v) => (v as { values?: unknown[] }).values ?? v))}`);
      return [];
    },
    messageConversation: { findMany: async (a: unknown) => (journal.push(`lire:${JSON.stringify(a)}`), [{ fichier: f1 }, { fichier: f2 }, { fichier: f3 }]) },
    conversation: { deleteMany: async (a: unknown) => (journal.push(`effacer:${JSON.stringify(a)}`), { count: 2 }) },
  };
  const r = await effacerConversations(tx as never, [9, 3, 9, -1, 0], medias);
  assert.equal(r.conversations, 2);
  assert.deepEqual(r.fichiers, [f1, f2, f3]);
  assert.match(journal[0]!, /^verrou:SELECT id FROM conversations WHERE id IN \(\?\) ORDER BY id FOR UPDATE:\[\[3,9\]\]$/);
  assert.match(journal[1]!, /"conversationId":\{"in":\[3,9\]\}/);
  assert.match(journal[2]!, /"id":\{"in":\[3,9\]\}/);
  assert.equal(medias.fichiers.size, 3, "rien sur le disque avant la fin de la transaction");
  let filtre: unknown;
  const base = { signalement: { findMany: async (a: unknown) => ((filtre = a), [{ fichierMedia: f2 }]) } };
  const seuil = new Date("2026-04-15T00:00:00Z");
  assert.equal(await r.apresTransaction(base as never, seuil), 2);
  assert.deepEqual([...medias.fichiers.keys()], [f2], "le fichier que garde un signalement reste");
  const texte = JSON.stringify(filtre);
  assert.match(texte, /a-traiter/);
  assert.match(texte, /contesteLe/);
  assert.ok(texte.includes(`"reexamineLe":{"gt":"${seuil.toISOString()}"}`) && texte.includes(`"traiteLe":{"gt":"${seuil.toISOString()}"}`),
    "jugé (ou réexaminé) après le seuil du ménage : gardé aussi");
  // Rien à effacer : aucune requête
  const vide = await effacerConversations({} as never, [], medias);
  assert.equal(vide.conversations, 0);
  assert.equal(await vide.apresTransaction(), 0);
  // Base en panne après la transaction : aucune erreur levée, message neutre
  const erreurs: string[] = [];
  const origine = console.error;
  console.error = (...m: unknown[]) => void erreurs.push(m.map(String).join(" "));
  try {
    assert.equal(await supprimerMediasLibres([f2!], medias, { signalement: { findMany: async () => { throw new Error("panne"); } } } as never), 0);
  } finally {
    console.error = origine;
  }
  assert.equal(erreurs.length, 1);
  assert.ok(!erreurs[0]!.includes(f2!), "pas de nom de fichier dans le journal");
});

test("effacerConversationsEnMemoire : mêmes cascades que la base, la sortie avec, le fichier qu'un signalement garde reste", async () => {
  const tables = creerTablesSocialesEnMemoire();
  const medias = creerStockageMediasChatEnMemoire();
  const [libre, signale, conteste, juge, retenu, reexamine] = [1, 2, 3, 4, 5, 6].map(() => medias.tirerNom()) as [string, string, string, string, string, string];
  for (const f of [libre, signale, conteste, juge, retenu, reexamine]) await medias.ecrire(f, Buffer.from("x"));
  const quand = new Date("2026-10-14T10:00:00Z");
  const ilYa = (jours: number) => new Date(quand.getTime() - jours * 86_400_000);
  for (const id of [1, 2]) tables.conversations.set(id, { id, type: id === 1 ? "sortie" : "groupe" } as never);
  const message = (id: number, conversationId: number, fichier: string | null) => tables.messages.set(id, { id, conversationId, auteurId: 5, fichier } as never);
  message(10, 1, libre);
  message(11, 1, signale);
  message(12, 1, conteste);
  message(13, 1, juge);
  message(14, 1, retenu);
  message(15, 1, reexamine);
  message(20, 2, null);
  tables.reactions.push({ messageId: 10, compteId: 6, code: "miam", creeLe: quand } as never, { messageId: 20, compteId: 6, code: "miam", creeLe: quand } as never);
  tables.membres.push({ conversationId: 1, compteId: 5 } as never, { conversationId: 2, compteId: 5 } as never);
  tables.invitationsGroupes.push({ conversationId: 1, compteId: 7, statut: "invite" } as never);
  tables.departs.push({ conversationId: 1, compteId: 8 } as never);
  tables.sorties.set(30, { id: 30, conversationId: 1 } as never);
  tables.invitationsSorties.push({ sortieId: 30, compteId: 6, statut: "invite" } as never);
  tables.propositions.set(40, { id: 40, sortieId: 30, lieuId: 1 } as never);
  tables.votes.push({ propositionId: 40, compteId: 6 } as never);
  const signalement = (id: number, fichierMedia: string, enPlus: Record<string, unknown>) =>
    tables.signalements.set(id, { id, fichierMedia, statut: "retenu", contesteLe: null, reexamineLe: null, ...enPlus } as never);
  signalement(1, signale, { statut: "a-traiter", traiteLe: null });
  signalement(2, conteste, { traiteLe: ilYa(200), contesteLe: ilYa(20) });
  signalement(3, juge, { traiteLe: ilYa(300), contesteLe: ilYa(250), reexamineLe: ilYa(200) });
  signalement(4, retenu, { traiteLe: ilYa(10) });
  signalement(5, reexamine, { traiteLe: ilYa(300), contesteLe: ilYa(100), reexamineLe: ilYa(10) });
  const r = await effacerConversationsEnMemoire(tables, [1, 99], medias);
  assert.deepEqual([r.conversations, r.fichiers.sort()], [1, [libre, signale, conteste, juge, retenu, reexamine].sort()]);
  assert.deepEqual([...tables.conversations.keys()], [2]);
  assert.deepEqual([...tables.messages.keys()], [20]);
  assert.deepEqual(tables.reactions.map((l) => l.messageId), [20]);
  assert.deepEqual(tables.membres.map((l) => l.conversationId), [2]);
  assert.deepEqual([tables.invitationsGroupes.length, tables.departs.length, tables.sorties.size, tables.invitationsSorties.length, tables.propositions.size, tables.votes.length], [0, 0, 0, 0, 0, 0]);
  assert.equal(medias.fichiers.size, 6, "rien ne part du stockage avant la fin de la transaction");
  // Le seuil du ménage de nuit : 183 jours avant `quand`
  assert.equal(await r.apresTransaction(undefined, ilYa(183)), 2);
  assert.deepEqual([...medias.fichiers.keys()].sort(), [signale, conteste, retenu, reexamine].sort(),
    "pas jugé, contesté et pas réexaminé, retenu il y a 10 jours, réexaminé il y a 10 jours : gardés ; réexaminé il y a 200 jours : parti");
  assert.equal(tables.signalements.size, 5, "les signalements restent");
  assert.equal((await effacerConversationsEnMemoire(tables, [1], medias)).conversations, 0, "déjà partie : rien");
});
