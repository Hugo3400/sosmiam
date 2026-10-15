// Essai sur base (PGlite, toutes les migrations du dépôt) des requêtes SQL brutes de la messagerie (lot L4,
// services/messagerie-tables-messages.ts) par le VRAI client Prisma : derniers messages, non-lus, lieux envoyés, dernier lieu
// reçu, puis le verrou et la version d'une conversation dans une vraie transaction. Clés étrangères coupées
// (session_replication_role = replica) pour ne pas créer de vrais comptes. Aucune vraie base.
import "../socle/garde-fou.ts";
import { Prisma } from "../../src/base-de-donnees/client-genere/client.ts";
import { creerTablesMessages } from "../../src/services/messagerie-tables-messages.ts";
import { creerBaseEnMemoire } from "../socle/base-en-memoire.ts";
import { creerVerifications, terminerEssai } from "../socle/verifications.ts";

const essai = await creerBaseEnMemoire();
await essai.db.exec("SET session_replication_role = replica");
const q = essai.sql;
const verifications = creerVerifications();
const { egal, vrai } = verifications;

// Le vrai client, dont on compte les requêtes brutes
const requetes: string[] = [];
const base = new Proxy(essai.base, {
  get(cible, nom) {
    const valeur = Reflect.get(cible, nom, cible);
    if (nom === "$queryRaw") {
      return (chaines: TemplateStringsArray, ...valeurs: unknown[]) => {
        requetes.push(Prisma.sql(chaines, ...valeurs).text);
        return cible.$queryRaw(chaines, ...valeurs);
      };
    }
    return typeof valeur === "function" ? valeur.bind(cible) : valeur;
  },
});
const t = creerTablesMessages(base as never);


// Données : conversations 1 (privé 10-11), 2 (groupe 10, 11, 12), 3 (privé 10-12) ; messages de chacun
await q(`INSERT INTO conversations (id, type, cle_prive) VALUES (1, 'prive', '10-11'), (2, 'groupe', NULL), (3, 'prive', '10-12')`);
await q(`INSERT INTO membres_conversations (conversation_id, compte_id, visible_apres) VALUES (1, 10, 0), (1, 11, 0), (2, 10, 0), (2, 11, 0), (2, 12, 0), (3, 10, 0), (3, 12, 0)`);
const ajouter = async (id: number, conv: number, auteur: number | null, type: string, cree: string, extra = "") =>
  q(`INSERT INTO messages_conversations (id, conversation_id, auteur_id, type, id_client, cree_le${extra ? ", supprime_le" : ""}) VALUES ($1, $2, $3, $4, $5, $6${extra ? ", now()" : ""})`, [id, conv, auteur, type, `c-${id}`, cree]);
await ajouter(1, 1, 11, "texte", "2026-10-14T10:00:00Z");
await ajouter(2, 1, 10, "lieu", "2026-10-14T10:01:00Z");
await ajouter(3, 1, 11, "lieu", "2026-10-14T10:02:00Z");
await ajouter(4, 2, 12, "texte", "2026-10-14T10:03:00Z");
await ajouter(5, 2, 11, "texte", "2026-10-14T10:04:00Z");
await ajouter(6, 2, null, "texte", "2026-10-14T10:05:00Z");
await ajouter(7, 3, 12, "lieu", "2026-10-14T10:06:00Z");
await ajouter(8, 1, 11, "lieu", "2026-10-14T10:07:00Z", "supprime");

// Dernier message visible de chaque conversation : 12 caché (blocage), le 6 (compte supprimé) visible, le 5 signalé exclu
const derniers = await t.lireDerniersMessages([{ id: 1, apres: 0 }, { id: 2, apres: 0 }, { id: 3, apres: 0 }], new Set([12]), new Set([6]));
egal([...derniers].map(([c, m]) => [c, m.id]).sort(), [[1, 8], [2, 5]]);
vrai(derniers.get(1)!.creeLe instanceof Date && derniers.get(1)!.type === "lieu");
const avecApres = await t.lireDerniersMessages([{ id: 2, apres: 5 }], new Set(), new Set());
egal(avecApres.get(2)!.id, 6);

// Non-lus : pour 10, pas les siens, ni supprimés, ni d'un caché ; 99 au plus
const nonLus = await t.compterNonLus(10, [{ id: 1, depuis: 0 }, { id: 2, depuis: 4 }, { id: 3, depuis: 0 }], new Set([12]), 99);
egal([...nonLus].sort(), [[1, 2], [2, 2], [3, 0]]);
egal((await t.compterNonLus(10, [{ id: 1, depuis: 0 }], new Set(), 1)).get(1), 1, "plafond");

// Lieux envoyés : reçus par 10 (le 3 de 11 ; le 7 de 12 caché si 12 est bloqué ; le 8 supprimé jamais), envoyés par 10 (le 2)
egal((await t.listerLieuxEnvoyes(10, "recus", { caches: new Set(), exclus: new Set() }, null, 10)).map((l) => [l.message.id, l.autreId]), [[7, 12], [3, 11]]);
egal((await t.listerLieuxEnvoyes(10, "recus", { caches: new Set([12]), exclus: new Set() }, null, 10)).map((l) => l.message.id), [3]);
egal((await t.listerLieuxEnvoyes(10, "recus", { caches: new Set(), exclus: new Set([7]) }, null, 10)).map((l) => l.message.id), [3]);
const page = await t.listerLieuxEnvoyes(10, "recus", { caches: new Set(), exclus: new Set() }, { date: new Date("2026-10-14T10:06:00Z"), id: 7 }, 10);
egal(page.map((l) => l.message.id), [3], "curseur");
egal((await t.listerLieuxEnvoyes(10, "envoyes", { caches: new Set(), exclus: new Set() }, null, 10)).map((l) => [l.message.id, l.autreId]), [[2, 11]]);
await q(`INSERT INTO elements_masques (compte_id, cible, cible_id) VALUES (10, 'lieu-recu', '3')`);
egal((await t.listerLieuxEnvoyes(10, "recus", { caches: new Set(), exclus: new Set() }, null, 10)).map((l) => l.message.id), [7], "retiré de ma vue");
await q(`UPDATE membres_conversations SET visible_apres = 7 WHERE conversation_id = 3 AND compte_id = 10`);
egal((await t.listerLieuxEnvoyes(10, "recus", { caches: new Set(), exclus: new Set() }, null, 10)).map((l) => l.message.id), [], "effacé pour moi");

// Dernier lieu reçu (vus) : au plus jusqua, sans les masques (un lieu retiré de ma vue reste « reçu »)
egal(await t.lireDernierLieuRecu(10, 100, new Set()), 3);
egal(await t.lireDernierLieuRecu(10, 2, new Set()), null);

// Verrou et version (messagerie-tables.ts), dans une vraie transaction du client Prisma
const version = await essai.base.$transaction(async (tx) => {
  const verrou = await tx.$queryRaw<{ id: number }[]>`SELECT id FROM conversations WHERE id = ${2} FOR UPDATE`;
  egal(verrou.length, 1);
  return tx.$queryRaw<{ version: number }[]>`UPDATE conversations SET version = version + 1, modifie_le = ${new Date()}::timestamptz, dernier_message_le = ${new Date()}::timestamptz WHERE id = ${2} RETURNING version`;
});
egal(version, [{ version: 1 }]);
egal(requetes.length, 13, "13 requêtes brutes jouées sur PostgreSQL (PGlite) par le vrai client");
await terminerEssai(import.meta.url, essai, verifications.nombre);
