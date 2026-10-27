import assert from "node:assert/strict";
import { test } from "node:test";

const { calculerCadreRecadrage, ZOOM_MAX_RECADRAGE } = await import("../src/fonctions/pro/calculer-cadre-recadrage.ts");
const { deplacerReglageRecadrage } = await import("../src/fonctions/pro/deplacer-reglage-recadrage.ts");
const { recentrerCadre } = await import("../src/fonctions/pro/recentrer-cadre.ts");
const { detecterImageAgrandie } = await import("../src/fonctions/pro/detecter-image-agrandie.ts");
const { compresserSousLimite, QUALITES_JPEG_IMAGE_LIEU } = await import("../src/fonctions/pro/compresser-sous-limite.ts");
const { reconnaitreFormatImage } = await import("../src/fonctions/pro/reconnaitre-format-image.ts");
const { choisirMessageImageLieu } = await import("../src/fonctions/pro/choisir-message-image-lieu.ts");
const { appelerRouteImageLieu } = await import("../src/fonctions/pro/appeler-route-image-lieu.ts");
const { transmettreImageLieu, MARGE_CORPS_IMAGE_LIEU } = await import("../src/services/images-lieu-pro.server.ts");
const { choisirRedirectionHote } = await import("../src/fonctions/hotes/choisir-redirection-hote.ts");
const { TEXTES_IMAGES_LIEU } = await import("../src/contenus/pro-images-lieu.ts");
const { BANNIERE_LIEU, LOGO_LIEU } = await import("../../../packages/commun/src/regles/images-lieu.ts");
const { MESSAGES_SERVICE } = await import("../../../packages/commun/src/contenus/messages-services.ts");

const CENTRE = { zoom: 1, x: 0.5, y: 0.5 };
const ADRESSE = "/app/lieux/images/0f8fad5b-d9cb-469f-a165-70867728950e.jpg";
const JETON = "j".repeat(43);
const API = "http://api.essai";

const arrondir = (cadre: { x: number; y: number; largeur: number; hauteur: number }) =>
  Object.fromEntries(Object.entries(cadre).map(([cle, valeur]) => [cle, Math.round(valeur * 100) / 100]));

test("recadrage centré : la plus grande zone au bon rapport, au milieu de l'image", () => {
  assert.deepEqual(calculerCadreRecadrage({ largeur: 3200, hauteur: 2000 }, BANNIERE_LIEU, CENTRE), { x: 0, y: 500, largeur: 3200, hauteur: 1000 });
  assert.deepEqual(calculerCadreRecadrage({ largeur: 4000, hauteur: 500 }, BANNIERE_LIEU, CENTRE), { x: 1200, y: 0, largeur: 1600, hauteur: 500 });
  assert.deepEqual(calculerCadreRecadrage({ largeur: 1000, hauteur: 600 }, LOGO_LIEU, CENTRE), { x: 200, y: 0, largeur: 600, hauteur: 600 });
  assert.deepEqual(calculerCadreRecadrage({ largeur: 1000, hauteur: 600 }, LOGO_LIEU, { zoom: 2, x: 0.5, y: 0.5 }), { x: 350, y: 150, largeur: 300, hauteur: 300 });
  assert.deepEqual(calculerCadreRecadrage({ largeur: 1000, hauteur: 600 }, LOGO_LIEU, { zoom: 1, x: 0, y: 1 }), { x: 0, y: 0, largeur: 600, hauteur: 600 });
  assert.deepEqual(calculerCadreRecadrage({ largeur: 1000, hauteur: 600 }, LOGO_LIEU, { zoom: 1, x: 1, y: 0 }), { x: 400, y: 0, largeur: 600, hauteur: 600 });
});

test("recadrage : zoom et position bornés, valeurs folles ramenées au centre", () => {
  const source = { largeur: 1000, hauteur: 1000 };
  assert.equal(ZOOM_MAX_RECADRAGE, 4);
  assert.equal(calculerCadreRecadrage(source, LOGO_LIEU, { zoom: 40, x: 0.5, y: 0.5 }).largeur, 250);
  assert.equal(calculerCadreRecadrage(source, LOGO_LIEU, { zoom: 0.1, x: 0.5, y: 0.5 }).largeur, 1000);
  assert.deepEqual(calculerCadreRecadrage(source, LOGO_LIEU, { zoom: Number.NaN, x: 7, y: -3 }), { x: 0, y: 0, largeur: 1000, hauteur: 1000 });
  assert.deepEqual(calculerCadreRecadrage(source, LOGO_LIEU, { zoom: 2, x: Number.NaN, y: Number.POSITIVE_INFINITY }), { x: 250, y: 250, largeur: 500, hauteur: 500 });
});

test("faire glisser : le cadre suit le geste sans sortir de l'image ; un axe sans jeu reste au centre", () => {
  const source = { largeur: 3200, hauteur: 2000 };
  assert.deepEqual(deplacerReglageRecadrage(source, BANNIERE_LIEU, CENTRE, { x: 0, y: 100 }), { zoom: 1, x: 0.5, y: 0.6 });
  assert.deepEqual(deplacerReglageRecadrage(source, BANNIERE_LIEU, CENTRE, { x: 500, y: 9999 }), { zoom: 1, x: 0.5, y: 1 });
  assert.deepEqual(deplacerReglageRecadrage(source, BANNIERE_LIEU, CENTRE, { x: 0, y: -9999 }), { zoom: 1, x: 0.5, y: 0 });
  const zoome = deplacerReglageRecadrage(source, BANNIERE_LIEU, { zoom: 2, x: 0.5, y: 0.5 }, { x: -400, y: 0 });
  assert.equal(zoome.zoom, 2);
  assert.equal(zoome.x, 0.25);
  assert.equal(zoome.y, 0.5);
});

test("aperçu téléphone : le cadre est recoupé au centre (bords coupés), sans sortir de lui", () => {
  const cadre = { x: 0, y: 0, largeur: 1600, hauteur: 500 };
  const telephone = recentrerCadre(cadre, 390 / 176);
  assert.deepEqual(arrondir(telephone), { x: 246.02, y: 0, largeur: 1107.95, hauteur: 500 });
  assert.deepEqual(recentrerCadre({ x: 10, y: 20, largeur: 100, hauteur: 100 }, 2), { x: 10, y: 45, largeur: 100, hauteur: 50 });
});

test("image trop petite pour le cadre : agrandie, donc l'avertissement « un peu floue »", () => {
  assert.equal(detecterImageAgrandie({ x: 0, y: 0, largeur: 1280, hauteur: 400 }, BANNIERE_LIEU), true);
  assert.equal(detecterImageAgrandie({ x: 0, y: 0, largeur: 1600, hauteur: 500 }, BANNIERE_LIEU), false);
  assert.equal(detecterImageAgrandie({ x: 0, y: 0, largeur: 1599.8, hauteur: 499.94 }, BANNIERE_LIEU), false);
  assert.equal(detecterImageAgrandie({ x: 0, y: 0, largeur: 400, hauteur: 400 }, LOGO_LIEU), true);
  assert.equal(detecterImageAgrandie({ x: 0, y: 0, largeur: 2000, hauteur: 2000 }, LOGO_LIEU), false);
});

test("JPEG : la qualité baisse par paliers de 0,9 à 0,6 jusqu'à tenir sous la limite", async () => {
  assert.equal(QUALITES_JPEG_IMAGE_LIEU[0], 0.9);
  assert.equal(QUALITES_JPEG_IMAGE_LIEU.at(-1), 0.6);
  assert.ok(QUALITES_JPEG_IMAGE_LIEU.every((qualite: number, rang: number) => rang === 0 || qualite < QUALITES_JPEG_IMAGE_LIEU[rang - 1]));
  const essais: number[] = [];
  const encoder = async (qualite: number) => (essais.push(qualite), new Blob([new Uint8Array(Math.round(qualite * 1000))]));
  const reussite = await compresserSousLimite(encoder, 750);
  assert.equal(reussite.ok, true);
  assert.equal(reussite.qualite, 0.75);
  assert.equal(reussite.image.size, 750);
  assert.deepEqual(essais, [0.9, 0.85, 0.8, 0.75]);
  assert.deepEqual(await compresserSousLimite(encoder, 100), { ok: false, erreur: "trop-lourde" });
  assert.deepEqual(await compresserSousLimite(async () => null, 100), { ok: false, erreur: "encodage" });
  const png = await compresserSousLimite(async () => new Blob([new Uint8Array(10)]), LOGO_LIEU.poidsMax, [1]);
  assert.equal(png.ok && png.qualite, 1);
});

test("formats acceptés au départ : JPEG, PNG et WebP reconnus à leurs premiers octets", () => {
  assert.equal(reconnaitreFormatImage(new Uint8Array([0xff, 0xd8, 0xff, 0xe0])), "image/jpeg");
  assert.equal(reconnaitreFormatImage(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), "image/png");
  assert.equal(reconnaitreFormatImage(new TextEncoder().encode("RIFF\u0000\u0000\u0000\u0000WEBPVP8 ")), "image/webp");
  assert.equal(reconnaitreFormatImage(new TextEncoder().encode("RIFF\u0000\u0000\u0000\u0000WAVEfmt ")), null);
  assert.equal(reconnaitreFormatImage(new TextEncoder().encode("GIF89a")), null);
  assert.equal(reconnaitreFormatImage(new TextEncoder().encode("<svg xmlns")), null);
  assert.equal(reconnaitreFormatImage(new Uint8Array()), null);
});

test("messages : les codes de l'API dits avec les textes de packages/commun ou de la page", () => {
  const trop = choisirMessageImageLieu("image-lieu-trop-lourde");
  assert.equal(trop.titre, MESSAGES_SERVICE["image-lieu-trop-lourde"].titre);
  assert.equal(choisirMessageImageLieu("stockage-plein").texte, TEXTES_IMAGES_LIEU.erreurs.stockagePlein.texte);
  assert.equal(choisirMessageImageLieu("trop-de-demandes").titre, MESSAGES_SERVICE["trop-de-demandes"].titre);
  assert.deepEqual(choisirMessageImageLieu("session-expiree"), TEXTES_IMAGES_LIEU.erreurs.session);
  assert.deepEqual(choisirMessageImageLieu("reserve-au-gerant"), TEXTES_IMAGES_LIEU.erreurs.reserveAuGerant);
  assert.deepEqual(choisirMessageImageLieu("role-requis"), TEXTES_IMAGES_LIEU.erreurs.reserveAuGerant);
  assert.deepEqual(choisirMessageImageLieu("hors-ligne"), TEXTES_IMAGES_LIEU.erreurs.reseau);
  assert.match(choisirMessageImageLieu("compte-limite", "2026-11-02T11:00:00Z").texte, /limité jusqu'au 2 novembre 2026/);
  for (const inconnu of ["code-inconnu", "__proto__", "constructor", ""]) {
    assert.equal(choisirMessageImageLieu(inconnu).titre, MESSAGES_SERVICE["erreur-serveur"].titre, inconnu);
  }
});

type Appel = { adresse: string; init: RequestInit };
function fauxFetch(reponse: Response | (() => Response) | Error) {
  const appels: Appel[] = [];
  const appeler = async (adresse: string, init: RequestInit) => {
    appels.push({ adresse, init });
    if (reponse instanceof Error) throw reponse;
    return typeof reponse === "function" ? reponse() : reponse;
  };
  return { appels, appeler: appeler as unknown as typeof fetch };
}

test("navigateur : PUT avec le bon type et l'image, DELETE sans corps ; réponses lues sans confiance", async () => {
  const image = new Blob([new Uint8Array([0xff, 0xd8, 0xff])], { type: "image/jpeg" });
  const envoi = fauxFetch(Response.json({ ok: true, adresse: ADRESSE }));
  assert.deepEqual(await appelerRouteImageLieu(12, "banniere", image, envoi.appeler), { ok: true, adresse: ADRESSE });
  assert.equal(envoi.appels[0]!.adresse, "/lieu/12/images/banniere");
  assert.equal(envoi.appels[0]!.init.method, "PUT");
  assert.equal((envoi.appels[0]!.init.headers as Record<string, string>)["Content-Type"], "image/jpeg");
  assert.equal(envoi.appels[0]!.init.body, image);

  const retrait = fauxFetch(Response.json({ ok: true }));
  assert.deepEqual(await appelerRouteImageLieu(12, "logo", null, retrait.appeler), { ok: true, adresse: null });
  assert.equal(retrait.appels[0]!.adresse, "/lieu/12/images/logo");
  assert.equal(retrait.appels[0]!.init.method, "DELETE");
  assert.equal(retrait.appels[0]!.init.body, undefined);
  assert.equal((retrait.appels[0]!.init.headers as Record<string, string>)["Content-Type"], undefined);

  const piege = fauxFetch(Response.json({ ok: true, adresse: "https://ailleurs.example/x.jpg" }));
  assert.deepEqual(await appelerRouteImageLieu(12, "banniere", image, piege.appeler), { ok: true, adresse: null });
  const limite = fauxFetch(Response.json({ ok: false, erreur: "compte-limite", details: { jusqua: "2026-11-02T11:00:00.000Z" } }, { status: 403 }));
  assert.deepEqual(await appelerRouteImageLieu(12, "banniere", image, limite.appeler), { ok: false, erreur: "compte-limite", jusqua: "2026-11-02T11:00:00.000Z" });
  const bizarre = fauxFetch(Response.json({ ok: false, erreur: "<script>" }, { status: 400 }));
  assert.deepEqual(await appelerRouteImageLieu(12, "banniere", image, bizarre.appeler), { ok: false, erreur: "erreur-serveur", jusqua: null });
  const pasJson = fauxFetch(new Response("<html>502</html>", { status: 502 }));
  assert.deepEqual(await appelerRouteImageLieu(12, "banniere", image, pasJson.appeler), { ok: false, erreur: "erreur-serveur", jusqua: null });
  const horsLigne = fauxFetch(new TypeError("Failed to fetch"));
  assert.deepEqual(await appelerRouteImageLieu(12, "banniere", image, horsLigne.appeler), { ok: false, erreur: "hors-ligne", jusqua: null });
});

const octetsJpeg = (taille: number) => {
  const octets = new Uint8Array(taille);
  octets.set([0xff, 0xd8, 0xff]);
  return octets;
};
function demande(methode: string, { corps, type, longueur, origine, ip = "203.0.113.9" }: { corps?: Uint8Array | ReadableStream; type?: string; longueur?: number; origine?: string; ip?: string | null } = {}) {
  const entetes: Record<string, string> = {};
  if (type) entetes["Content-Type"] = type;
  if (longueur !== undefined) entetes["Content-Length"] = String(longueur);
  if (origine) entetes.Origin = origine;
  if (ip) entetes["X-Real-IP"] = ip;
  return new Request("http://pro.sosmiam.fr/lieu/12/images/banniere", { method: methode, headers: entetes, body: corps, duplex: "half" } as RequestInit);
}
const avecSession = (appeler: typeof fetch) => ({ lireJeton: async () => JETON, appeler, adresseApi: API });

test("route du site : sans session, rien ne part (401), et les adresses ou méthodes inconnues sont refusées", async () => {
  const api = fauxFetch(Response.json({ ok: true }));
  const sansSession = await transmettreImageLieu(demande("PUT", { corps: octetsJpeg(100), type: "image/jpeg" }), "12", "banniere", { lireJeton: async () => null, appeler: api.appeler, adresseApi: API });
  assert.equal(sansSession.status, 401);
  assert.deepEqual(await sansSession.json(), { ok: false, erreur: "session-expiree" });
  assert.equal(sansSession.headers.get("Cache-Control"), "private, no-store");

  const lecture = await transmettreImageLieu(demande("GET"), "12", "banniere", avecSession(api.appeler));
  assert.equal(lecture.status, 405);
  assert.equal(lecture.headers.get("Allow"), "PUT, DELETE");
  assert.equal((await transmettreImageLieu(demande("POST", { corps: octetsJpeg(10), type: "image/jpeg" }), "12", "banniere", avecSession(api.appeler))).status, 405);
  for (const [id, quelle] of [["12", "photo"], ["0", "logo"], ["-3", "logo"], ["1e3", "logo"], ["1234567890", "logo"], [undefined, "logo"]]) {
    assert.equal((await transmettreImageLieu(demande("DELETE"), id, quelle, avecSession(api.appeler))).status, 404, `${id} ${quelle}`);
  }
  const autreSite = await transmettreImageLieu(demande("DELETE", { origine: "https://pirate.example" }), "12", "logo", avecSession(api.appeler));
  assert.equal(autreSite.status, 403);
  assert.equal(api.appels.length, 0);
});

test("route du site : PUT vérifié (type, poids avec un peu de marge, corps vide) avant tout appel", async () => {
  const api = fauxFetch(Response.json({ ok: true, adresse: ADRESSE }));
  const mauvaisType = await transmettreImageLieu(demande("PUT", { corps: octetsJpeg(100), type: "image/png" }), "12", "banniere", avecSession(api.appeler));
  assert.equal(mauvaisType.status, 400);
  assert.deepEqual(await mauvaisType.json(), { ok: false, erreur: "image-lieu-invalide" });
  const vide = await transmettreImageLieu(demande("PUT", { type: "image/jpeg" }), "12", "banniere", avecSession(api.appeler));
  assert.equal(vide.status, 400);
  const limite = BANNIERE_LIEU.poidsMax + MARGE_CORPS_IMAGE_LIEU;
  const annonceTropLourde = await transmettreImageLieu(demande("PUT", { corps: octetsJpeg(limite + 1), type: "image/jpeg", longueur: limite + 1 }), "12", "banniere", avecSession(api.appeler));
  assert.equal(annonceTropLourde.status, 413);
  assert.deepEqual(await annonceTropLourde.json(), { ok: false, erreur: "image-lieu-trop-lourde" });
  const flux = new ReadableStream({
    start(controleur) {
      for (let rang = 0; rang < 20; rang += 1) controleur.enqueue(octetsJpeg(64 * 1024));
      controleur.close();
    },
  });
  const fluxTropLourd = await transmettreImageLieu(demande("PUT", { corps: flux, type: "image/jpeg" }), "12", "banniere", avecSession(api.appeler));
  assert.equal(fluxTropLourd.status, 413);
  assert.equal(api.appels.length, 0);
  const dansLaMarge = await transmettreImageLieu(demande("PUT", { corps: octetsJpeg(BANNIERE_LIEU.poidsMax + 10), type: "image/jpeg" }), "12", "banniere", avecSession(api.appeler));
  assert.equal(dansLaMarge.status, 200);
  assert.equal(api.appels.length, 1);
});

test("route du site : le corps et les en-têtes partent à l'API locale, sa réponse revient telle quelle", async () => {
  const api = fauxFetch(Response.json({ ok: true, adresse: ADRESSE }));
  const corps = octetsJpeg(2048);
  corps[100] = 42;
  const reponse = await transmettreImageLieu(demande("PUT", { corps, type: "image/jpeg; charset=binary", origine: "https://pro.sosmiam.fr" }), "12", "banniere", avecSession(api.appeler));
  assert.equal(reponse.status, 200);
  assert.deepEqual(await reponse.json(), { ok: true, adresse: ADRESSE });
  assert.equal(reponse.headers.get("Cache-Control"), "private, no-store");
  const { adresse, init } = api.appels[0]!;
  assert.equal(adresse, `${API}/pro/lieux/12/banniere`);
  assert.equal(init.method, "PUT");
  const entetes = init.headers as Record<string, string>;
  assert.equal(entetes["X-Session-Compte"], JETON);
  assert.equal(entetes["X-IP-Visiteur"], "203.0.113.9");
  assert.equal(entetes["Content-Type"], "image/jpeg");
  assert.equal(entetes["X-Langue"], "fr");
  assert.deepEqual(new Uint8Array(init.body as Uint8Array), corps);

  const retrait = fauxFetch(Response.json({ ok: true }));
  const sansIp = await transmettreImageLieu(demande("DELETE", { ip: null }), "7", "logo", avecSession(retrait.appeler));
  assert.equal(sansIp.status, 200);
  assert.equal(retrait.appels[0]!.adresse, `${API}/pro/lieux/7/logo`);
  assert.equal(retrait.appels[0]!.init.method, "DELETE");
  assert.equal(retrait.appels[0]!.init.body, undefined);
  assert.deepEqual(retrait.appels[0]!.init.headers, { "X-Session-Compte": JETON, "X-Langue": "fr" });
});

test("route du site : les erreurs de l'API sont rendues telles quelles (statut, corps, Retry-After)", async () => {
  const cas: [number, object, Record<string, string>][] = [
    [400, { ok: false, erreur: "image-lieu-invalide" }, {}],
    [413, { ok: false, erreur: "image-lieu-trop-lourde" }, {}],
    [403, { ok: false, erreur: "reserve-au-gerant" }, {}],
    [403, { ok: false, erreur: "compte-limite", details: { jusqua: "2026-11-02T11:00:00.000Z" } }, {}],
    [404, { ok: false, erreur: "lieu-inconnu" }, {}],
    [401, { ok: false, erreur: "session-expiree" }, {}],
    [429, { ok: false, erreur: "trop-de-demandes" }, { "Retry-After": "1800" }],
    [503, { ok: false, erreur: "stockage-plein" }, { "Retry-After": "3600" }],
  ];
  for (const [statut, corps, entetes] of cas) {
    const api = fauxFetch(() => Response.json(corps, { status: statut, headers: entetes }));
    const reponse = await transmettreImageLieu(demande("PUT", { corps: octetsJpeg(500), type: "image/jpeg" }), "12", "banniere", avecSession(api.appeler));
    assert.equal(reponse.status, statut);
    assert.deepEqual(await reponse.json(), corps);
    assert.equal(reponse.headers.get("Retry-After"), entetes["Retry-After"] ?? null);
  }
  const panne = await transmettreImageLieu(demande("DELETE"), "12", "logo", avecSession(fauxFetch(new Error("ECONNREFUSED")).appeler));
  assert.equal(panne.status, 502);
  assert.deepEqual(await panne.json(), { ok: false, erreur: "erreur-serveur" });
  const pasJson = await transmettreImageLieu(demande("DELETE"), "12", "logo", avecSession(fauxFetch(new Response("Bad Gateway", { status: 502 })).appeler));
  assert.equal(pasJson.status, 502);
});

test("adresses : la page et la route sont servies sur pro.sosmiam.fr, renvoyées vers lui depuis sosmiam.fr", () => {
  assert.equal(choisirRedirectionHote("pro.sosmiam.fr", "/lieu/12/images"), null);
  assert.equal(choisirRedirectionHote("pro.sosmiam.fr", "/lieu/12/images/banniere"), null);
  assert.deepEqual(choisirRedirectionHote("sosmiam.fr", "/lieu/12/images"), { adresse: "https://pro.sosmiam.fr/lieu/12/images", statut: 301 });
});
