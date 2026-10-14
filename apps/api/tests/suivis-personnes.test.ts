// Tests des suivis entre personnes (/app/suivis-personnes) : compte public suivi tout de suite, compte privé sur demande,
// refus silencieux qui reste « demande » et ne repart pas, expiration à 30 jours, retrait d'un abonné, 2 000 abonnements,
// repasser en public (par cette route, et par creerApresPassageEnPublic, que la session Site branchera sur PATCH
// /comptes/moi/profil), client commun. Tout en mémoire (aucune base), avec une clé de test ; la version Prisma est essayée
// avec une fausse base.
import assert from "node:assert/strict";
import { after, before, test } from "node:test";

import { creerServicesSociauxApi } from "../../../packages/commun/src/client-api/api/creer-services-sociaux-api.ts";
import { creerClientHttp } from "../../../packages/commun/src/client-api/client-http.ts";
import { creerApresPassageEnPublic } from "../src/controleurs/suivis-personnes.ts";
import { creerBancSocial, type PersonneDeTest } from "./outils/creer-banc-social.ts";

// La version Prisma se branche sur la base au chargement, sans s'y connecter : une adresse d'essai suffit (fausse base)
process.env.DATABASE_URL ??= "postgresql://essai@127.0.0.1:1/essai";
const { creerSuivisPersonnes } = await import("../src/services/suivis-personnes.ts");

let banc: Awaited<ReturnType<typeof creerBancSocial>>;
before(async () => {
  banc = await creerBancSocial();
});
after(() => banc.fermer());

const JOUR = 24 * 60 * 60 * 1000;
const suivre = (p: PersonneDeTest, cible: PersonneDeTest) => p.demander("PUT", `/app/suivis-personnes/abonnements/${cible.idPublic}`);
const resume = async (p: PersonneDeTest) => (await p.demander("GET", "/app/suivis-personnes")).corps.suivis;
const ids = (liens: { personne: { id: string } }[]) => liens.map((l) => l.personne.id);
const clocheDe = (p: PersonneDeTest) => [...banc.tables.cloche.values()].filter((n) => n.compteId === p.compteId);

test("compte public suivi tout de suite (« nouvel-abonne », en retour) ; compte privé sur demande ; déjà suivi : 200", async () => {
  const lea = await banc.creerPersonne();
  const tom = await banc.creerPersonne();
  const prive = await banc.creerPersonne({ prive: true });
  const r = await suivre(tom, lea);
  assert.deepEqual([r.statut, r.corps], [201, { ok: true, etat: "suivi", deja: false }]);
  assert.deepEqual(clocheDe(lea).map((n) => [n.type, n.acteurId, n.enRetour]), [["nouvel-abonne", tom.compteId, false]]);
  assert.deepEqual((await suivre(lea, tom)).corps.etat, "suivi");
  assert.deepEqual(clocheDe(tom).map((n) => [n.type, n.enRetour]), [["nouvel-abonne", true]], "« … te suit en retour »");
  assert.deepEqual([(await suivre(tom, lea)).statut, (await suivre(tom, lea)).corps.deja], [200, true]);
  assert.deepEqual([(await resume(lea)).abonnes, (await resume(lea)).abonnements], [1, 1]);

  const demande = await suivre(tom, prive);
  assert.deepEqual([demande.statut, demande.corps.etat], [201, "demande"]);
  assert.equal(clocheDe(prive).length, 0, "une demande ne sonne pas : elle attend dans les demandes");
  assert.deepEqual(ids((await resume(prive)).demandesRecues), [tom.idPublic]);
  assert.deepEqual(ids((await resume(tom)).demandesEnvoyees), [prive.idPublic]);
  assert.equal((await prive.demander("GET", "/app/social/pouls")).corps.pouls.demandes.suivis, 1);
  assert.equal((await tom.demander("GET", `/app/personnes/${prive.idPublic}`)).corps.profil.relation.jeSuis, "demande");
  await banc.attendreEnvois();
  assert.equal(banc.pushs.filter((p) => [lea.compteId, tom.compteId, prive.compteId].includes(p.compteId)).length, 0, "rien sur le téléphone");
  assert.equal((await suivre(tom, tom)).corps.champ, "personne");
});

test("refus silencieux : la demande reste « demande » chez qui suit, ne repart pas ; accepter après un refus ; 30 jours plus tard, elle repart", async () => {
  const prive = await banc.creerPersonne({ prive: true });
  const tom = await banc.creerPersonne();
  await suivre(tom, prive);
  assert.deepEqual((await prive.demander("DELETE", `/app/suivis-personnes/demandes/${tom.idPublic}`)).corps, { ok: true });
  assert.deepEqual((await resume(prive)).demandesRecues, []);
  assert.deepEqual(ids((await resume(tom)).demandesEnvoyees), [prive.idPublic], "il ne sait pas qu'elle a refusé");
  assert.deepEqual((await suivre(tom, prive)).corps, { ok: true, etat: "demande", deja: true });
  assert.deepEqual((await resume(prive)).demandesRecues, [], "elle ne repart pas");
  assert.equal(clocheDe(tom).length, 0, "on ne prévient jamais d'un refus");

  const accepte = await prive.demander("POST", `/app/suivis-personnes/demandes/${tom.idPublic}/accepter`);
  assert.deepEqual([accepte.statut, accepte.corps.lien.personne.id], [200, tom.idPublic], "marche aussi sur une demande refusée");
  assert.deepEqual(clocheDe(tom).map((n) => [n.type, n.acteurId]), [["demande-acceptee", prive.compteId]]);
  assert.equal((await prive.demander("POST", `/app/suivis-personnes/demandes/${tom.idPublic}/accepter`)).statut, 200, "deux touchers : rien de plus");
  assert.equal(clocheDe(tom).length, 1);
  assert.deepEqual(ids((await prive.demander("GET", "/app/suivis-personnes/abonnes")).corps.liens), [tom.idPublic]);
  assert.deepEqual(ids((await tom.demander("GET", "/app/suivis-personnes/abonnements")).corps.liens), [prive.idPublic]);

  const noe = await banc.creerPersonne();
  await suivre(noe, prive);
  await prive.demander("DELETE", `/app/suivis-personnes/demandes/${noe.idPublic}`);
  banc.horloge.maintenant += 31 * JOUR;
  assert.deepEqual((await resume(noe)).demandesEnvoyees, [], "expirée");
  assert.deepEqual((await suivre(noe, prive)).corps, { ok: true, etat: "demande", deja: false }, "une nouvelle demande");
  assert.deepEqual(ids((await resume(prive)).demandesRecues), [noe.idPublic]);
  banc.horloge.maintenant += 31 * JOUR;
  assert.equal((await prive.demander("POST", `/app/suivis-personnes/demandes/${noe.idPublic}/accepter`)).corps.erreur, "demande-inconnue");
  assert.equal((await noe.demander("DELETE", `/app/suivis-personnes/abonnements/${prive.idPublic}`)).statut, 200, "annuler");
  assert.equal(banc.tables.suivis.some((s) => s.suiveurId === noe.compteId), false);
});

test("repasser en public accepte les demandes en attente (pas les refusées) ; passer en privé garde les abonnés", async () => {
  const lea = await banc.creerPersonne();
  const fans = [await banc.creerPersonne(), await banc.creerPersonne(), await banc.creerPersonne()];
  for (const f of fans.slice(0, 2)) await suivre(f, lea);
  const prive = await lea.demander("PUT", "/app/suivis-personnes/confidentialite", { prive: true });
  assert.deepEqual(prive.corps, { ok: true, prive: true, acceptees: 0 });
  assert.equal(banc.tables.comptes.get(lea.compteId)!.prive, true, "écrit Compte.prive");
  assert.equal((await resume(lea)).abonnes, 2, "les abonnés restent");
  const nouveaux = [await banc.creerPersonne(), await banc.creerPersonne()];
  for (const n of nouveaux) assert.equal((await suivre(n, lea)).corps.etat, "demande");
  await suivre(fans[2]!, lea);
  await lea.demander("DELETE", `/app/suivis-personnes/demandes/${fans[2]!.idPublic}`);
  const publique = await lea.demander("PUT", "/app/suivis-personnes/confidentialite", { prive: false });
  assert.deepEqual(publique.corps, { ok: true, prive: false, acceptees: 2 });
  assert.equal((await resume(lea)).abonnes, 4);
  for (const n of nouveaux) assert.deepEqual(clocheDe(n).map((c) => c.type), ["demande-acceptee"]);
  assert.equal(clocheDe(fans[2]!).length, 0, "un refus reste un refus");
  assert.equal((await lea.demander("PUT", "/app/suivis-personnes/confidentialite", { prive: "non" })).corps.champ, "prive");
});

test("retirer un abonné, sans prévenir ; 2 000 abonnements au plus ; un blocage : personne-inconnue ; pseudo requis pour écrire", async () => {
  const lea = await banc.creerPersonne();
  const tom = await banc.creerPersonne();
  await suivre(tom, lea);
  assert.deepEqual((await lea.demander("DELETE", `/app/suivis-personnes/abonnes/${tom.idPublic}`)).corps, { ok: true });
  assert.equal((await resume(lea)).abonnes, 0);
  assert.equal((await tom.demander("GET", `/app/personnes/${lea.idPublic}`)).corps.profil.relation.jeSuis, "aucun");

  const avide = await banc.creerPersonne();
  for (let i = 0; i < 2000; i++) banc.tables.suivis.push({ suiveurId: avide.compteId, suiviId: 600_000 + i, statut: "accepte", creeLe: new Date(banc.horloge.maintenant), accepteLe: null });
  assert.deepEqual((await suivre(avide, lea)).corps, { ok: false, erreur: "trop-d-abonnements" });

  const noe = await banc.creerPersonne();
  banc.bloquer(lea, noe);
  assert.equal((await suivre(lea, noe)).corps.erreur, "personne-inconnue", "j'ai bloqué : on ne recrée rien");
  assert.equal((await suivre(noe, lea)).statut, 404, "elle m'a bloqué : on ne le dit jamais");
  const sansPseudo = await banc.creerPersonne({ sansPseudo: true });
  assert.equal((await suivre(sansPseudo, lea)).corps.erreur, "pseudo-requis");
  assert.equal((await sansPseudo.demander("GET", "/app/suivis-personnes")).statut, 200, "lire, sans pseudo");
  assert.equal(banc.tables.profils.has(sansPseudo.compteId), false);
});

test("client commun : les adresses des suivis, contre les vraies routes", async () => {
  const lea = await banc.creerPersonne({ prive: true });
  const tom = await banc.creerPersonne();
  const deTom = clientDe(tom).suivis;
  const deLea = clientDe(lea).suivis;
  const r = await deTom.suivre(lea.idPublic!, true);
  assert.ok(r.ok && r.etat === "demande" && r.deja === false);
  const resumeLea = await deLea.lireResume();
  assert.ok(resumeLea.ok && resumeLea.suivis.prive && resumeLea.suivis.demandesRecues[0]?.personne.id === tom.idPublic);
  const ouvert = await deLea.repondreDemande(tom.idPublic!, true);
  assert.ok(ouvert.ok && ouvert.lien?.personne.id === tom.idPublic);
  const page = await deLea.listerAbonnes();
  assert.ok(page.ok && page.liens.length === 1 && page.suite === null);
  assert.ok((await deTom.listerAbonnements()).ok);
  assert.ok((await deLea.retirerAbonne(tom.idPublic!)).ok);
  assert.ok((await deTom.suivre(lea.idPublic!, true)).ok);
  assert.ok((await deLea.repondreDemande(tom.idPublic!, false)).ok);
  assert.ok((await deTom.suivre(lea.idPublic!, false)).ok);
  const publique = await deLea.changerConfidentialite(false);
  assert.ok(publique.ok && publique.prive === false && publique.acceptees === 0);
  const mauvais = await deTom.listerAbonnes("pas-un-curseur!");
  assert.ok(!mauvais.ok && mauvais.champ === "apres");
});

test("creerApresPassageEnPublic (pour PATCH /comptes/moi/profil { prive: false }) : les demandes en attente sont acceptées, « demande-acceptee »", async () => {
  const lea = await banc.creerPersonne({ prive: true });
  const tom = await banc.creerPersonne();
  const sam = await banc.creerPersonne();
  banc.tables.suivis.push({ suiveurId: tom.compteId, suiviId: lea.compteId, statut: "demande", creeLe: new Date(banc.horloge.maintenant), accepteLe: null });
  banc.tables.suivis.push({ suiveurId: lea.compteId, suiviId: sam.compteId, statut: "demande", creeLe: new Date(banc.horloge.maintenant), accepteLe: null });
  // La route du profil écrit d'abord Compte.prive, puis appelle la dépendance
  banc.tables.comptes.get(lea.compteId)!.prive = false;
  await creerApresPassageEnPublic(banc.social.dependances, () => banc.horloge.maintenant)(lea.compteId);
  const statut = (de: PersonneDeTest, vers: PersonneDeTest) => banc.tables.suivis.find((l) => l.suiveurId === de.compteId && l.suiviId === vers.compteId)?.statut;
  assert.equal(statut(tom, lea), "accepte");
  assert.equal(statut(lea, sam), "demande", "ses propres demandes ne bougent pas");
  assert.deepEqual(clocheDe(tom).map((n) => [n.type, n.acteurId]), [["demande-acceptee", lea.compteId]]);
});

test("version Prisma : repasser en public écrit Compte.prive et accepte les demandes dans la même transaction ; suivre verrouille d'abord", async () => {
  const appels: string[] = [];
  const reponses: Record<string, unknown> = { "tx.suiviPersonne.findMany": [{ suiveurId: 5 }, { suiveurId: 6 }], "tx.compte.findUnique": { prive: false } };
  const client = (nom: string) => new Proxy({}, {
    get: (_c, modele: string) => new Proxy({}, {
      get: (_m, geste: string) => async () => {
        appels.push(`${nom}.${modele}.${geste}`);
        return reponses[`${nom}.${modele}.${geste}`] ?? (geste === "count" ? 0 : geste === "findUnique" ? null : { count: 0 });
      },
    }),
  });
  const tx = client("tx");
  const base = new Proxy(client("base"), { get: (c, cle: string) => (cle === "$transaction" ? async (f: (t: unknown) => unknown) => f(tx) : Reflect.get(c, cle)) });
  const relations = {
    verrouillerComptes: async (t: unknown) => void appels.push(`verrou:${t === tx}`),
    bloqueEntre: async (_a: number, _b: number, t?: unknown) => (appels.push(`bloqueEntre:${t === tx}`), false),
  };
  const suivis = creerSuivisPersonnes({ relations: relations as never, social: { listerLiens: async () => ({ liens: [], suite: null }) }, base: base as never });
  const r = await suivis.changerConfidentialite(4, false, new Date());
  assert.deepEqual([r.acceptees, r.effets.map((e) => (e.quoi === "cloche" ? e.notification.compteId : 0))], [2, [5, 6]]);
  assert.deepEqual(appels, ["tx.compte.update", "tx.suiviPersonne.findMany", "tx.suiviPersonne.updateMany"]);
  appels.length = 0;
  const suivi = await suivis.suivre(4, 9, new Date());
  assert.ok(suivi.ok && suivi.etat === "suivi");
  assert.deepEqual(appels.slice(0, 3), ["verrou:true", "bloqueEntre:true", "tx.suiviPersonne.findUnique"]);
});

/** Le client commun de cette personne, branché sur les routes du banc (un faux fetch qui passe par elles) */
function clientDe(p: PersonneDeTest) {
  const faux = (async (url: string, init: RequestInit) => {
    const r = await p.demander(String(init.method), url.replace("https://api.exemple.fr", ""), init.body ? JSON.parse(String(init.body)) : undefined);
    return new Response(JSON.stringify(r.corps), { status: r.statut, headers: { "Content-Type": "application/json" } });
  }) as unknown as typeof fetch;
  return creerServicesSociauxApi(creerClientHttp({ adresse: "https://api.exemple.fr", lireJeton: () => p.jeton, fetch: faux }));
}
