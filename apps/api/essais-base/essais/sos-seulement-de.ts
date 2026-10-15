// Essai sur base (PGlite, toutes les migrations du dépôt) de l'arrêt du SOS du soir, service Prisma moment-lieu.ts :
// arreterSos(lieuId, maintenant, seulementDe) arrête les SOS en cours du lieu (pas arrêtés, pas finis). seulementDe : ceux
// de ce compte seulement, jamais celui d'un compte supprimé depuis (compte_id à null) ; c'est la course de l'arrêt, pour
// tous (controleurs/moment-lieu.ts : sans SOS d'un autre vu, le geste n'arrête que ce qu'il a vu). Absent : tous (Prisma
// ignore compteId: undefined, il n'en fait pas un « IS NULL ») ; un compte qui n'a rien lancé : aucun. Un SOS fini, un SOS
// déjà arrêté et celui d'un autre lieu ne bougent jamais. Et lireAuteursSosEnCours, qui décide : les auteurs de ces mêmes
// SOS, null pour le compte supprimé. Le client global de l'API (connexion.ts) est branché sur PGlite. Aucune vraie base.
import "../socle/garde-fou.ts";
import { creerMomentLieu } from "../../src/services/moment-lieu.ts";
import { creerBaseEnMemoire } from "../socle/base-en-memoire.ts";
import { insererLigne } from "../socle/inserer-ligne.ts";
import { creerVerifications, terminerEssai } from "../socle/verifications.ts";

const essai = await creerBaseEnMemoire();
const inserer = (table: string, valeurs: Record<string, unknown>) => insererLigne(essai.db, table, valeurs);
const verifications = creerVerifications();
const { egal } = verifications;
const moment = creerMomentLieu();

/** Vendredi 9 octobre 2026, 20 h à Paris (la base garde les heures à la seconde) ; `heure(-1)` : il y a 1 h */
const MAINTENANT = new Date("2026-10-09T18:00:00Z");
const heure = (decalage: number) => new Date(MAINTENANT.getTime() + decalage * 3600_000);
const ARRETE_AVANT = heure(-1);

const max = await inserer("comptes", { email: "max@exemple.fr", prenom: "Max" });
const nina = await inserer("comptes", { email: "nina@exemple.fr", prenom: "Nina" });
const sam = await inserer("comptes", { email: "sam@exemple.fr", prenom: "Sam" });
const creerLieu = () => inserer("lieux", { type: "resto", ville: "Montpellier", statut: "publie" });
const poserSos = (lieuId: number, compteId: number, jusqua: Date, arreteLe: Date | null = null) =>
  inserer("sos_lieux", { lieu_id: lieuId, compte_id: compteId, places: 4, jusqua, cree_le: heure(-2), arrete_le: arreteLe });

/** Un lieu et ses SOS : trois en cours (Max, Nina, Sam), puis deux de Max qui ne bougent jamais (fini, déjà arrêté) */
async function preparerLieu(): Promise<number> {
  const lieuId = await creerLieu();
  for (const compteId of [max, nina, sam]) await poserSos(lieuId, compteId, heure(3));
  await poserSos(lieuId, max, heure(-1));
  await poserSos(lieuId, max, heure(3), ARRETE_AVANT);
  return lieuId;
}

/** Chaque SOS du lieu, dans l'ordre où il a été posé : [auteur, heure d'arrêt (ISO) ou null] */
const lireSos = async (lieuId: number) => (await essai.base.sosLieu.findMany({ where: { lieuId }, orderBy: { id: "asc" }, select: { compteId: true, arreteLe: true } }))
  .map((s) => [s.compteId, s.arreteLe?.toISOString() ?? null]);
/** Les auteurs des SOS en cours, triés (null, le compte supprimé, en premier) */
const lireAuteurs = async (lieuId: number) => (await moment.lireAuteursSosEnCours(lieuId, MAINTENANT)).sort((a, b) => (a ?? -1) - (b ?? -1));

const lieux = { seulementMax: await preparerLieu(), tous: await preparerLieu(), personne: await preparerLieu() };
// Un autre lieu, son SOS de Max en cours : jamais touché, quel que soit l'arrêt
const voisin = await creerLieu();
await poserSos(voisin, max, heure(3));
// Sam supprime son compte : ses SOS restent, compte_id à null (ON DELETE SET NULL)
await essai.sql("DELETE FROM comptes WHERE id = $1", [sam]);

const M = MAINTENANT.toISOString();
const A = ARRETE_AVANT.toISOString();
/** Les SOS d'un lieu préparé avant tout arrêt : les trois en cours, puis le fini et le déjà arrêté */
const AVANT = [[max, null], [nina, null], [null, null], [max, null], [max, A]];
for (const lieuId of Object.values(lieux)) {
  egal(await lireSos(lieuId), AVANT, "préparé : trois en cours, Sam à null");
  egal(await lireAuteurs(lieuId), [null, max, nina], "auteurs des SOS en cours : ni le fini, ni le déjà arrêté");
}

// seulementDe = Max : seul son SOS en cours s'arrête ; ni celui de Nina, ni celui du compte supprimé, ni ses deux autres
await moment.arreterSos(lieux.seulementMax, MAINTENANT, max);
egal(await lireSos(lieux.seulementMax), [[max, M], [nina, null], [null, null], [max, null], [max, A]], "seulementDe = Max");
egal(await lireAuteurs(lieux.seulementMax), [null, nina], "restent en cours : Nina et le compte supprimé");
// Rejoué une minute plus tard : déjà arrêté, son heure d'arrêt reste
await moment.arreterSos(lieux.seulementMax, new Date(MAINTENANT.getTime() + 60_000), max);
egal(await lireSos(lieux.seulementMax), [[max, M], [nina, null], [null, null], [max, null], [max, A]], "rejoué : rien ne bouge");

// seulementDe absent : tous ceux en cours s'arrêtent, celui du compte supprimé compris ; le fini et le déjà arrêté restent
await moment.arreterSos(lieux.tous, MAINTENANT);
egal(await lireSos(lieux.tous), [[max, M], [nina, M], [null, M], [max, null], [max, A]], "seulementDe absent : tous");
egal(await lireAuteurs(lieux.tous), [], "plus rien en cours");

// seulementDe = 999, un compte qui n'a rien lancé ici : aucun
await moment.arreterSos(lieux.personne, MAINTENANT, 999);
egal(await lireSos(lieux.personne), AVANT, "seulementDe = 999 : aucun");
egal(await lireAuteurs(lieux.personne), [null, max, nina], "toujours trois en cours");

// Le lieu voisin n'a jamais bougé
egal(await lireSos(voisin), [[max, null]], "un autre lieu : jamais touché");

await terminerEssai(import.meta.url, essai, verifications.nombre);
