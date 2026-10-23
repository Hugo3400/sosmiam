import "../socle/garde-fou.ts";
import { construireRequetePouls } from "../../src/services/social-pouls.ts";
import { construireRequeteNonLusSorties } from "../../src/services/sorties-lecture.ts";
import { creerTablesMessages } from "../../src/services/messagerie-tables-messages.ts";
import { creerBaseEnMemoire } from "../socle/base-en-memoire.ts";
import { creerVerifications, terminerEssai } from "../socle/verifications.ts";

const essai = await creerBaseEnMemoire();
await essai.db.exec("SET session_replication_role = replica");
const q = essai.sql;
const verifications = creerVerifications();
const { egal } = verifications;
const t = creerTablesMessages(essai.base as never);
const vide = new Set<number>();

await q(`INSERT INTO conversations (id, type) VALUES (1, 'groupe'), (2, 'sortie')`);
await q(`INSERT INTO membres_conversations (conversation_id, compte_id, visible_apres) VALUES (1, 10, 0), (1, 11, 0), (2, 10, 0), (2, 11, 0)`);
const ajouter = (id: number, conv: number, auteur: number | null, systeme: string | null) =>
  q(`INSERT INTO messages_conversations (id, conversation_id, auteur_id, type, id_client, systeme, cree_le) VALUES ($1, $2, $3, 'texte', $4, $5, $6)`,
    [id, conv, auteur, `c-${id}`, systeme, new Date(Date.parse("2026-10-23T10:00:00Z") + id * 60_000).toISOString()]);
await ajouter(1, 1, 11, null);
await ajouter(2, 1, null, "sondage-clos");
await ajouter(3, 2, null, "rappel-sortie");

const fil = async (sansSystemes: boolean) => (await t.listerMessages(1, { apres: 0, caches: vide, exclus: vide, sansSystemes }, null, 10)).map((m) => m.id);
egal([await fil(false), await fil(true)], [[2, 1], [1]], "fil : sans les messages de SOS Miam pour une ancienne app");

const derniers = async (sansSystemes: boolean) =>
  [...(await t.lireDerniersMessages([{ id: 1, apres: 0 }, { id: 2, apres: 0 }], vide, vide, sansSystemes))].map(([c, m]) => [c, m.id]).sort();
egal([await derniers(false), await derniers(true)], [[[1, 2], [2, 3]], [[1, 1]]], "dernier message : jamais un message de SOS Miam pour une ancienne app");

const nonLus = async (sansSystemes: boolean) =>
  [...(await t.compterNonLus(10, [{ id: 1, depuis: 0 }, { id: 2, depuis: 0 }], vide, 99, sansSystemes))].sort();
egal([await nonLus(false), await nonLus(true)], [[[1, 2], [2, 1]], [[1, 1], [2, 0]]], "non-lus des conversations");

const sorties = async (sansSystemes: boolean) =>
  (await essai.base.$queryRaw<{ conversationId: number; nonLus: number }[]>(construireRequeteNonLusSorties(10, [2], sansSystemes))).map((l) => [l.conversationId, Number(l.nonLus)]);
egal([await sorties(false), await sorties(true)], [[[2, 1]], [[2, 0]]], "non-lus des sorties");

const pouls = async (sansSystemes: boolean) => {
  const [ligne] = await essai.base.$queryRaw<{ messagesNonLus: number; sortiesNonLus: number }[]>(construireRequetePouls(10, new Date("2026-10-23T12:00:00Z"), sansSystemes));
  return [Number(ligne!.messagesNonLus), Number(ligne!.sortiesNonLus)];
};
egal([await pouls(false), await pouls(true)], [[2, 1], [1, 0]], "pouls : messages et sorties");

await q(`INSERT INTO notifications_cloche (compte_id, type, acteur_id, cible, cible_id) VALUES
  (10, 'mention', 11, 'conversation', '1'), (10, 'mention', 11, 'publication', '4'), (10, 'mention', 11, NULL, NULL), (10, 'bande-ajout', 11, NULL, NULL)`);
const cloche = async (ancienneApp: boolean) => {
  const [ligne] = await essai.base.$queryRaw<{ clocheNonVues: number; clocheNombre: number }[]>(construireRequetePouls(10, new Date("2026-10-23T12:00:00Z"), ancienneApp));
  return [Number(ligne!.clocheNonVues), Number(ligne!.clocheNombre)];
};
egal([await cloche(false), await cloche(true)], [[4, 4], [3, 3]], "cloche : sans la mention d'une discussion pour une ancienne app, les autres restent (cible vide comprise)");

await terminerEssai(import.meta.url, essai, verifications.nombre);
