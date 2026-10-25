import "../socle/garde-fou.ts";

import { inscrireAppareil, type InscriptionAppareil } from "../../src/services/appareils-push.ts";
import { creerBaseEnMemoire } from "../socle/base-en-memoire.ts";
import { insererLigne } from "../socle/inserer-ligne.ts";
import { creerVerifications, terminerEssai } from "../socle/verifications.ts";

const essai = await creerBaseEnMemoire();
const inserer = (table: string, valeurs: Record<string, unknown>) => insererLigne(essai.db, table, valeurs);
const verifications = creerVerifications();
const { egal } = verifications;

const DEBUT = Date.parse("2026-10-24T20:00:00Z");
const minute = (n: number) => new Date(DEBUT + n * 60_000);
const JETON_NOUVEAU = "a".repeat(64);
const JETON_ANCIEN = "b".repeat(64);
const JETON_REPRISE = "c".repeat(64);

const telephone = (jeton: string, autres: Partial<InscriptionAppareil> = {}): InscriptionAppareil => ({
  jeton, plateforme: "ios", ville: "Montpellier", offres: false, compteId: null, empreinteSession: null, cleApercu: null, langue: "fr", ...autres,
});

const lireLangue = async (jeton: string) => (await essai.base.appareilPush.findUniqueOrThrow({ where: { jeton }, select: { langue: true } })).langue;

await inscrireAppareil(telephone(JETON_NOUVEAU, { langue: "en" }), minute(0));
egal(await lireLangue(JETON_NOUVEAU), "en", "nouveau téléphone en anglais : en");
await inscrireAppareil(telephone(JETON_NOUVEAU, { langue: "fr" }), minute(1));
egal(await lireLangue(JETON_NOUVEAU), "fr", "le même téléphone repasse en français : fr");
await inscrireAppareil(telephone(JETON_NOUVEAU, { langue: "en" }), minute(2));
egal(await lireLangue(JETON_NOUVEAU), "en", "puis de nouveau en anglais : en");

await inserer("appareils_push", { jeton: JETON_ANCIEN, plateforme: "android", ville: "Lyon" });
egal(await lireLangue(JETON_ANCIEN), "fr", "un téléphone inscrit avant la colonne : fr par défaut");
await inscrireAppareil(telephone(JETON_ANCIEN, { plateforme: "android", langue: "en" }), minute(3));
egal(await lireLangue(JETON_ANCIEN), "en", "il passe l'app en anglais : en");
await inscrireAppareil(telephone(JETON_ANCIEN, { plateforme: "android" }), minute(4));
egal(await lireLangue(JETON_ANCIEN), "fr", "une ancienne app qui le réinscrit sans X-Langue : fr");

const compteId = await inserer("comptes", { email: "lea@exemple.fr", prenom: "Léa" });
await inserer("sessions_comptes", { empreinte: "f".repeat(64), compte_id: compteId, support: "app" });
const sessions = essai.baseDeDonnees.sessionCompte as unknown as { findFirst: (...args: unknown[]) => Promise<unknown> };
const vraiFindFirst = sessions.findFirst;
sessions.findFirst = async () => ({ id: 987_654 });
try {
  await inscrireAppareil(telephone(JETON_REPRISE, { compteId, empreinteSession: "f".repeat(64), langue: "en" }), minute(5));
} finally {
  sessions.findFirst = vraiFindFirst;
}
const repris = await essai.base.appareilPush.findUniqueOrThrow({ where: { jeton: JETON_REPRISE }, select: { compteId: true, sessionId: true, langue: true } });
egal([repris.compteId, repris.sessionId, repris.langue], [compteId, null, "en"], "session fermée entre la lecture et l'écriture : détaché, langue gardée");

const lignes = await essai.sql("SELECT jeton, langue FROM appareils_push ORDER BY jeton");
egal(lignes, [{ jeton: JETON_NOUVEAU, langue: "en" }, { jeton: JETON_ANCIEN, langue: "fr" }, { jeton: JETON_REPRISE, langue: "en" }], "chaque téléphone garde sa propre langue");

await terminerEssai(import.meta.url, essai, verifications.nombre);
