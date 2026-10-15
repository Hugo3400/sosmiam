import { test } from "node:test";
import assert from "node:assert/strict";
import { creerClientHttp } from "../src/client-api/client-http.ts";
import { creerEcouteReguliere } from "../src/client-api/api/creer-ecoute-reguliere.ts";
import { creerServicesSociauxApi } from "../src/client-api/api/creer-services-sociaux-api.ts";
import { creerSocialApi } from "../src/client-api/api/api-social.ts";
import type { ClientHttp, OptionsDemande } from "../src/client-api/client-http.ts";

type Appel = { url: string; methode: string; entetes: Record<string, string>; corps: unknown };

/** Un faux fetch : rend la réponse donnée et note chaque appel */
function fauxServeur(reponse: () => Response | Promise<Response>) {
  const appels: Appel[] = [];
  const faux = (async (url: string, init: RequestInit) => {
    appels.push({ url, methode: String(init.method), entetes: init.headers as Record<string, string>, corps: init.body ? JSON.parse(String(init.body)) : undefined });
    return reponse();
  }) as unknown as typeof fetch;
  return { appels, faux };
}
const json = (statut: number, corps: unknown, entetes: Record<string, string> = {}) =>
  new Response(JSON.stringify(corps), { status: statut, headers: { "Content-Type": "application/json", ...entetes } });

test("client HTTP : session en Bearer, corps JSON, réponse { ok } rendue telle quelle", async () => {
  const { appels, faux } = fauxServeur(() => json(201, { ok: true, visite: { id: 3 } }));
  const client = creerClientHttp({ adresse: "https://api.exemple.fr/", lireJeton: async () => "jeton-1", fetch: faux });
  const r = await client.demander<{ visite: { id: number } }>("POST", "/app/visites/addition", { corps: { lieuId: 1 } });
  assert.deepEqual(r, { ok: true, visite: { id: 3 } });
  assert.deepEqual([appels[0].url, appels[0].methode, appels[0].entetes.Authorization, appels[0].corps], ["https://api.exemple.fr/app/visites/addition", "POST", "Bearer jeton-1", { lieuId: 1 }]);
  // Lecture publique : jamais de jeton
  await client.demander("GET", "/miam-safe/lieux/1", { session: false });
  assert.equal(appels[1].entetes.Authorization, undefined);
});

test("client HTTP : erreurs traduites pour l'app", async () => {
  const cas: [Response | "reseau", unknown][] = [
    [json(409, { ok: false, erreur: "demande-en-cours", details: { lieu: "Chez Léa", lieuId: 2, autre: "x" } }), { ok: false, erreur: "demande-en-cours", details: { lieu: "Chez Léa", lieuId: 2 } }],
    [json(403, { ok: false, erreur: "pas-pro" }), { ok: false, erreur: "role-requis" }],
    [json(400, { ok: false, erreur: "champ-invalide", champ: "pseudo" }), { ok: false, erreur: "champ-invalide", champ: "pseudo" }],
    [json(400, { ok: false, erreur: "code-inconnu-de-l-app" }), { ok: false, erreur: "erreur-serveur" }],
    [json(503, { ok: false, erreur: "chiffrement-indisponible" }), { ok: false, erreur: "chiffrement-indisponible" }],
    // Plus traduit en « champ-invalide » : l'app a son texte (« Il manque un détail »)
    [json(400, { ok: false, erreur: "signalement-invalide" }), { ok: false, erreur: "signalement-invalide" }],
    [json(429, { ok: false, erreur: "trop-de-demandes" }, { "Retry-After": "42" }), { ok: false, erreur: "trop-de-demandes", details: { attenteS: 42 } }],
    [new Response("<html>502</html>", { status: 502 }), { ok: false, erreur: "erreur-serveur" }],
    ["reseau", { ok: false, erreur: "hors-ligne" }],
  ];
  for (const [reponse, attendu] of cas) {
    const faux = (async () => {
      if (reponse === "reseau") throw new TypeError("Network request failed");
      return reponse;
    }) as unknown as typeof fetch;
    const client = creerClientHttp({ adresse: "https://api.exemple.fr", lireJeton: () => null, fetch: faux });
    assert.deepEqual(await client.demander("GET", "/x"), attendu);
  }
});

test("client HTTP : en-têtes en plus (Idempotency-Key), sans jamais remplacer la session ni le format", async () => {
  const { appels, faux } = fauxServeur(() => json(201, { ok: true }));
  const client = creerClientHttp({ adresse: "https://api.exemple.fr", lireJeton: () => "jeton-1", fetch: faux });
  const entetes = {
    "Idempotency-Key": "8d0f3c2e-1b4a-4c6d-9e7f-0a1b2c3d4e5f", authorization: "Bearer autre", "content-type": "text/plain", ACCEPT: "*/*",
    // L'API lit X-Session-Compte avant Authorization : il ne passe jamais, ni un cookie
    "X-Session-Compte": "ancien-jeton", "x-session-compte": "ancien-jeton", Cookie: "session=ancien-jeton",
  };
  await client.demander("POST", "/app/conversations/groupes", { corps: { titre: "Les gourmands" }, entetes });
  assert.deepEqual(appels[0].entetes, {
    "Idempotency-Key": "8d0f3c2e-1b4a-4c6d-9e7f-0a1b2c3d4e5f",
    Accept: "application/json",
    "Content-Type": "application/json",
    Authorization: "Bearer jeton-1",
  });
  // Sans entetes : rien de plus qu'avant
  await client.demander("GET", "/app/social/pouls");
  assert.deepEqual(appels[1].entetes, { Accept: "application/json", Authorization: "Bearer jeton-1" });
});

test("services sociaux : les adresses et les corps des routes du profil social, des personnes, des masques et de la cloche", async () => {
  const { appels, faux } = fauxServeur(() => json(200, { ok: true }));
  const { social, cloche } = creerServicesSociauxApi(creerClientHttp({ adresse: "https://api.exemple.fr", lireJeton: () => "jeton-1", fetch: faux }));
  await social.lireMoi();
  await social.ouvrirProfil();
  await social.modifierReglages({ trouvable: false });
  await social.lirePouls();
  await social.chercher("@lea");
  await social.suggerer();
  await social.exporter();
  await social.lireProfil("ab2cd3ef4g");
  await social.listerLiensDe("ab2cd3ef4g", "abonnes");
  await social.listerLiensDe("ab2cd3ef4g", "abonnements", "2026-10-14T10:00:00.000Z|42");
  await social.listerListesDe("ab2cd3ef4g");
  await social.listerMasques();
  await social.listerMasques("lieu-recu");
  await social.masquer("activite", "garde:ab2cd3ef4g:12", true);
  await social.masquer("activite", "garde:ab2cd3ef4g:12", false);
  await cloche.lister();
  await cloche.lister("suite/1");
  await cloche.marquerVu("2026-10-14T10:00:00.000Z");
  await cloche.marquerVu();
  await cloche.effacer("42");
  await cloche.effacerLues("2026-10-14T10:00:00.000Z");
  await cloche.effacerLues();
  const vus = appels.map((a) => `${a.methode} ${a.url.replace("https://api.exemple.fr", "")}${a.corps === undefined ? "" : ` ${JSON.stringify(a.corps)}`}`);
  assert.deepEqual(vus, [
    "GET /app/social/moi",
    "POST /app/social/moi",
    'PATCH /app/social/moi {"trouvable":false}',
    "GET /app/social/pouls",
    'POST /app/personnes/recherche {"debut":"@lea"}',
    "GET /app/personnes/suggestions",
    "GET /app/social/export",
    "GET /app/personnes/ab2cd3ef4g",
    "GET /app/personnes/ab2cd3ef4g/abonnes",
    "GET /app/personnes/ab2cd3ef4g/abonnements?apres=2026-10-14T10%3A00%3A00.000Z%7C42",
    "GET /app/personnes/ab2cd3ef4g/listes",
    "GET /app/masques",
    "GET /app/masques?cible=lieu-recu",
    "PUT /app/masques/activite/garde%3Aab2cd3ef4g%3A12",
    "DELETE /app/masques/activite/garde%3Aab2cd3ef4g%3A12",
    "GET /app/cloche",
    "GET /app/cloche?apres=suite%2F1",
    'POST /app/cloche/vu {"jusqua":"2026-10-14T10:00:00.000Z"}',
    "POST /app/cloche/vu {}",
    "DELETE /app/cloche/42",
    'POST /app/cloche/effacer-lues {"jusqua":"2026-10-14T10:00:00.000Z"}',
    "POST /app/cloche/effacer-lues {}",
  ]);
  // Toutes avec la session : aucune route sociale n'est publique
  assert.ok(appels.every((a) => a.entetes.Authorization === "Bearer jeton-1"));
});

test("client HTTP : session expirée → « connexion-requise » et l'app oublie le jeton ; trop long → hors-ligne", async () => {
  let oubliee = 0;
  const { faux } = fauxServeur(() => json(401, { ok: false, erreur: "session-expiree" }));
  const client = creerClientHttp({ adresse: "https://api.exemple.fr", lireJeton: () => "vieux", surSessionExpiree: () => oubliee++, fetch: faux });
  assert.deepEqual(await client.demander("GET", "/app/visites"), { ok: false, erreur: "connexion-requise" });
  assert.equal(oubliee, 1);
  const lent = ((_url: string, init: RequestInit) =>
    new Promise((_ok, ko) => init.signal?.addEventListener("abort", () => ko(new Error("abandonné"))))) as unknown as typeof fetch;
  const pressé = creerClientHttp({ adresse: "https://api.exemple.fr", lireJeton: () => null, delaiMs: 20, fetch: lent });
  assert.deepEqual(await pressé.demander("GET", "/x"), { ok: false, erreur: "hors-ligne" });
});

test("client HTTP : un délai pour une seule demande (delaiMs), sans rien changer pour les autres", async () => {
  // Répond au bout de 60 ms, sauf si la demande est abandonnée avant
  const lent = ((_url: string, init: RequestInit) => new Promise((ok, ko) => {
    const minuterie = setTimeout(() => ok(json(200, { ok: true })), 60);
    init.signal?.addEventListener("abort", () => { clearTimeout(minuterie); ko(new Error("abandonné")); });
  })) as unknown as typeof fetch;
  const pressé = creerClientHttp({ adresse: "https://api.exemple.fr", lireJeton: () => null, delaiMs: 20, fetch: lent });
  assert.deepEqual(await pressé.demander("GET", "/app/social/export", { delaiMs: 1_000 }), { ok: true });
  assert.deepEqual(await pressé.demander("GET", "/app/social/pouls"), { ok: false, erreur: "hors-ligne" }, "les autres gardent le délai du client");
});

test("services sociaux : l'export attend jusqu'à 60 s ; les autres lectures gardent le délai du client", async () => {
  const options: (OptionsDemande | undefined)[] = [];
  const faux = { demander: async (_m: string, _c: string, o?: OptionsDemande) => { options.push(o); return { ok: true }; } } as unknown as ClientHttp;
  const social = creerSocialApi(faux);
  await social.exporter();
  await social.lirePouls();
  assert.deepEqual(options, [{ delaiMs: 60_000 }, undefined]);
});

test("écoute régulière : prévient tous les abonnés, s'arrête quand plus personne n'écoute", async () => {
  const ecouter = creerEcouteReguliere(10);
  let a = 0;
  let b = 0;
  const finA = ecouter(() => a++);
  const finB = ecouter(() => b++);
  await new Promise((fini) => setTimeout(fini, 35));
  finA();
  finB();
  const [avantA, avantB] = [a, b];
  assert.ok(avantA >= 2 && avantB >= 2);
  await new Promise((fini) => setTimeout(fini, 30));
  assert.deepEqual([a, b], [avantA, avantB]);
});

test("envoyerOctets (photo, note vocale) : corps brut et son type, Idempotency-Key, session du client ; preparerTelechargement : jeton jamais dans l'adresse", async () => {
  const appels: { url: string; methode: string; entetes: Record<string, string>; corps: unknown }[] = [];
  const faux = (async (url: string, init: RequestInit) => {
    appels.push({ url, methode: String(init.method), entetes: init.headers as Record<string, string>, corps: init.body });
    return json(201, { ok: true, message: { id: "9" }, version: 3 });
  }) as unknown as typeof fetch;
  const client = creerClientHttp({ adresse: "https://api.exemple.fr", lireJeton: () => "jeton-1", fetch: faux });
  const octets = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
  const r = await client.envoyerOctets<{ message: { id: string } }>("/app/conversations/3/medias", octets, "image/jpeg", { "Idempotency-Key": "8d0f3c2e-1b4a-4c6d-9e7f-0a1b2c3d4e5f", Authorization: "Bearer autre" });
  assert.deepEqual(r, { ok: true, message: { id: "9" }, version: 3 });
  assert.deepEqual([appels[0]!.methode, appels[0]!.corps], ["POST", octets]);
  assert.deepEqual(appels[0]!.entetes, {
    "Idempotency-Key": "8d0f3c2e-1b4a-4c6d-9e7f-0a1b2c3d4e5f", Accept: "application/json", "Content-Type": "image/jpeg", Authorization: "Bearer jeton-1",
  });
  assert.deepEqual(await client.preparerTelechargement("/app/conversations/3/messages/9/media"), {
    url: "https://api.exemple.fr/app/conversations/3/messages/9/media", entetes: { Authorization: "Bearer jeton-1" },
  });
  const sansCompte = creerClientHttp({ adresse: "https://api.exemple.fr", lireJeton: () => null, fetch: faux });
  assert.deepEqual((await sansCompte.preparerTelechargement("/x")).entetes, {});
  // Les erreurs se lisent comme celles de demander
  const refus = creerClientHttp({ adresse: "https://api.exemple.fr", lireJeton: () => "j", fetch: (async () => json(413, { ok: false, erreur: "media-trop-lourd" })) as unknown as typeof fetch });
  assert.deepEqual(await refus.envoyerOctets("/x", octets, "image/jpeg"), { ok: false, erreur: "media-trop-lourd" });
});

test("messagerie : les adresses et les corps des routes /app/conversations et /app/lieux-envoyes", async () => {
  const appels: { url: string; methode: string; entetes: Record<string, string>; corps: unknown }[] = [];
  const faux = (async (url: string, init: RequestInit) => {
    appels.push({ url, methode: String(init.method), entetes: init.headers as Record<string, string>, corps: init.body });
    return json(200, { ok: true });
  }) as unknown as typeof fetch;
  const { messagerie } = creerServicesSociauxApi(creerClientHttp({ adresse: "https://api.exemple.fr", lireJeton: () => "jeton-1", fetch: faux }));
  const cle = "8d0f3c2e-1b4a-4c6d-9e7f-0a1b2c3d4e5f";
  await messagerie.listerConversations();
  await messagerie.listerConversations("suite/1");
  await messagerie.lireFil("3");
  await messagerie.lireFil("3", { version: 4, avant: "120" });
  await messagerie.ouvrirPrive("ab2cd3ef4g");
  await messagerie.creerGroupe({ titre: "Les gourmands", emoji: "🍕", invites: ["ab2cd3ef4g"] }, cle);
  await messagerie.modifierGroupe("3", { titre: "Les affamés" });
  await messagerie.inviterAuGroupe("3", ["ab2cd3ef4g"]);
  await messagerie.repondreInvitation("3", true);
  await messagerie.retirerMembre("3", "moi");
  await messagerie.changerRole("3", "ab2cd3ef4g", "admin");
  await messagerie.couper("3", true);
  await messagerie.marquerLu("3", "120");
  await messagerie.effacerPourMoi("3");
  await messagerie.envoyerTexte("3", cle, "Salut !");
  await messagerie.envoyerLieu("3", cle, 12);
  await messagerie.envoyerMedia("3", cle, new Uint8Array([1, 2]), "audio/mp4");
  await messagerie.supprimerMessage("3", "120");
  await messagerie.reagir("3", "120", "coeur", true);
  await messagerie.reagir("3", "120", "coeur", false);
  await messagerie.envoyerLieuAPotes(cle, 12, ["ab2cd3ef4g"], "Testé et approuvé");
  await messagerie.listerLieuxRecus();
  await messagerie.listerLieuxEnvoyes("suite/2");
  await messagerie.marquerLieuxVus("120");
  const vus = appels.map((a) => `${a.methode} ${a.url.replace("https://api.exemple.fr", "")}${typeof a.corps === "string" ? ` ${a.corps}` : ""}`);
  assert.deepEqual(vus, [
    "GET /app/conversations",
    "GET /app/conversations?apres=suite%2F1",
    "GET /app/conversations/3",
    "GET /app/conversations/3?version=4&avant=120",
    'POST /app/conversations/prive {"personne":"ab2cd3ef4g"}',
    'POST /app/conversations/groupes {"titre":"Les gourmands","emoji":"🍕","invites":["ab2cd3ef4g"]}',
    'PATCH /app/conversations/3 {"titre":"Les affamés"}',
    'POST /app/conversations/3/invites {"invites":["ab2cd3ef4g"]}',
    'POST /app/conversations/3/reponse {"rejoint":true}',
    "DELETE /app/conversations/3/membres/moi",
    'PUT /app/conversations/3/membres/ab2cd3ef4g/role {"role":"admin"}',
    'PUT /app/conversations/3/notifications {"coupees":true}',
    'PUT /app/conversations/3/lu {"jusqua":"120"}',
    "POST /app/conversations/3/effacer",
    `POST /app/conversations/3/messages {"idClient":"${cle}","type":"texte","texte":"Salut !"}`,
    `POST /app/conversations/3/messages {"idClient":"${cle}","type":"lieu","lieuId":12,"texte":null}`,
    "POST /app/conversations/3/medias",
    "DELETE /app/conversations/3/messages/120",
    "PUT /app/conversations/3/messages/120/reactions/coeur",
    "DELETE /app/conversations/3/messages/120/reactions/coeur",
    `POST /app/lieux-envoyes {"idClient":"${cle}","lieuId":12,"a":["ab2cd3ef4g"],"mot":"Testé et approuvé"}`,
    "GET /app/lieux-envoyes/recus",
    "GET /app/lieux-envoyes/envoyes?apres=suite%2F2",
    'PUT /app/lieux-envoyes/vus {"jusqua":"120"}',
  ]);
  assert.equal(appels[5]!.entetes["Idempotency-Key"], cle, "création de groupe : clé dans l'en-tête");
  assert.deepEqual([appels[16]!.entetes["Content-Type"], appels[16]!.entetes["Idempotency-Key"]], ["audio/mp4", cle]);
  assert.ok(appels.every((a) => a.entetes.Authorization === "Bearer jeton-1"));
  assert.deepEqual(await messagerie.preparerLectureMedia("3", "120"), { url: "https://api.exemple.fr/app/conversations/3/messages/120/media", entetes: { Authorization: "Bearer jeton-1" } });
});
