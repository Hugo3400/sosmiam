import "../socle/garde-fou.ts";
import { randomBytes } from "node:crypto";

import { inscrireAppareil, type InscriptionAppareil } from "../../src/services/appareils-push.ts";
import { creerChiffrementDonnees } from "../../src/services/chiffrement-donnees.ts";
import { creerChiffrementSocial } from "../../src/services/chiffrement-social.ts";
import { oublierClesApercuSansSession } from "../../src/services/menage-app.ts";
import { creerApercusPush } from "../../src/services/notifications/apercus-push.ts";
import { rechiffrerSocial } from "../../src/services/rechiffrement-social.ts";
import { creerStockageMediasChatEnMemoire } from "../../src/services/stockage-medias-chat.ts";
import { creerBaseEnMemoire } from "../socle/base-en-memoire.ts";
import { insererLigne } from "../socle/inserer-ligne.ts";
import { creerVerifications, terminerEssai } from "../socle/verifications.ts";

const essai = await creerBaseEnMemoire();
const inserer = (table: string, valeurs: Record<string, unknown>) => insererLigne(essai.db, table, valeurs);
const verifications = creerVerifications();
const { egal } = verifications;

const DEBUT = Date.parse("2026-10-15T08:00:00Z");
const minute = (n: number) => new Date(DEBUT + n * 60_000);
const JETON_LEA = "a".repeat(64);
const JETON_MAX = "b".repeat(64);
const JETON_ANCIEN = "c".repeat(64);
const JETON_ENTRE_DEUX = "d".repeat(64);
const JETON_COMPTE = "e".repeat(64);

const telephone = (jeton: string, offres: boolean, autres: Partial<InscriptionAppareil> = {}): InscriptionAppareil => ({
  jeton, plateforme: "ios", ville: "Montpellier", offres, compteId: null, empreinteSession: null, cleApercu: null, langue: "fr", ...autres,
});

const lireAccord = async (jeton: string) => {
  const ligne = await essai.base.appareilPush.findUniqueOrThrow({ where: { jeton }, select: { offresAcceptees: true, offresAccepteesLe: true } });
  return [ligne.offresAcceptees, ligne.offresAccepteesLe?.toISOString() ?? null];
};

await inscrireAppareil(telephone(JETON_LEA, false), minute(0));
egal(await lireAccord(JETON_LEA), [false, null], "nouveau téléphone sans accord : faux, sans date");

await inscrireAppareil(telephone(JETON_LEA, true), minute(1));
egal(await lireAccord(JETON_LEA), [true, minute(1).toISOString()], "passe à vrai : la date de l'accord");

await inscrireAppareil(telephone(JETON_LEA, true, { ville: "Sète" }), minute(2));
egal(await lireAccord(JETON_LEA), [true, minute(1).toISOString()], "reste vrai : la date du premier accord ne bouge pas");
const lea = await essai.base.appareilPush.findUniqueOrThrow({ where: { jeton: JETON_LEA }, select: { ville: true, vuLe: true, actif: true } });
egal([lea.ville, lea.vuLe.toISOString(), lea.actif], ["Sète", minute(2).toISOString(), true], "le reste de l'inscription suit toujours");

await inscrireAppareil(telephone(JETON_LEA, false), minute(3));
egal(await lireAccord(JETON_LEA), [false, null], "repasse à faux : plus de date");

await inscrireAppareil(telephone(JETON_LEA, false), minute(4));
egal(await lireAccord(JETON_LEA), [false, null], "reste faux : toujours sans date");

await inscrireAppareil(telephone(JETON_LEA, true), minute(5));
egal(await lireAccord(JETON_LEA), [true, minute(5).toISOString()], "rallumé : la date du nouvel accord");

await inscrireAppareil(telephone(JETON_MAX, true, { plateforme: "android" }), minute(6));
egal(await lireAccord(JETON_MAX), [true, minute(6).toISOString()], "nouveau téléphone qui accepte d'emblée : vrai, daté");

await inserer("appareils_push", { jeton: JETON_ANCIEN, plateforme: "ios", ville: "Lyon" });
egal(await lireAccord(JETON_ANCIEN), [false, null], "un téléphone inscrit avant la colonne : faux par défaut, sans date");
await inscrireAppareil(telephone(JETON_ANCIEN, true), minute(7));
egal(await lireAccord(JETON_ANCIEN), [true, minute(7).toISOString()], "il accepte ensuite : vrai, daté");

await inserer("appareils_push", { jeton: JETON_ENTRE_DEUX, plateforme: "ios", offres_acceptees: true, offres_acceptees_le: null });
await inscrireAppareil(telephone(JETON_ENTRE_DEUX, false), minute(8));
egal(await lireAccord(JETON_ENTRE_DEUX), [false, null], "vrai sans date (entre deux écritures), puis faux : faux, sans date");
await essai.sql("UPDATE appareils_push SET offres_acceptees = true, offres_acceptees_le = NULL WHERE jeton = $1", [JETON_ENTRE_DEUX]);
await inscrireAppareil(telephone(JETON_ENTRE_DEUX, true), minute(9));
egal(await lireAccord(JETON_ENTRE_DEUX), [true, minute(9).toISOString()], "vrai sans date, puis vrai : la date est posée");

const compteId = await inserer("comptes", { email: "lea@exemple.fr", prenom: "Léa" });
const sessionId = await inserer("sessions_comptes", { empreinte: "f".repeat(64), compte_id: compteId, support: "app" });
await inscrireAppareil(telephone(JETON_COMPTE, true, { compteId, empreinteSession: "f".repeat(64) }), minute(10));
const lie = await essai.base.appareilPush.findUniqueOrThrow({ where: { jeton: JETON_COMPTE }, select: { compteId: true, sessionId: true } });
egal([lie.compteId, lie.sessionId], [compteId, sessionId], "avec une session : lié au compte et à la session");
egal(await lireAccord(JETON_COMPTE), [true, minute(10).toISOString()], "avec une session : l'accord est gardé pareil");

const cleDonnees = randomBytes(32);
const apercus = creerApercusPush(creerChiffrementSocial(creerChiffrementDonnees(cleDonnees)))!;
const cle = randomBytes(32);
const lireCle = async (jeton: string) => (await essai.base.appareilPush.findUniqueOrThrow({ where: { jeton }, select: { cleApercuChiffree: true } })).cleApercuChiffree;
await inscrireAppareil(telephone(JETON_COMPTE, true, { compteId, empreinteSession: "f".repeat(64), cleApercu: cle }), minute(11), apercus);
const gardee = await lireCle(JETON_COMPTE);
egal([typeof gardee, gardee?.startsWith("v"), gardee?.includes(cle.toString("base64url"))], ["string", true, false], "clé d'aperçu : gardée chiffrée, jamais telle quelle");
const relue = apercus.chiffrerPour({ titre: "💬 Léa", texte: "Coucou" }, { jeton: JETON_COMPTE, cleApercuChiffree: gardee! });
egal(typeof relue, "string", "et relisible pour chiffrer un aperçu");
await inscrireAppareil(telephone(JETON_COMPTE, true, { compteId, empreinteSession: "f".repeat(64) }), minute(12), apercus);
egal(await lireCle(JETON_COMPTE), null, "réinscrit sans clé : oubliée");
await inscrireAppareil(telephone(JETON_LEA, false, { cleApercu: cle }), minute(13), apercus);
egal(await lireCle(JETON_LEA), null, "sans compte : jamais gardée");
await inscrireAppareil(telephone(JETON_COMPTE, true, { compteId, empreinteSession: "f".repeat(64), cleApercu: cle }), minute(14), apercus);
egal(await oublierClesApercuSansSession(), 0, "session ouverte : la clé reste");
await essai.sql("DELETE FROM sessions_comptes WHERE id = $1", [sessionId]);
egal(await oublierClesApercuSansSession(), 1, "session fermée : le ménage de nuit oublie la clé");
egal(await lireCle(JETON_COMPTE), null, "et elle n'est plus en base");

await inserer("sessions_comptes", { empreinte: "9".repeat(64), compte_id: compteId, support: "app" });
await inscrireAppareil(telephone(JETON_COMPTE, true, { compteId, empreinteSession: "9".repeat(64), cleApercu: cle }), minute(15), apercus);
const v2 = creerChiffrementDonnees(randomBytes(32), { version: 2, anciennes: [{ version: 1, cle: cleDonnees }] });
const bilan = await rechiffrerSocial(v2, creerStockageMediasChatEnMemoire(), essai.baseDeDonnees);
egal([bilan?.illisibles, bilan?.restants], [0, 0], "changement de clé : le rechiffrement de nuit reprend aussi la clé d'aperçu");
const rechiffree = await lireCle(JETON_COMPTE);
egal(rechiffree?.startsWith("v2:"), true, "écrite avec la nouvelle clé");
const apercusV2 = creerApercusPush(creerChiffrementSocial(v2))!;
egal(typeof apercusV2.chiffrerPour({ titre: "💬 Léa", texte: "Coucou" }, { jeton: JETON_COMPTE, cleApercuChiffree: rechiffree! }), "string", "et toujours relisible pour ce téléphone");

const autres = await essai.sql("SELECT jeton, offres_acceptees FROM appareils_push WHERE jeton <> ALL($1) ORDER BY jeton", [[JETON_LEA, JETON_ANCIEN, JETON_ENTRE_DEUX, JETON_COMPTE]]);
egal(autres, [{ jeton: JETON_MAX, offres_acceptees: "t" }], "chaque téléphone garde son propre accord");

await terminerEssai(import.meta.url, essai, verifications.nombre);
