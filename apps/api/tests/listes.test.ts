// Tests des listes de lieux de l'app (/app/listes) : visibilité « tous » ou « bande » selon les niveaux, 404 avant 403,
// co-auteurs de la bande seulement (refus gardé 30 jours), 100 lieux, « À découvrir », liste signalée cachée pour soi
// partout, modération, abonnements, Idempotency-Key et client commun. Tout en mémoire (aucune base), avec une clé de test ;
// les lieux sont ceux, fictifs, que le test prépare.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";

import { creerListesApi } from "../../../packages/commun/src/client-api/api/api-listes.ts";
import { creerClientHttp } from "../../../packages/commun/src/client-api/client-http.ts";
import { presenterListeDetail } from "../src/fonctions/social/presenter-liste-detail.ts";
import { prendreId } from "../src/services/tables-sociales-en-memoire.ts";
import { creerBancSocial, type PersonneDeTest } from "./outils/creer-banc-social.ts";

let banc: Awaited<ReturnType<typeof creerBancSocial>>;
before(async () => {
  banc = await creerBancSocial();
});
after(() => banc.fermer());

const JOUR = 24 * 60 * 60 * 1000;
let dernierLieu = 900;
/** Un lieu fictif (« publie » par défaut) */
function lieu(statut = "publie"): number {
  dernierLieu += 1;
  banc.tables.lieux.set(dernierLieu, { statut, nom: `La Cantine n°${dernierLieu}` });
  return dernierLieu;
}
/** POST /app/listes ; l'idClient part dans le corps (lireIdClient le prend là, ou dans l'en-tête Idempotency-Key) */
const creer = (p: PersonneDeTest, enPlus: Record<string, unknown> = {}) =>
  p.demander("POST", "/app/listes", { titre: "Brunchs du dimanche", emoji: "🥞", visibilite: "tous", idClient: randomUUID(), ...enPlus });
const voit = async (p: PersonneDeTest, id: string) => (await p.demander("GET", `/app/listes/${id}`)).statut === 200;
const clocheDe = (p: PersonneDeTest) => [...banc.tables.cloche.values()].filter((n) => n.compteId === p.compteId);

test("presenterListeDetail : invitations en attente pour l'auteur et l'invité seulement, jamais un refus ni un bloqué", () => {
  const personne = (id: number) => ({ id: `personne${id}x`.slice(0, 10), pseudo: `p${id}`, prenom: `P${id}`, avatar: null });
  const resume = { id: "4", titre: "Brunchs", emoji: "🥞", description: "", auteur: personne(1), visibilite: "tous" as const, nombreLieux: 2, abonnes: 0, modifieLe: "2026-10-14T10:00:00.000Z" };
  const coAuteurs = [{ compteId: 2, statut: "accepte" }, { compteId: 3, statut: "invite" }, { compteId: 4, statut: "refuse" }, { compteId: 5, statut: "accepte" }];
  const commun = { auteurId: 1, lieux: [8, 7], coAuteurs, abonne: false, personnes: new Map([1, 2, 3, 4, 5].map((id) => [id, personne(id)])), caches: new Set([5]) };
  const pourAuteur = presenterListeDetail(resume, { ...commun, moi: 1 });
  assert.deepEqual(pourAuteur.coAuteurs.map((c) => [c.personne.pseudo, c.statut]), [["p2", "accepte"], ["p3", "invite"]]);
  assert.deepEqual(pourAuteur.moi, { auteur: true, coAuteur: null, abonne: false, peutRemplir: true });
  const pourInvite = presenterListeDetail(resume, { ...commun, moi: 3, caches: new Set() });
  assert.deepEqual(pourInvite.coAuteurs.map((c) => c.personne.pseudo), ["p2", "p3", "p5"]);
  assert.deepEqual(pourInvite.moi, { auteur: false, coAuteur: "invite", abonne: false, peutRemplir: false });
  const pourAutre = presenterListeDetail(resume, { ...commun, moi: 9, caches: new Set() });
  assert.deepEqual(pourAutre.coAuteurs.map((c) => c.personne.pseudo), ["p2", "p5"]);
});

test("visibilité : « tous » à partir du niveau public, « bande » pour la bande ; 404 avant 403 ; blocage dans les deux sens", async () => {
  const lea = await banc.creerPersonne({ prenom: "Léa" });
  const discrete = await banc.creerPersonne({ prive: true });
  const pote = await banc.creerPersonne();
  const abonne = await banc.creerPersonne();
  const inconnu = await banc.creerPersonne();
  const bloqueur = await banc.creerPersonne();
  banc.rendrePotes(lea, pote);
  banc.rendrePotes(discrete, pote);
  banc.suivre(abonne, discrete);
  banc.suivre(abonne, lea);
  banc.bloquer(bloqueur, lea);
  const tous = (await creer(lea)).corps.liste;
  const bande = (await creer(lea, { titre: "Rien que nous", visibilite: "bande" })).corps.liste;
  const tousPrivee = (await creer(discrete, { titre: "Mes adresses" })).corps.liste;
  assert.deepEqual([tous.moi, tous.visibilite, tous.lieux, tous.coAuteurs], [{ auteur: true, coAuteur: null, abonne: false, peutRemplir: true }, "tous", [], []]);
  assert.deepEqual(await Promise.all([inconnu, pote, abonne].map((p) => voit(p, tous.id))), [true, true, true], "compte public : « tous » pour tout le monde");
  assert.deepEqual(await Promise.all([inconnu, pote, abonne].map((p) => voit(p, bande.id))), [false, true, false], "« bande » : sa bande seulement");
  assert.deepEqual(await Promise.all([inconnu, pote, abonne].map((p) => voit(p, tousPrivee.id))), [false, true, true], "compte privé : « tous » pour ses abonnés et sa bande");
  assert.equal(await voit(bloqueur, tous.id), false, "celui qui a bloqué ne voit plus");
  banc.bloquer(lea, inconnu);
  assert.equal(await voit(inconnu, tous.id), false, "ni celui qui est bloqué");

  for (const [methode, chemin, corps] of [["PATCH", "", { titre: "À moi" }], ["DELETE", "", undefined], ["PUT", `/lieux/${lieu()}`, undefined], ["PUT", "/abonnement", undefined]] as const) {
    const r = await abonne.demander(methode, `/app/listes/${bande.id}${chemin}`, corps);
    assert.deepEqual([r.statut, r.corps.erreur], [404, "liste-inconnue"], `${methode} ${chemin} : liste « bande » d'un autre, jamais 403`);
  }
  const reserve = await pote.demander("PATCH", `/app/listes/${bande.id}`, { titre: "À moi" });
  assert.deepEqual([reserve.statut, reserve.corps.erreur], [403, "reserve-a-l-auteur"]);
  assert.equal((await pote.demander("PUT", `/app/listes/${bande.id}/lieux/${lieu()}`)).statut, 403, "remplir : l'auteur ou un co-auteur accepté");
  assert.equal((await pote.demander("GET", "/app/listes/abc")).corps.champ, "id");
});

test("création, modification, lieux publiés seulement, 100 lieux, 50 listes, Idempotency-Key, suppression", async () => {
  const lea = await banc.creerPersonne();
  assert.equal((await creer(lea, { titre: "Repaire de connards" })).corps.erreur, "message-refuse");
  assert.equal((await creer(lea, { emoji: "pizza" })).corps.champ, "emoji");
  assert.equal((await creer(lea, { visibilite: "amis" })).corps.champ, "visibilite");
  assert.equal((await lea.demander("POST", "/app/listes", { titre: "Sans clé", emoji: "🥞", visibilite: "tous" })).corps.champ, "idClient");
  const idClient = randomUUID();
  const premiere = await creer(lea, { idClient, description: "  Le dimanche, c'est sacré.  " });
  assert.deepEqual([premiere.statut, premiere.corps.liste.description], [201, "Le dimanche, c'est sacré."]);
  const rejouee = await creer(lea, { idClient, titre: "Autre chose" });
  assert.deepEqual([rejouee.statut, rejouee.corps.liste.id, rejouee.corps.liste.titre], [200, premiere.corps.liste.id, "Brunchs du dimanche"], "même clé : la liste déjà créée");
  const id = premiere.corps.liste.id;

  const modifiee = await lea.demander("PATCH", `/app/listes/${id}`, { visibilite: "bande", description: null });
  assert.deepEqual([modifiee.corps.liste.visibilite, modifiee.corps.liste.description, modifiee.corps.liste.titre], ["bande", "", "Brunchs du dimanche"], "seuls les champs envoyés changent");
  assert.equal((await lea.demander("PATCH", `/app/listes/${id}`, { titre: " " })).corps.champ, "titre");

  const [a, b, masque] = [lieu(), lieu(), lieu()];
  banc.horloge.maintenant += 1000;
  await lea.demander("PUT", `/app/listes/${id}/lieux/${a}`);
  banc.horloge.maintenant += 1000;
  await lea.demander("PUT", `/app/listes/${id}/lieux/${b}`);
  await lea.demander("PUT", `/app/listes/${id}/lieux/${b}`);
  const avecMasque = await lea.demander("PUT", `/app/listes/${id}/lieux/${masque}`);
  assert.deepEqual([avecMasque.corps.liste.lieux, avecMasque.corps.liste.nombreLieux], [[masque, b, a], 3], "du plus récent au plus ancien, sans doublon");
  banc.tables.lieux.get(masque)!.statut = "masque";
  const lue = (await lea.demander("GET", `/app/listes/${id}`)).corps.liste;
  assert.deepEqual([lue.lieux, lue.nombreLieux], [[b, a], 2], "un lieu qui n'est plus publié n'est ni montré ni compté");
  assert.equal((await lea.demander("PUT", `/app/listes/${id}/lieux/${lieu("brouillon")}`)).corps.erreur, "lieu-inconnu");
  assert.equal((await lea.demander("DELETE", `/app/listes/${id}/lieux/${a}`)).corps.liste.lieux.length, 1);

  const pleine = (await creer(lea, { titre: "Pleine à craquer" })).corps.liste;
  for (let i = 0; i < 100; i++) banc.tables.lieuxListes.push({ listeId: Number(pleine.id), lieuId: lieu(), ajouteParId: lea.compteId, creeLe: new Date(banc.horloge.maintenant) });
  const deTrop = await lea.demander("PUT", `/app/listes/${pleine.id}/lieux/${lieu()}`);
  assert.deepEqual([deTrop.statut, deTrop.corps.erreur], [409, "liste-pleine"]);

  const services = banc.social.dependances.listes;
  const nouvelle = { titre: "Encore une", emoji: "🍜", description: "", visibilite: "tous" as const };
  let creees = [...banc.tables.listes.values()].filter((l) => l.auteurId === lea.compteId).length;
  while (creees < 50) {
    assert.equal((await services.creer(lea.compteId, nouvelle, randomUUID(), new Date(banc.horloge.maintenant))).ok, true);
    creees += 1;
  }
  assert.deepEqual(await services.creer(lea.compteId, nouvelle, randomUUID(), new Date(banc.horloge.maintenant)), { ok: false, erreur: "trop-de-listes" });

  assert.equal((await lea.demander("DELETE", `/app/listes/${pleine.id}`)).statut, 200);
  assert.equal(banc.tables.lieuxListes.some((l) => l.listeId === Number(pleine.id)), false, "ses lieux partent avec elle");
  assert.equal((await lea.demander("GET", `/app/listes/${pleine.id}`)).statut, 404);
});

test("co-auteurs : un pote de la bande seulement, « liste-coauteur » dans sa cloche, refus gardé 30 jours, lieux des autres protégés", async () => {
  const lea = await banc.creerPersonne({ prenom: "Léa" });
  const tom = await banc.creerPersonne();
  const zoe = await banc.creerPersonne();
  const inconnu = await banc.creerPersonne();
  banc.rendrePotes(lea, tom);
  banc.rendrePotes(lea, zoe);
  const liste = (await creer(lea, { visibilite: "bande" })).corps.liste;
  const horsBande = await lea.demander("POST", `/app/listes/${liste.id}/co-auteurs`, { personne: inconnu.idPublic });
  assert.deepEqual([horsBande.statut, horsBande.corps.erreur], [409, "pas-dans-la-bande"]);
  assert.equal((await lea.demander("POST", `/app/listes/${liste.id}/co-auteurs`, { personne: lea.idPublic })).corps.champ, "personne");
  assert.equal((await tom.demander("POST", `/app/listes/${liste.id}/co-auteurs`, { personne: zoe.idPublic })).statut, 403);

  const invitee = await lea.demander("POST", `/app/listes/${liste.id}/co-auteurs`, { personne: tom.idPublic });
  assert.deepEqual([invitee.statut, invitee.corps.liste.coAuteurs], [201, [{ personne: invitee.corps.liste.coAuteurs[0].personne, statut: "invite" }]]);
  await banc.attendreEnvois();
  assert.deepEqual(clocheDe(tom).map((n) => [n.type, n.acteurId, n.cible, n.cibleId, n.detail]), [["liste-coauteur", lea.compteId, "liste", liste.id, "Brunchs du dimanche"]]);
  assert.deepEqual((await zoe.demander("GET", `/app/listes/${liste.id}`)).corps.liste.coAuteurs, [], "une invitation en attente : pour l'auteur et l'invité seulement");
  assert.deepEqual((await tom.demander("GET", "/app/listes")).corps.invitations.map((l: { id: string }) => l.id), [liste.id]);
  await lea.demander("POST", `/app/listes/${liste.id}/co-auteurs`, { personne: tom.idPublic });
  assert.equal(clocheDe(tom).length, 1, "déjà invité : rien ne repart");

  const acceptee = await tom.demander("POST", `/app/listes/${liste.id}/co-auteurs/moi/accepter`);
  assert.deepEqual([acceptee.statut, acceptee.corps.liste.moi.coAuteur, acceptee.corps.liste.moi.peutRemplir], [200, "accepte", true]);
  assert.equal((await tom.demander("POST", `/app/listes/${liste.id}/co-auteurs/moi/accepter`)).corps.erreur, "invitation-inconnue");
  const deLea = lieu();
  await lea.demander("PUT", `/app/listes/${liste.id}/lieux/${deLea}`);
  const deTom = lieu();
  assert.equal((await tom.demander("PUT", `/app/listes/${liste.id}/lieux/${deTom}`)).statut, 200, "un co-auteur accepté remplit la liste");
  assert.equal((await tom.demander("DELETE", `/app/listes/${liste.id}/lieux/${deLea}`)).corps.erreur, "reserve-a-l-auteur", "il ne retire que ses lieux");
  assert.equal((await tom.demander("DELETE", `/app/listes/${liste.id}/lieux/${deTom}`)).statut, 200);
  assert.deepEqual((await tom.demander("GET", "/app/listes")).corps.coEcrites.map((l: { id: string }) => l.id), [liste.id]);
  assert.equal((await tom.demander("DELETE", `/app/listes/${liste.id}/co-auteurs/moi`)).statut, 200, "ne plus remplir la liste");
  assert.equal((await tom.demander("PUT", `/app/listes/${liste.id}/lieux/${lieu()}`)).statut, 403);

  await lea.demander("POST", `/app/listes/${liste.id}/co-auteurs`, { personne: zoe.idPublic });
  assert.equal((await zoe.demander("DELETE", `/app/listes/${liste.id}/co-auteurs/moi`)).statut, 200, "refuser, sans prévenir");
  assert.deepEqual((await lea.demander("GET", `/app/listes/${liste.id}`)).corps.liste.coAuteurs.map((c: { statut: string }) => c.statut), [], "le refus ne se voit pas");
  const avant = clocheDe(zoe).length;
  const encore = await lea.demander("POST", `/app/listes/${liste.id}/co-auteurs`, { personne: zoe.idPublic });
  assert.equal(encore.statut, 201, "la même réponse…");
  assert.equal(clocheDe(zoe).length, avant, "… mais rien ne part");
  assert.equal(banc.tables.coAuteurs.find((c) => c.compteId === zoe.compteId && c.listeId === Number(liste.id))!.statut, "refuse");
  await lea.demander("DELETE", `/app/listes/${liste.id}/co-auteurs/${zoe.idPublic}`);
  assert.equal(banc.tables.coAuteurs.find((c) => c.compteId === zoe.compteId && c.listeId === Number(liste.id))!.statut, "refuse", "l'auteur n'efface pas un refus");
  banc.horloge.maintenant += 31 * JOUR;
  await lea.demander("POST", `/app/listes/${liste.id}/co-auteurs`, { personne: zoe.idPublic });
  await banc.attendreEnvois();
  assert.equal(clocheDe(zoe).filter((n) => n.type === "liste-coauteur").length, 2, "après 30 jours, l'invitation repart");

  const invites = [];
  for (let i = 0; i < 10; i++) {
    const pote = await banc.creerPersonne();
    banc.rendrePotes(lea, pote);
    invites.push(pote);
  }
  const statuts: number[] = [];
  for (const p of invites) statuts.push((await lea.demander("POST", `/app/listes/${liste.id}/co-auteurs`, { personne: p.idPublic })).statut);
  assert.deepEqual(statuts.slice(-2), [201, 409], "10 co-auteurs au plus, invitations en attente comprises");

  banc.tables.bande.splice(0, banc.tables.bande.length, ...banc.tables.bande.filter((b) => !(b.compteId === zoe.compteId || b.poteId === zoe.compteId)));
  assert.equal((await zoe.demander("POST", `/app/listes/${liste.id}/co-auteurs/moi/accepter`)).corps.erreur, "invitation-inconnue", "plus dans la bande de l'auteur");
});

test("« À découvrir », abonnements, liste signalée cachée pour soi partout, modération, client commun", async () => {
  const moi = await banc.creerPersonne();
  const pote = await banc.creerPersonne();
  const suivie = await banc.creerPersonne({ prive: true });
  const autre = await banc.creerPersonne();
  banc.rendrePotes(moi, pote);
  banc.suivre(moi, suivie);
  const ids: string[] = [];
  for (const [p, visibilite] of [[pote, "bande"], [pote, "tous"], [suivie, "tous"], [suivie, "bande"], [autre, "tous"]] as const) {
    banc.horloge.maintenant += 1000;
    ids.push((await creer(p, { visibilite, titre: `Liste ${ids.length}` })).corps.liste.id);
  }
  const mienne = (await creer(moi)).corps.liste;
  const decouvrir = async (apres?: string) => (await moi.demander("GET", `/app/listes/a-decouvrir${apres ? `?apres=${encodeURIComponent(apres)}` : ""}`)).corps;
  assert.deepEqual((await decouvrir()).listes.map((l: { id: string }) => l.id), [ids[2], ids[1], ids[0]], "ta bande, et les listes « tous » de qui tu suis ; pas les tiennes");
  assert.equal((await moi.demander("GET", "/app/listes/a-decouvrir?apres=%%%")).corps.champ, "apres");

  await moi.demander("PUT", `/app/masques/liste/${ids[1]}`);
  assert.deepEqual((await decouvrir()).listes.map((l: { id: string }) => l.id), [ids[2], ids[0]], "retirée de ta vue");
  const signalement = prendreId(banc.tables, "signalements");
  banc.tables.signalements.set(signalement, { id: signalement, cible: "liste", cibleId: ids[0], signaleParId: moi.compteId } as never);
  assert.deepEqual((await decouvrir()).listes.map((l: { id: string }) => l.id), [ids[2]], "signalée : cachée pour toi");
  assert.equal(await voit(moi, ids[0]!), false, "même en lecture directe");
  assert.deepEqual((await moi.demander("GET", `/app/personnes/${pote.idPublic}/listes`)).corps.listes.map((l: { id: string }) => l.id), [ids[1]], "et sur son profil");

  const suivre = await moi.demander("PUT", `/app/listes/${ids[2]}/abonnement`);
  assert.deepEqual([suivre.statut, suivre.corps.liste.moi.abonne, suivre.corps.liste.abonnes], [200, true, 1]);
  assert.deepEqual((await moi.demander("GET", "/app/listes")).corps.suivies.map((l: { id: string }) => l.id), [ids[2]]);
  assert.equal((await moi.demander("PUT", `/app/listes/${mienne.id}/abonnement`)).statut, 400, "pas sa propre liste");
  assert.equal((await moi.demander("DELETE", `/app/listes/${ids[2]}/abonnement`)).corps.liste.moi.abonne, false);

  banc.tables.listes.get(Number(ids[1]))!.suspendueLe = new Date(banc.horloge.maintenant);
  assert.equal(await voit(moi, ids[1]!), false, "suspendue : plus visible pour les autres");
  const pourAuteur = (await pote.demander("GET", `/app/listes/${ids[1]}`)).corps.liste;
  assert.equal(pourAuteur.enModeration, true, "son auteur la voit, en attente de la modération");

  for (let i = 0; i < 21; i++) {
    banc.horloge.maintenant += 1000;
    const r = await banc.social.dependances.listes.creer(pote.compteId, { titre: `Pagine ${i}`, emoji: "📖", description: "", visibilite: "tous" }, randomUUID(), new Date(banc.horloge.maintenant));
    assert.equal(r.ok, true);
  }
  const page1 = await decouvrir();
  assert.equal(page1.listes.length, 20);
  const page2 = await decouvrir(page1.suite);
  assert.deepEqual([page2.listes.length, page2.suite], [2, null], "21 nouvelles et celle de la personne suivie");
  assert.equal(new Set([...page1.listes, ...page2.listes].map((l: { id: string }) => l.id)).size, page1.listes.length + page2.listes.length, "pas de doublon d'une page à l'autre");

  const appels: string[] = [];
  const faux = (async (adresse: string | URL | Request, init?: RequestInit) => {
    appels.push(`${init?.method ?? "GET"} ${String(adresse).replace("https://api.exemple.fr", "")} ${(init?.headers as Record<string, string>)["Idempotency-Key"] ?? ""}`.trim());
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } });
  }) as typeof fetch;
  const api = creerListesApi(creerClientHttp({ adresse: "https://api.exemple.fr", lireJeton: () => "jeton", fetch: faux }));
  await api.creer({ titre: "Brunchs", emoji: "🥞", description: "", visibilite: "tous" }, "22222222-2222-4222-8222-222222222222");
  await api.listerADecouvrir("abc");
  await api.basculerLieu("4", 9, true);
  await api.retirerCoAuteur("4", "moi");
  await api.suivre("4", false);
  assert.deepEqual(appels, [
    "POST /app/listes 22222222-2222-4222-8222-222222222222", "GET /app/listes/a-decouvrir?apres=abc", "PUT /app/listes/4/lieux/9",
    "DELETE /app/listes/4/co-auteurs/moi", "DELETE /app/listes/4/abonnement",
  ]);
});

test("version Prisma : inviter un co-auteur verrouille d'abord les deux comptes (FOR NO KEY UPDATE), puis la liste, puis relit la bande et les blocages", async () => {
  process.env.DATABASE_URL ??= "postgresql://essai@127.0.0.1:1/essai";
  const { creerListes } = await import("../src/services/listes.ts");
  const appels: string[] = [];
  const noter = <T>(nom: string, valeur: T) => async () => (appels.push(nom), valeur);
  const liste = {
    id: 4, auteurId: 1, titre: "Brunchs", emoji: "🥞", description: "", visibilite: "bande", modifieLe: new Date("2026-10-14T10:00:00Z"),
    suspendueLe: null, retireeLe: null, _count: { lieux: 0, abonnes: 0 }, lieux: [], coAuteurs: [], abonnes: [],
  };
  const tx = {
    $queryRaw: async (morceaux: readonly string[]) => (appels.push(morceaux.join("?").replace(/\s+/g, " ").trim()), []),
    listeLieux: { findUnique: async () => liste },
    membreBande: { count: noter("membreBande.count", 1) },
    coAuteurListe: { findUnique: noter("coAuteurListe.findUnique", null), count: noter("coAuteurListe.count", 0), upsert: noter("coAuteurListe.upsert", { listeId: 4 }) },
  };
  const base = { ...tx, $transaction: async (f: (t: typeof tx) => Promise<unknown>) => f(tx) };
  const relations = {
    bloqueEntre: async (_a: number, _b: number, dans?: unknown) => (appels.push(dans === tx ? "bloqueEntre(tx)" : "bloqueEntre(base)"), false),
    presenter: async () => new Map(),
    listerBlocages: async () => ({ parMoi: [], contreMoi: [], caches: new Set<number>() }),
  };
  await creerListes({ relations: relations as never, base: base as never }).inviterCoAuteur(1, 4, 2, new Date("2026-10-14T11:00:00Z"));
  assert.deepEqual(appels.slice(0, 7), [
    "SELECT id FROM comptes WHERE id IN (?) ORDER BY id FOR NO KEY UPDATE", "SELECT id FROM listes_lieux WHERE id = ? FOR UPDATE", "membreBande.count",
    "bloqueEntre(tx)", "coAuteurListe.findUnique", "coAuteurListe.count", "coAuteurListe.upsert",
  ]);
});
