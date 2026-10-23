import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";

import type { GifApi } from "../../../packages/commun/src/types/messagerie.ts";
import { choisirRenduGif } from "../src/fonctions/gif/choisir-rendu-gif.ts";
import { lireAdresseGifPermise } from "../src/fonctions/gif/lire-adresse-gif-permise.ts";
import { lireGifMessage } from "../src/fonctions/social/lire-gif-message.ts";
import { chargerCleGiphy, creerClientGiphy, DUREE_CACHE_GIF_MS, type ClientGif, type GifLu } from "../src/services/giphy.ts";
import type { LimitationActive } from "../src/services/limitations-comptes-regles.ts";
import { LIMITE_GIF } from "../src/routes/gif.ts";
import { creerBancSocial, type PersonneDeTest } from "./outils/creer-banc-social.ts";

const CLE = "CleDeTestGiphy0123456789abcdefXY";

const brut = (id: string, o: { rating?: string; hote?: string; sansDownsampled?: boolean; sansWebp?: boolean } = {}) => ({
  id, rating: o.rating ?? "g", title: "Un chat", username: "quelqu-un", source: "https://exemple.fr/source", url: `https://giphy.com/gifs/${id}`,
  images: {
    original: { url: `https://media.giphy.com/media/${id}/giphy.gif`, width: "480", height: "270" },
    ...(o.sansDownsampled ? {} : {
      fixed_width_downsampled: {
        url: `https://${o.hote ?? "media2.giphy.com"}/media/${id}/200w_d.gif?cid=abc`, width: "200", height: "113",
        ...(o.sansWebp ? {} : { webp: `https://${o.hote ?? "media2.giphy.com"}/media/${id}/200w_d.webp?cid=abc` }),
      },
    }),
    fixed_width: { url: `https://i.giphy.com/media/${id}/200w.gif`, width: "200", height: "113", mp4: `https://media.giphy.com/media/${id}/200w.mp4` },
  },
});

test("adresses permises : https seulement, chez media.giphy.com, mediaN.giphy.com ou i.giphy.com", () => {
  assert.equal(lireAdresseGifPermise("https://media2.giphy.com/media/x/200w_d.webp?cid=1"), "https://media2.giphy.com/media/x/200w_d.webp?cid=1");
  for (const bonne of ["https://media.giphy.com/a.gif", "https://i.giphy.com/a.gif", "https://media0.giphy.com/a.gif"]) assert.ok(lireAdresseGifPermise(bonne), bonne);
  for (const mauvaise of [
    "http://media.giphy.com/a.gif", "https://media12.giphy.com/a.gif", "https://giphy.com/a.gif", "https://media.giphy.com.exemple.fr/a.gif",
    "https://evil.fr/media.giphy.com/a.gif", "https://media.giphy.com:8443/a.gif", "https://moi:secret@media.giphy.com/a.gif", "javascript:alert(1)",
    `https://media.giphy.com/${"x".repeat(400)}`, 42, null,
  ]) assert.equal(lireAdresseGifPermise(mauvaise), null, String(mauvaise));
});

test("rendu choisi : le petit animé (webp, sinon gif), ses côtés en nombres ; rien d'autre de GIPHY ne passe", () => {
  assert.deepEqual(choisirRenduGif(brut("abcDEF123")), { id: "abcDEF123", url: "https://media2.giphy.com/media/abcDEF123/200w_d.webp?cid=abc", largeur: 200, hauteur: 113 });
  assert.equal(choisirRenduGif(brut("abcDEF123", { sansWebp: true }))!.url, "https://media2.giphy.com/media/abcDEF123/200w_d.gif?cid=abc");
  assert.equal(choisirRenduGif(brut("abcDEF123", { sansDownsampled: true }))!.url, "https://i.giphy.com/media/abcDEF123/200w.gif");
  assert.equal(choisirRenduGif(brut("abcDEF123", { hote: "pirate.fr" }))!.url, "https://i.giphy.com/media/abcDEF123/200w.gif", "un hôte inconnu : le rendu suivant");
  assert.equal(choisirRenduGif({ ...brut("abc-12"), id: "abc-12" }), null);
  assert.equal(choisirRenduGif({ id: "abcDEF123", images: { fixed_width: { url: "https://i.giphy.com/a.gif", width: "0", height: "10" } } }), null);
  assert.equal(choisirRenduGif("abcDEF123"), null);
  assert.deepEqual(Object.keys(choisirRenduGif(brut("abcDEF123"))!).sort(), ["hauteur", "id", "largeur", "url"]);
  assert.deepEqual(lireGifMessage(JSON.stringify({ i: "abcDEF123", u: "https://i.giphy.com/a.gif", l: 200, h: 100 })), { id: "abcDEF123", url: "https://i.giphy.com/a.gif", largeur: 200, hauteur: 100 });
  assert.equal(lireGifMessage(JSON.stringify({ i: "abcDEF123", u: "https://evil.fr/a.gif", l: 200, h: 100 })), null);
  assert.equal(lireGifMessage("pas du json"), null);
});

function fauxGiphy(reponses: (url: URL) => { statut?: number; corps?: unknown } | "panne") {
  const appels: URL[] = [];
  const faux = (async (adresse: string | URL, init?: RequestInit) => {
    const url = new URL(String(adresse));
    appels.push(url);
    assert.ok(init?.signal, "toujours un délai");
    const r = reponses(url);
    if (r === "panne") throw new Error(`fetch failed ${url.href}`);
    return new Response(JSON.stringify(r.corps ?? {}), { status: r.statut ?? 200, headers: { "Content-Type": "application/json" } });
  }) as typeof fetch;
  return { faux, appels };
}

test("client GIPHY : nos paramètres (24 par page, PG-13, français), seulement { id, url, largeur, hauteur }, sans les GIF classés R", async () => {
  const { faux, appels } = fauxGiphy((url) => ({ corps: { data: [brut(`chat${url.searchParams.get("offset")}A`), brut("mechantR1", { rating: "r" }), brut("chat0A0")] } }));
  const client = creerClientGiphy({ cle: CLE, fetch: faux });
  const page = await client.chercher("chat qui danse", 2);
  assert.deepEqual(page, [{ id: "chat48A", url: "https://media2.giphy.com/media/chat48A/200w_d.webp?cid=abc", largeur: 200, hauteur: 113 }, {
    id: "chat0A0", url: "https://media2.giphy.com/media/chat0A0/200w_d.webp?cid=abc", largeur: 200, hauteur: 113,
  }]);
  const [appel] = appels;
  assert.equal(`${appel!.origin}${appel!.pathname}`, "https://api.giphy.com/v1/gifs/search");
  assert.deepEqual(Object.fromEntries(appel!.searchParams), { api_key: CLE, q: "chat qui danse", limit: "24", offset: "48", rating: "pg-13", bundle: "messaging_non_clips", lang: "fr" });
  await client.tendances(0);
  assert.equal(appels[1]!.pathname, "/v1/gifs/trending");
  assert.deepEqual(Object.fromEntries(appels[1]!.searchParams), { api_key: CLE, limit: "24", offset: "0", rating: "pg-13", bundle: "messaging_non_clips" });
});

test("client GIPHY : chaque page gardée 10 min, 200 pages au plus ; une recherche en cours n'est pas demandée deux fois", async () => {
  let maintenant = 0;
  const { faux, appels } = fauxGiphy(() => ({ corps: { data: [brut("chatAAA1")] } }));
  const client = creerClientGiphy({ cle: CLE, fetch: faux, horloge: () => maintenant, appelsParHeure: 10_000 });
  await Promise.all([client.chercher("pizza", 0), client.chercher("pizza", 0)]);
  await client.chercher("pizza", 0);
  assert.equal(appels.length, 1);
  await client.chercher("pizza", 1);
  await client.tendances(0);
  assert.equal(appels.length, 3, "une autre page, une autre route : une autre demande");
  maintenant += DUREE_CACHE_GIF_MS;
  await client.chercher("pizza", 0);
  assert.equal(appels.length, 4, "après 10 min, on redemande");
  for (let i = 0; i < 200; i++) await client.chercher(`mot${i}`, 0);
  const avant = appels.length;
  await client.chercher("pizza", 0);
  assert.equal(appels.length, avant + 1, "la plus ancienne est sortie de la mémoire");
});

test("client GIPHY : en panne, trop lent ou au plafond de l'heure → indisponible ; jamais la clé au journal", async (t) => {
  const journal = t.mock.method(console, "error", () => {});
  const panne = creerClientGiphy({ cle: CLE, fetch: fauxGiphy(() => "panne").faux });
  assert.equal(await panne.chercher("pizza", 0), "indisponible");
  assert.equal(await panne.lire("abcDEF123"), "indisponible");
  const erreur = creerClientGiphy({ cle: CLE, fetch: fauxGiphy(() => ({ statut: 429, corps: { message: `quota ${CLE}` } })).faux });
  assert.equal(await erreur.tendances(0), "indisponible");
  const lent = creerClientGiphy({
    cle: CLE,
    fetch: (async (_a: string | URL, init?: RequestInit) => {
      await new Promise((_, refuser) => init!.signal!.addEventListener("abort", () => refuser(init!.signal!.reason)));
      return new Response("{}");
    }) as typeof fetch,
  });
  const debut = Date.now();
  assert.equal(await lent.tendances(0), "indisponible");
  assert.ok(Date.now() - debut < 6_000, "4 s au plus");
  const { faux, appels } = fauxGiphy(() => ({ corps: { data: [] } }));
  const compte = creerClientGiphy({ cle: CLE, fetch: faux, appelsParHeure: 2 });
  await compte.chercher("a", 0);
  await compte.chercher("b", 0);
  assert.equal(await compte.chercher("c", 0), "indisponible");
  assert.equal(appels.length, 2, "le plafond de la clé de test est tenu sans demander");
  const parCompte = fauxGiphy(() => ({ corps: { data: [] } }));
  let heure = 0;
  const partage = creerClientGiphy({ cle: CLE, fetch: parCompte.faux, horloge: () => heure, appelsParHeure: 10, appelsParCompteParHeure: 2 });
  await partage.chercher("a", 0, 7);
  await partage.chercher("b", 0, 7);
  assert.equal(await partage.chercher("c", 0, 7), "indisponible", "un compte ne prend pas tout le quota de la clé");
  assert.deepEqual(await partage.chercher("a", 0, 7), [], "ce qui est déjà en cache reste servi");
  assert.deepEqual(await partage.chercher("c", 0, 8), [], "les autres comptes cherchent toujours");
  heure += 60 * 60_000 + 1;
  assert.deepEqual(await partage.chercher("d", 0, 7), [], "une heure après, il peut de nouveau");
  assert.equal(parCompte.appels.length, 4);
  const ecrit = JSON.stringify(journal.mock.calls.map((c) => c.arguments));
  assert.ok(journal.mock.callCount() >= 3);
  assert.ok(!ecrit.includes(CLE) && !ecrit.includes("api_key"), "jamais la clé");
});

test("client GIPHY : un GIF relu par son id (classé G, PG ou PG-13), ou déjà vu dans une page ; sinon refusé ou inconnu", async () => {
  const { faux, appels } = fauxGiphy((url) => {
    const id = url.pathname.split("/").at(-1)!;
    if (id === "inconnu123") return { statut: 404, corps: { meta: { status: 404 } } };
    if (id === "videVide1") return { corps: { data: [] } };
    if (id === "trending" || id === "search") return { corps: { data: [brut("dejaVu123")] } };
    return { corps: { data: brut(id, { rating: id.startsWith("r") ? "r" : "pg-13" }) } };
  });
  const client = creerClientGiphy({ cle: CLE, fetch: faux });
  assert.deepEqual(await client.lire("chatPG13x"), { id: "chatPG13x", url: "https://media2.giphy.com/media/chatPG13x/200w_d.webp?cid=abc", largeur: 200, hauteur: 113 });
  assert.equal(appels.at(-1)!.pathname, "/v1/gifs/chatPG13x");
  assert.equal(await client.lire("rTropFort1"), "refuse");
  assert.equal(await client.lire("inconnu123"), "inconnu");
  assert.equal(await client.lire("videVide1"), "inconnu");
  assert.equal(await client.lire("pas-un-id"), "inconnu");
  await client.tendances(0);
  const avant = appels.length;
  assert.equal(((await client.lire("dejaVu123")) as GifApi).id, "dejaVu123");
  assert.equal(appels.length, avant, "vu dans une page : pas de nouvelle demande");
});

test("clé GIPHY : lue une fois dans son fichier, sans les blancs autour ; absente ou mal formée : pas de GIF", () => {
  const dossier = mkdtempSync(join(tmpdir(), "sos-miam-giphy-essai-"));
  try {
    writeFileSync(join(dossier, "bonne.txt"), `  ${CLE}\n`);
    writeFileSync(join(dossier, "mauvaise.txt"), "cle avec des espaces\n");
    assert.equal(chargerCleGiphy(join(dossier, "bonne.txt")), CLE);
    assert.equal(chargerCleGiphy(join(dossier, "mauvaise.txt")), null);
    assert.equal(chargerCleGiphy(join(dossier, "absente.txt")), null);
  } finally {
    rmSync(dossier, { recursive: true, force: true });
  }
});

const GIFS: Record<string, GifLu> = {
  chatDrole1: { id: "chatDrole1", url: "https://media2.giphy.com/media/chatDrole1/200w_d.webp", largeur: 200, hauteur: 150 },
  tropFort1: "refuse",
  disparu123: "inconnu",
};
const lus: string[] = [];
const fauxClient: ClientGif = {
  tendances: async (page) => [{ id: `tendance${page}A`, url: "https://i.giphy.com/a.gif", largeur: 200, hauteur: 100 }],
  chercher: async (q, page) => (q === "panne" ? "indisponible" : [{ id: `recherche${page}A`, url: "https://i.giphy.com/b.gif", largeur: 200, hauteur: 100 }]),
  lire: async (id) => {
    lus.push(id);
    return GIFS[id] ?? "indisponible";
  },
};
const limites = new Map<number, LimitationActive>();
let banc: Awaited<ReturnType<typeof creerBancSocial>>;
let sansGif: Awaited<ReturnType<typeof creerBancSocial>>;
before(async () => {
  banc = await creerBancSocial({ gif: fauxClient, estLimite: async (compteId) => limites.get(compteId) ?? null });
  sansGif = await creerBancSocial();
});
after(async () => {
  await banc.fermer();
  await sansGif.fermer();
});

async function prive() {
  const a = await banc.creerPersonne({ prenom: "Léa" });
  const b = await banc.creerPersonne();
  banc.rendrePotes(a, b);
  return { a, b, id: (await a.demander("POST", "/app/conversations/prive", { personne: b.idPublic })).corps.conversation.id as string };
}
const envoyerGif = (p: PersonneDeTest, id: string, gifId: unknown, idClient: string = randomUUID()) =>
  p.demander("POST", `/app/conversations/${id}/messages`, { idClient, type: "gif", gifId });

test("routes /app/gif : session, pages de 24 par notre serveur, champs vérifiés, 30 par minute ; sans clé, 503 gif-indisponible", async () => {
  const p = await banc.creerPersonne();
  assert.equal((await banc.demander("GET", "/app/gif/tendances")).statut, 401);
  const tendances = await p.demander("GET", "/app/gif/tendances");
  assert.deepEqual([tendances.statut, tendances.corps.gifs[0].id, tendances.entetes.get("cache-control")], [200, "tendance0A", "private, no-store"]);
  assert.equal((await p.demander("GET", "/app/gif/tendances?page=3")).corps.gifs[0].id, "tendance3A");
  assert.equal((await p.demander("GET", "/app/gif/recherche?q=%20pizza%20&page=1")).corps.gifs[0].id, "recherche1A");
  for (const adresse of ["/app/gif/tendances?page=41", "/app/gif/tendances?page=-1", "/app/gif/tendances?page=abc", "/app/gif/recherche?q=pizza&page=1.5"]) {
    assert.equal((await p.demander("GET", adresse)).corps.champ, "page", adresse);
  }
  for (const q of ["", "%20%20", "x".repeat(51)]) assert.equal((await p.demander("GET", `/app/gif/recherche?q=${q}`)).corps.champ, "q", q);
  assert.equal((await p.demander("GET", "/app/gif/recherche")).corps.champ, "q");
  const panne = await p.demander("GET", "/app/gif/recherche?q=panne");
  assert.deepEqual([panne.statut, panne.corps], [503, { ok: false, erreur: "gif-indisponible" }]);
  const q = await sansGif.creerPersonne();
  assert.deepEqual([(await q.demander("GET", "/app/gif/tendances")).statut, (await q.demander("GET", "/app/gif/tendances")).corps.erreur], [503, "gif-indisponible"]);
  const presse = await banc.creerPersonne();
  const statuts: number[] = [];
  for (let i = 0; i < LIMITE_GIF.maximum + 1; i++) statuts.push((await presse.demander("GET", `/app/gif/recherche?q=chat${i}`)).statut);
  assert.deepEqual([statuts.filter((s) => s === 200).length, statuts.at(-1)], [LIMITE_GIF.maximum, 429]);
});

test("message GIF : relu par le serveur, gardé chiffré, présenté { id, url, largeur, hauteur } ; notification sans rien du GIF", async () => {
  const { a, b, id } = await prive();
  banc.social.pushs.length = 0;
  lus.length = 0;
  const r = await envoyerGif(a, id, "chatDrole1");
  assert.equal(r.statut, 201, JSON.stringify(r.corps));
  assert.deepEqual([r.corps.message.type, r.corps.message.texte, r.corps.message.gif], ["gif", null, GIFS.chatDrole1]);
  const ligne = banc.tables.messages.get(Number(r.corps.message.id))!;
  assert.ok(ligne.texteChiffre && !ligne.texteChiffre.includes("giphy") && !ligne.texteChiffre.includes("chatDrole1"), "chiffré, comme un lieu");
  assert.deepEqual(JSON.parse(banc.social.dependances.chiffrement!.dechiffrerMessage(ligne.texteChiffre, ligne.conversationId, ligne.idClient)), {
    i: "chatDrole1", u: "https://media2.giphy.com/media/chatDrole1/200w_d.webp", l: 200, h: 150,
  });
  await banc.attendreEnvois();
  assert.deepEqual(banc.social.pushs.map((p) => [p.compteId, p.message.texte]), [[b.compteId, "T'a envoyé un GIF."]]);
  const vu = (await b.demander("GET", `/app/conversations/${id}`)).corps.fil.messages.at(-1);
  assert.deepEqual(vu.gif, GIFS.chatDrole1);
  const rejoue = await envoyerGif(a, id, "chatDrole1", ligne.idClient);
  assert.deepEqual([rejoue.statut, rejoue.corps.message.id, lus], [200, r.corps.message.id, ["chatDrole1"]], "rejoué : GIPHY n'est pas redemandé");
  const export_ = (await a.demander("GET", "/app/social/export")).corps.export;
  const exporte = export_.conversations.find((c: { id: string }) => c.id === id).messages.find((m: { type: string }) => m.type === "gif");
  assert.deepEqual(exporte.gif, { id: "chatDrole1", url: GIFS.chatDrole1 && (GIFS.chatDrole1 as GifApi).url });
  const signale = await b.demander("POST", "/app/signalements", { cible: "message", cibleId: r.corps.message.id, raison: "haine", precision: null, explication: "" });
  assert.equal(signale.statut, 201, JSON.stringify(signale.corps));
  const s = [...banc.tables.signalements.values()].find((x) => x.cible === "message" && x.cibleId === r.corps.message.id)!;
  const instantane = JSON.parse(banc.social.dependances.chiffrement!.dechiffrerInstantane(s.instantaneChiffre!, s.id));
  assert.deepEqual([instantane.type, instantane.texte, instantane.gif, instantane.media, s.fichierMedia], ["gif", null, { id: "chatDrole1", url: (GIFS.chatDrole1 as GifApi).url }, null, null]);
});

test("message GIF : classé trop fort 400 gif-refuse, inconnu 404, GIPHY absent 503 ; id mal formé 400 ; refusé à un compte limité", async () => {
  const { a, b, id } = await prive();
  assert.deepEqual([(await envoyerGif(a, id, "tropFort1")).statut, (await envoyerGif(a, id, "tropFort1")).corps.erreur], [400, "gif-refuse"]);
  assert.deepEqual([(await envoyerGif(a, id, "disparu123")).statut, (await envoyerGif(a, id, "disparu123")).corps.erreur], [404, "gif-inconnu"]);
  assert.deepEqual([(await envoyerGif(a, id, "enPanne123")).statut, (await envoyerGif(a, id, "enPanne123")).corps.erreur], [503, "gif-indisponible"]);
  for (const gifId of ["abc", "abc-def-12", "x".repeat(41), 123456, null]) assert.equal((await envoyerGif(a, id, gifId)).corps.champ, "gifId", String(gifId));
  assert.equal([...banc.tables.messages.values()].filter((m) => m.conversationId === Number(id)).length, 0, "rien d'écrit");
  limites.set(b.compteId, { jusqua: null, motif: "spam" });
  try {
    assert.deepEqual([(await envoyerGif(b, id, "chatDrole1")).statut, (await envoyerGif(b, id, "chatDrole1")).corps.erreur], [403, "compte-limite"]);
  } finally {
    limites.delete(b.compteId);
  }
  const autre = await sansGif.creerPersonne();
  const pote = await sansGif.creerPersonne();
  sansGif.rendrePotes(autre, pote);
  const conversation = (await autre.demander("POST", "/app/conversations/prive", { personne: pote.idPublic })).corps.conversation.id;
  const sans = await autre.demander("POST", `/app/conversations/${conversation}/messages`, { idClient: randomUUID(), type: "gif", gifId: "chatDrole1" });
  assert.deepEqual([sans.statut, sans.corps.erreur], [503, "gif-indisponible"]);
});
