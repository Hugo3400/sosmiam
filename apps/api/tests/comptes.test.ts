// Tests des comptes de l'espace ambassadeur : inscription, connexion, sessions, attente après des échecs (même avec des
// essais lancés tous en même temps), file des calculs pleine, nouveau mot de passe, limites par visiteur (IPv6 par bloc).
// Services en mémoire (services/comptes-en-memoire.ts) : aucune base de données n'est touchée.
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import type { AddressInfo } from "node:net";
import { after, before, test } from "node:test";

import { creerApplication } from "../src/application.ts";
import { calculerEmpreinteJeton } from "../src/fonctions/securite/calculer-empreinte-jeton.ts";
import { calculerScrypt } from "../src/fonctions/securite/calculer-scrypt.ts";
import { creerJeton } from "../src/fonctions/securite/creer-jeton.ts";
import { hacherMotDePasse, REGLAGES_SCRYPT } from "../src/fonctions/securite/hacher-mot-de-passe.ts";
import type { StockageSessionsComptes } from "../src/middlewares/proteger-comptes.ts";
import { creerComptesEnMemoire } from "../src/services/comptes-en-memoire.ts";
import type { CompteConnecte, StatutAmbassadeur } from "../src/services/comptes.ts";

const MOT_DE_PASSE = "une petite phrase de passe";
const UN_JOUR = 86_400_000;
/** Le 8 octobre 2026 à midi, heure de Paris */
let horloge = Date.parse("2026-10-08T10:00:00Z");
const memoire = creerComptesEnMemoire(() => horloge);
/** Les écritures d'activité et de dernière visite sont comptées (elles doivent rester rares) */
const ecritures = { toucher: 0, noterVisite: 0 };
const sessions: StockageSessionsComptes = {
  ...memoire.sessions,
  toucher: async (empreinte, activite) => (ecritures.toucher++, memoire.sessions.toucher(empreinte, activite)),
  noterVisite: async (compteId, moment) => (ecritures.noterVisite++, memoire.sessions.noterVisite(compteId, moment)),
};
const serveur = creerApplication({
  enregistrerInscription: async () => {},
  comptes: { services: memoire.services, sessions, zones: memoire.zones, courriels: memoire.courriels, horloge: () => horloge },
}).listen(0, "127.0.0.1");
let adresse = "";
before(() => new Promise<void>((pret) => serveur.once("listening", () => {
  adresse = `http://127.0.0.1:${(serveur.address() as AddressInfo).port}`;
  pret();
})));
after(() => new Promise<void>((fini) => serveur.close(() => fini())));

type Corps = { ok: boolean; erreur?: string; champ?: string; attente?: number; session?: string; compte?: CompteConnecte };
type Options = { corps?: unknown; jeton?: string; ip?: string };
let visiteur = 0;
/** Chaque demande vient d'un visiteur différent, sauf si on en impose un (pour tester les limites). */
async function demander(methode: string, chemin: string, { corps, jeton, ip = `visiteur-${++visiteur}` }: Options = {}) {
  const reponse = await fetch(`${adresse}${chemin}`, {
    method: methode,
    headers: {
      "X-IP-Visiteur": ip,
      ...(corps === undefined ? {} : { "Content-Type": "application/json" }),
      ...(jeton ? { "X-Session-Compte": jeton } : {}),
    },
    ...(corps === undefined ? {} : { body: typeof corps === "string" ? corps : JSON.stringify(corps) }),
  });
  return { statut: reponse.status, corps: (await reponse.json()) as Corps, entetes: reponse.headers };
}

const empreinte = await hacherMotDePasse(MOT_DE_PASSE);
let numero = 0;
async function ouvrirSession(compteId: number) {
  const jeton = creerJeton();
  await memoire.sessions.creer(calculerEmpreinteJeton(jeton), { compteId, creeLe: horloge, activite: horloge });
  return jeton;
}
/** Un compte déjà là (sans passer par l'inscription, pour aller vite) et une session ouverte pour lui. */
async function creerCompteEtSession(statut: StatutAmbassadeur = "actif") {
  const email = `compte${++numero}@exemple.fr`;
  const id = await memoire.services.creerCompte({ email, motDePasse: empreinte, prenom: "Camille", ville: "Lyon", quartier: null, cguVersion: "2026-10-08" });
  if (id === null) throw new Error("compte de test impossible");
  if (statut !== "en-attente") await memoire.decider(id, statut);
  return { id, email, jeton: await ouvrirSession(id) };
}

const INSCRIPTION = {
  email: " Zoe.Martin@Exemple.FR ", motDePasse: "mon chat adore les croissants", prenom: "  Zoé ", ville: " Nantes ", quartier: "",
  dateNaissance: "2000-01-31", cgu: true,
};

test("une inscription valable crée le compte « en-attente », ouvre une session, et ne garde pas la date de naissance", async () => {
  const { statut, corps, entetes } = await demander("POST", "/comptes", { corps: INSCRIPTION });
  assert.equal(statut, 201);
  assert.equal(entetes.get("cache-control"), "private, no-store");
  assert.match(corps.session ?? "", /^[A-Za-z0-9_-]{43}$/);
  assert.deepEqual(corps.compte, {
    prenom: "Zoé", email: "zoe.martin@exemple.fr", points: 0, palier: "curieux", badges: [], creeLe: new Date(horloge).toISOString(),
    emailVerifie: false, ambassadeur: { statut: "en-attente", ville: "Nantes", quartier: null, decideLe: null, certifie: null },
    pro: { lieux: [] },
  });
  const garde = [...memoire.comptes.values()].find((compte) => compte.email === "zoe.martin@exemple.fr");
  assert.ok(garde?.motDePasse.startsWith("scrypt$16384$8$5$"));
  assert.equal(garde?.cguVersion, "2026-10-08");
  assert.ok(!JSON.stringify(garde).includes("2000-01-31") && !JSON.stringify(garde).includes("croissants"));
  const session = await demander("GET", "/comptes/session", { jeton: corps.session });
  assert.equal(session.statut, 200);
  assert.deepEqual(session.corps, { ok: true, compte: corps.compte });
});

test("un e-mail déjà pris : 409 « email-deja-utilise »", async () => {
  const { statut, corps } = await demander("POST", "/comptes", { corps: { ...INSCRIPTION, email: "ZOE.MARTIN@exemple.fr" } });
  assert.equal(statut, 409);
  assert.deepEqual(corps, { ok: false, erreur: "email-deja-utilise" });
});

test("un champ invalide est signalé, dans l'ordre du formulaire, et rien n'est créé", async () => {
  const avant = memoire.comptes.size;
  const cas: [string, Record<string, unknown>][] = [
    ["prenom", { prenom: " \n " }], ["prenom", { prenom: "x".repeat(41) }],
    ["email", { email: "pas-une-adresse" }], ["email", { email: 42 }],
    ["motDePasse", { motDePasse: "trop court" }], ["motDePasse", { motDePasse: "Motdepasse1234" }], ["motDePasse", { motDePasse: "x".repeat(129) }],
    ["motDePasse", { motDePasse: "482910374652" }],
    ["motDePasse", { email: "lea.durand@exemple.fr", motDePasse: "Lea.Durand@exemple.fr" }],
    ["dateNaissance", { dateNaissance: "31/01/2000" }], ["dateNaissance", { dateNaissance: "2001-02-29" }], ["dateNaissance", { dateNaissance: undefined }],
    ["ville", { ville: "X" }], ["ville", { ville: "x".repeat(81) }],
    ["quartier", { quartier: "x".repeat(81) }], ["quartier", { quartier: 3 }],
    ["cgu", { cgu: false }], ["cgu", { cgu: "true" }],
  ];
  for (const [champ, modification] of cas) {
    const { statut, corps } = await demander("POST", "/comptes", { corps: { ...INSCRIPTION, email: "nouveau@exemple.fr", ...modification } });
    assert.equal(statut, 400, champ);
    assert.deepEqual(corps, { ok: false, erreur: "champ-invalide", champ });
  }
  assert.equal(memoire.comptes.size, avant);
});

test("avant 18 ans (date du jour à Paris) : 403 « age-minimum », et rien n'est gardé", async () => {
  const avant = memoire.comptes.size;
  const mineur = await demander("POST", "/comptes", { corps: { ...INSCRIPTION, email: "ado@exemple.fr", dateNaissance: "2008-10-09" } });
  assert.equal(mineur.statut, 403);
  assert.deepEqual(mineur.corps, { ok: false, erreur: "age-minimum" });
  // Même avec un formulaire incomplet : inutile de corriger le reste
  assert.equal((await demander("POST", "/comptes", { corps: { dateNaissance: "2012-05-01" } })).statut, 403);
  assert.equal(memoire.comptes.size, avant);
  // 0 h 30 à Paris le 8 octobre (22 h 30 le 7 en heure universelle) : 18 ans tout juste
  const sauvegarde = horloge;
  horloge = Date.parse("2026-10-07T22:30:00Z");
  const majeur = await demander("POST", "/comptes", { corps: { ...INSCRIPTION, email: "majeur@exemple.fr", dateNaissance: "2008-10-08" } });
  horloge = sauvegarde;
  assert.equal(majeur.statut, 201);
});

test("le champ piège rempli : « ok » sans session, et rien n'est créé", async () => {
  const avant = memoire.comptes.size;
  const { statut, corps } = await demander("POST", "/comptes", { corps: { ...INSCRIPTION, email: "robot@exemple.fr", piege: "http://spam" } });
  assert.equal(statut, 201);
  assert.deepEqual(corps, { ok: true });
  assert.equal(memoire.comptes.size, avant);
});

test("connexion : une nouvelle session ; e-mail inconnu ou mauvais mot de passe, la même erreur dans le même temps", async () => {
  const { email, jeton: premiere } = await creerCompteEtSession();
  const bonne = await demander("POST", "/comptes/session", { corps: { email: ` ${email.toUpperCase()} `, motDePasse: MOT_DE_PASSE } });
  assert.equal(bonne.statut, 201);
  assert.notEqual(bonne.corps.session, premiere);
  assert.equal(bonne.corps.compte?.email, email);
  for (const jeton of [bonne.corps.session, premiere]) assert.equal((await demander("GET", "/comptes/session", { jeton })).statut, 200);
  assert.equal((await demander("POST", "/comptes/session", { corps: { email: "pas-une-adresse", motDePasse: MOT_DE_PASSE } })).corps.champ, "email");
  assert.equal((await demander("POST", "/comptes/session", { corps: { email } })).corps.champ, "motDePasse");

  const chronometrer = async (corps: unknown) => {
    const debut = performance.now();
    const reponse = await demander("POST", "/comptes/session", { corps });
    return { ...reponse, duree: performance.now() - debut };
  };
  const faux = [await chronometrer({ email, motDePasse: "pas le bon mot de passe" }), await chronometrer({ email, motDePasse: "toujours pas" })];
  const inconnus = [
    await chronometrer({ email: "personne@exemple.fr", motDePasse: MOT_DE_PASSE }), await chronometrer({ email: "personne@exemple.fr", motDePasse: "autre" }),
  ];
  for (const essai of [...faux, ...inconnus]) {
    assert.equal(essai.statut, 401);
    assert.deepEqual(essai.corps, { ok: false, erreur: "identifiants" });
  }
  // Sans l'empreinte factice, un e-mail inconnu répondrait des centaines de fois plus vite
  const plusRapide = (essais: { duree: number }[]) => Math.min(...essais.map((essai) => essai.duree));
  assert.ok(plusRapide(inconnus) > 0.3 * plusRapide(faux), `${plusRapide(inconnus)} ms contre ${plusRapide(faux)} ms`);
});

test("après 5 mots de passe faux de suite, il faut attendre (2 min, puis 4 min…), même avec le bon ; un succès remet à zéro", async () => {
  const { email } = await creerCompteEtSession();
  const essayer = (motDePasse: string) => demander("POST", "/comptes/session", { corps: { email, motDePasse } });
  for (let i = 0; i < 5; i++) assert.equal((await essayer("pas le bon mot de passe")).statut, 401);
  const bloque = await essayer(MOT_DE_PASSE);
  assert.equal(bloque.statut, 429);
  assert.deepEqual(bloque.corps, { ok: false, erreur: "trop-de-demandes", attente: 120 });
  assert.equal(bloque.entetes.get("retry-after"), "120");
  horloge += 120_000;
  assert.equal((await essayer("pas le bon mot de passe")).statut, 401);
  assert.equal((await essayer(MOT_DE_PASSE)).corps.attente, 240);
  horloge += 240_000;
  assert.equal((await essayer(MOT_DE_PASSE)).statut, 201);
  for (let i = 0; i < 2; i++) assert.equal((await essayer("pas le bon mot de passe")).statut, 401, "remis à zéro");
});

test("20 connexions lancées en même temps : 5 mots de passe vérifiés au plus, les 15 autres doivent attendre", async () => {
  const { email } = await creerCompteEtSession();
  const reponses = await Promise.all(Array.from({ length: 20 }, (_, i) =>
    demander("POST", "/comptes/session", { corps: { email, motDePasse: `pas le bon mot de passe n° ${i}` } })));
  const parStatut: Record<number, number> = {};
  for (const { statut } of reponses) parStatut[statut] = (parStatut[statut] ?? 0) + 1;
  assert.deepEqual(parStatut, { 401: 5, 429: 15 });
});

test("trop de calculs en attente : 503 « occupe » tout de suite, rien n'est créé, et l'essai ne compte pas", async () => {
  const { email } = await creerCompteEtSession();
  const avant = memoire.comptes.size;
  const sel = randomBytes(16);
  // Deux calculs lents (p = 16 : bien plus d'un quart de seconde) prennent les deux places ; vingt petits remplissent la file
  const occupants = [
    ...[1, 2].map(() => calculerScrypt("x", sel, 32, { ...REGLAGES_SCRYPT, p: 16 })),
    ...Array.from({ length: 20 }, () => calculerScrypt("x", sel, 16, { N: 1024, r: 1, p: 1 })),
  ];
  const reponses = await Promise.all([
    demander("POST", "/comptes/session", { corps: { email, motDePasse: "pas le bon mot de passe" } }),
    demander("POST", "/comptes", { corps: { ...INSCRIPTION, email: "pressee@exemple.fr" } }),
  ]);
  await Promise.all(occupants);
  for (const { statut, corps, entetes } of reponses) {
    assert.deepEqual([statut, corps, entetes.get("retry-after")], [503, { ok: false, erreur: "occupe" }, "5"]);
  }
  assert.equal(memoire.comptes.size, avant, "aucun compte créé");
  const essayer = () => demander("POST", "/comptes/session", { corps: { email, motDePasse: "pas le bon mot de passe" } });
  for (let i = 0; i < 5; i++) assert.equal((await essayer()).statut, 401, "l'essai refusé « occupe » n'a pas compté");
  assert.equal((await essayer()).statut, 429);
});

test("sans jeton, avec un faux jeton ou après déconnexion : 401 « session-expiree » ; déconnecter est toujours « ok »", async () => {
  const { jeton } = await creerCompteEtSession();
  for (const faux of [undefined, "pas-un-jeton", creerJeton()]) {
    assert.deepEqual((await demander("GET", "/comptes/session", { jeton: faux })).corps, { ok: false, erreur: "session-expiree" });
  }
  assert.deepEqual((await demander("DELETE", "/comptes/session", { jeton })).corps, { ok: true });
  assert.equal((await demander("GET", "/comptes/session", { jeton })).statut, 401);
  assert.deepEqual((await demander("DELETE", "/comptes/session")).corps, { ok: true });
});

test("une session s'éteint après 30 jours sans visite, et au plus tard après 90 jours", async () => {
  const debut = horloge;
  const { jeton } = await creerCompteEtSession();
  for (const jours of [29, 58, 87]) {
    horloge = debut + jours * UN_JOUR;
    assert.equal((await demander("GET", "/comptes/session", { jeton })).statut, 200, `jour ${jours}`);
  }
  horloge = debut + 90 * UN_JOUR + 1000;
  assert.equal((await demander("GET", "/comptes/session", { jeton })).statut, 401, "90 jours au plus");
  const { jeton: oubliee } = await creerCompteEtSession();
  horloge += 30 * UN_JOUR + 1000;
  assert.equal((await demander("GET", "/comptes/session", { jeton: oubliee })).statut, 401, "30 jours sans visite");
});

test("l'activité n'est réécrite qu'au plus toutes les 5 minutes, la dernière visite au plus une fois par jour", async () => {
  const { id, jeton } = await creerCompteEtSession();
  const avant = { ...ecritures };
  for (let i = 0; i < 5; i++) {
    horloge += 60_000;
    await demander("GET", "/comptes/session", { jeton });
  }
  assert.equal(ecritures.toucher - avant.toucher, 0);
  horloge += 60_000;
  await demander("GET", "/comptes/session", { jeton });
  assert.equal(ecritures.toucher - avant.toucher, 1);
  assert.equal(ecritures.noterVisite - avant.noterVisite, 0);
  horloge += UN_JOUR;
  await demander("GET", "/comptes/session", { jeton });
  await demander("GET", "/comptes/session", { jeton });
  assert.equal(ecritures.noterVisite - avant.noterVisite, 1);
  assert.equal(memoire.comptes.get(id)?.derniereConnexion, horloge);
});

test("nouveau mot de passe avec le lien de l'équipe : usage unique, 24 h, et toutes les sessions fermées", async () => {
  const { id, email, jeton: session } = await creerCompteEtSession();
  const autreSession = await ouvrirSession(id);
  const lien = memoire.preparerReinitialisation(id);
  const choisir = (corps: unknown) => demander("POST", "/comptes/nouveau-mot-de-passe", { corps });
  assert.deepEqual((await choisir({ jeton: lien, motDePasse: "court" })).corps, { ok: false, erreur: "champ-invalide", champ: "motDePasse" });
  assert.equal((await choisir({ jeton: lien, motDePasse: email })).corps.champ, "motDePasse");
  assert.deepEqual((await choisir({ jeton: lien, motDePasse: "mon nouveau mot de passe" })).corps, { ok: true });
  for (const jeton of [session, autreSession]) assert.equal((await demander("GET", "/comptes/session", { jeton })).statut, 401);
  const encore = await choisir({ jeton: lien, motDePasse: "encore un autre mot de passe" });
  assert.equal(encore.statut, 410);
  assert.deepEqual(encore.corps, { ok: false, erreur: "jeton-invalide" });
  assert.equal((await demander("POST", "/comptes/session", { corps: { email, motDePasse: "mon nouveau mot de passe" } })).statut, 201);
  // Un lien de plus de 24 h, ou inventé, ne sert à rien
  const vieux = memoire.preparerReinitialisation(id);
  horloge += 24 * 3600_000 + 1000;
  for (const jeton of [vieux, undefined, "", "court", creerJeton(), 42]) {
    assert.equal((await choisir({ jeton, motDePasse: "mon nouveau mot de passe" })).statut, 410, String(jeton));
  }
});

test("limites par visiteur : 10 inscriptions par heure, 20 connexions et 10 nouveaux mots de passe par 10 minutes, 600 pour le reste", async () => {
  const statuts = async (nombre: number, envoyer: () => Promise<{ statut: number }>) => {
    const liste: number[] = [];
    for (let i = 0; i < nombre; i++) liste.push((await envoyer()).statut);
    return liste;
  };
  const repeter = (statut: number, fois: number) => Array<number>(fois).fill(statut);
  assert.deepEqual(await statuts(11, () => demander("POST", "/comptes", { corps: { piege: "robot" }, ip: "198.51.100.1" })), [...repeter(201, 10), 429]);
  assert.deepEqual(await statuts(21, () => demander("POST", "/comptes/session", { corps: { email: "x" }, ip: "198.51.100.2" })), [...repeter(400, 20), 429]);
  assert.deepEqual(await statuts(11, () => demander("POST", "/comptes/nouveau-mot-de-passe", { corps: {}, ip: "198.51.100.3" })), [...repeter(410, 10), 429]);
  assert.deepEqual(await statuts(601, () => demander("GET", "/comptes/session", { ip: "198.51.100.4" })), [...repeter(401, 600), 429]);
  // La déconnexion passe toujours, même limite atteinte : sinon le site efface son cookie, mais la session reste ouverte
  const { jeton } = await creerCompteEtSession();
  assert.deepEqual((await demander("DELETE", "/comptes/session", { jeton, ip: "198.51.100.4" })).corps, { ok: true });
  assert.equal((await demander("GET", "/comptes/session", { jeton })).statut, 401, "la session est bien fermée");
  assert.equal((await demander("GET", "/comptes/session")).statut, 401, "un autre visiteur n'est pas gêné");
});

test("en IPv6, un visiteur compte par son bloc /56 : changer d'adresse dans son bloc ne donne pas d'essais en plus", async () => {
  const connecter = (ip: string) => demander("POST", "/comptes/session", { corps: { email: "x" }, ip });
  const vingtEtUn = [...Array<number>(20).fill(400), 429];
  const memeBloc: number[] = [];
  // 21 adresses différentes, dans 21 /64 différents du même /56
  for (let i = 1; i <= 21; i++) memeBloc.push((await connecter(`2001:db8:aa:${i.toString(16)}::${i.toString(16)}`)).statut);
  assert.deepEqual(memeBloc, vingtEtUn);
  assert.equal((await connecter("2001:db8:aa:100::1")).statut, 400, "le bloc voisin n'est pas gêné");
  // « ::ffff:203.0.113.9 », c'est l'IPv4 203.0.113.9
  const memeIpv4: number[] = [];
  for (let i = 0; i < 21; i++) memeIpv4.push((await connecter(i % 2 ? "203.0.113.9" : "::ffff:203.0.113.9")).statut);
  assert.deepEqual(memeIpv4, vingtEtUn);
});

test("une panne : 500 sobre, et le journal ne garde ni e-mail ni mot de passe", async () => {
  const { email } = await creerCompteEtSession();
  const original = memoire.services.trouverCompteParEmail;
  memoire.services.trouverCompteParEmail = async (adresseEmail) => {
    throw new Error(`base en panne pour ${adresseEmail}`);
  };
  const journal: unknown[] = [];
  const erreurs = console.error;
  console.error = (...morceaux: unknown[]) => void journal.push(...morceaux);
  try {
    const { statut, corps } = await demander("POST", "/comptes/session", { corps: { email, motDePasse: "mon mot de passe secret" } });
    assert.equal(statut, 500);
    assert.deepEqual(corps, { ok: false, erreur: "erreur-serveur" });
  } finally {
    console.error = erreurs;
    memoire.services.trouverCompteParEmail = original;
  }
  const ecrit = journal.map(String).join(" ");
  assert.match(ecrit, /Error/);
  assert.ok(!ecrit.includes(email) && !ecrit.includes("secret"), ecrit);
});

test("un corps JSON cassé ou démesuré est refusé, sans rien laisser en cache", async () => {
  assert.equal((await demander("POST", "/comptes/session", { corps: "{pas du json" })).statut, 400);
  const enorme = await demander("POST", "/comptes", { corps: { prenom: "x".repeat(20_000) } });
  assert.equal(enorme.statut, 413);
  assert.equal(enorme.entetes.get("cache-control"), "private, no-store");
});
