// Tests de la candidature « fondateur » par ville (décision du 9 octobre 2026) : commune obligatoire, zone calculée par
// l'API, zone complète, commune posée ou changée après coup, fondateur « souvenir », ce que voit l'ambassadeur.
// Services en mémoire : aucune base de données n'est touchée.
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { after, before, test } from "node:test";

import { creerApplication } from "../src/application.ts";
import { calculerEmpreinteJeton } from "../src/fonctions/securite/calculer-empreinte-jeton.ts";
import { creerJeton } from "../src/fonctions/securite/creer-jeton.ts";
import { creerComptesEnMemoire } from "../src/services/comptes-en-memoire.ts";
import type { CandidatureVue } from "../src/services/comptes-espace.ts";
import type { StatutAmbassadeur } from "../src/services/comptes.ts";

const horloge = Date.parse("2026-10-09T10:00:00Z");
const memoire = creerComptesEnMemoire(() => horloge);
const serveur = creerApplication({
  enregistrerInscription: async () => {},
  comptes: { services: memoire.services, sessions: memoire.sessions, zones: memoire.zones, courriels: memoire.courriels, horloge: () => horloge },
}).listen(0, "127.0.0.1");
let adresse = "";
before(() => new Promise<void>((pret) => serveur.once("listening", () => {
  adresse = `http://127.0.0.1:${(serveur.address() as AddressInfo).port}`;
  pret();
})));
after(() => new Promise<void>((fini) => serveur.close(() => fini())));

type Corps = { ok: boolean; erreur?: string; champ?: string; candidature?: CandidatureVue | null; placesRestantes?: number };
let visiteur = 0;
async function demander(methode: string, chemin: string, jeton: string, corps?: unknown) {
  const reponse = await fetch(`${adresse}${chemin}`, {
    method: methode,
    headers: { "X-IP-Visiteur": `visiteur-${++visiteur}`, "X-Session-Compte": jeton, ...(corps === undefined ? {} : { "Content-Type": "application/json" }) },
    ...(corps === undefined ? {} : { body: JSON.stringify(corps) }),
  });
  return { statut: reponse.status, corps: (await reponse.json()) as Corps };
}

let numero = 0;
async function creerCompteEtSession(statut: StatutAmbassadeur = "actif") {
  const id = await memoire.services.creerCompte({
    email: `fondateur${++numero}@exemple.fr`, motDePasse: "scrypt$factice", prenom: "Camille", ville: "Lyon", quartier: null, cguVersion: "2026-10-08",
  });
  if (id === null) throw new Error("compte de test impossible");
  if (statut !== "en-attente") await memoire.decider(id, statut);
  const jeton = creerJeton();
  await memoire.sessions.creer(calculerEmpreinteJeton(jeton), { compteId: id, creeLe: horloge, activite: horloge });
  const lire = async () => (await demander("GET", "/comptes/moi/candidature", jeton)).corps;
  const candidater = (corps: Record<string, unknown>) => demander("POST", "/comptes/moi/candidature", jeton, corps);
  const changerCommune = (communeCode: unknown) => demander("POST", "/comptes/moi/candidature/commune", jeton, { communeCode });
  return { id, jeton, lire, candidater, changerCommune };
}

const CANDIDATURE = {
  pepites: "La Fournée (pain au levain), Chez Mamie Rose (gratin), Le Petit Four (choux).", envies: ["denicher", "faire-savoir"],
  reseaux: "@zoe.miam", motivation: "Je connais tous les boulangers du quartier.", partantRencontre: true, connuPar: "Instagram",
};
const LYON = { code: "69123", type: "ville", nom: "Lyon", nomAvecDe: "de Lyon", places: 10 };

test("réservée aux ambassadeurs actifs, comme avant", async () => {
  const { jeton } = await creerCompteEtSession("en-attente");
  for (const [methode, chemin] of [["GET", "candidature"], ["POST", "candidature"], ["POST", "candidature/commune"]] as const) {
    const reponse = await demander(methode, `/comptes/moi/${chemin}`, jeton, methode === "POST" ? { ...CANDIDATURE, communeCode: "69123" } : undefined);
    assert.deepEqual([reponse.statut, reponse.corps], [403, { ok: false, erreur: "ambassadeur-non-actif" }]);
  }
});

test("la commune est obligatoire et doit exister ; la zone est calculée par l'API (un arrondissement compte pour sa ville)", async () => {
  const { id, lire, candidater } = await creerCompteEtSession();
  assert.deepEqual(await lire(), { ok: true, candidature: null, placesRestantes: 367 }, "sans candidature : les places de toute la France");
  for (const communeCode of [undefined, "", "6912", "ABCDE", "99999", 69123]) {
    assert.deepEqual((await candidater({ ...CANDIDATURE, communeCode })).corps, { ok: false, erreur: "champ-invalide", champ: "communeCode" }, String(communeCode));
  }
  // Les autres champs restent vérifiés, après la commune
  assert.deepEqual((await candidater({ ...CANDIDATURE, communeCode: "69123", motivation: "court" })).corps, { ok: false, erreur: "champ-invalide", champ: "motivation" });
  assert.equal(memoire.candidatures.some((candidature) => candidature.compteId === id), false);
  assert.equal((await candidater({ ...CANDIDATURE, communeCode: " 69383 " })).statut, 201, "Lyon 3e Arrondissement");
  const gardee = memoire.candidatures.at(-1);
  assert.deepEqual([gardee?.communeCode, gardee?.zoneCode], ["69123", "69123"]);
  assert.deepEqual(await lire(), {
    ok: true,
    candidature: {
      statut: "en-attente", numero: null, numeroLocal: null, numeroNational: null, commune: { code: "69123", nom: "Lyon", nomDepartement: "Rhône" },
      zone: { ...LYON, prises: 0, libres: 10 }, creeLe: new Date(horloge).toISOString(), reponduLe: null,
    },
    placesRestantes: 10,
  });
  assert.deepEqual((await candidater({ ...CANDIDATURE, communeCode: "69123" })).corps, { ok: false, erreur: "candidature-existante" });
});

test("une petite commune candidate pour son département ; un code corse en minuscules passe", async () => {
  const ain = await creerCompteEtSession();
  assert.equal((await ain.candidater({ ...CANDIDATURE, communeCode: "01001" })).statut, 201);
  const { candidature } = await ain.lire();
  assert.deepEqual(candidature?.commune, { code: "01001", nom: "L'Abergement-Clémenciat", nomDepartement: "Ain" });
  assert.deepEqual([candidature?.zone?.code, candidature?.zone?.type, candidature?.zone?.nom, candidature?.zone?.places], ["D01", "departement", "Ain", 1]);
  const corse = await creerCompteEtSession();
  assert.equal((await corse.candidater({ ...CANDIDATURE, communeCode: "2a004" })).statut, 201);
  assert.equal((await corse.lire()).candidature?.zone?.code, "2A004", "Ajaccio");
});

test("zone complète : 409 « plus-de-place » ; un fondateur « souvenir » libère sa place, sans que son numéro soit redonné", async () => {
  // Bondy : 1 place
  const premier = await creerCompteEtSession();
  assert.equal((await premier.candidater({ ...CANDIDATURE, communeCode: "93010" })).statut, 201);
  const second = await creerCompteEtSession();
  assert.equal((await second.candidater({ ...CANDIDATURE, communeCode: "93010" })).statut, 201, "en attente, la place n'est pas prise");
  assert.equal(memoire.repondreCandidature(premier.id, "acceptee"), true);
  assert.equal(memoire.repondreCandidature(second.id, "acceptee"), false, "l'équipe non plus ne dépasse pas les places");
  const vue = (await premier.lire()).candidature;
  assert.deepEqual([vue?.statut, vue?.numero, vue?.numeroLocal, vue?.zone?.prises, vue?.zone?.libres], ["acceptee", 1, 1, 1, 0]);
  assert.equal(typeof vue?.numeroNational, "number");
  assert.equal((await second.lire()).placesRestantes, 0);

  const troisieme = await creerCompteEtSession();
  const complet = await troisieme.candidater({ ...CANDIDATURE, communeCode: "93010" });
  assert.deepEqual([complet.statut, complet.corps], [409, { ok: false, erreur: "plus-de-place" }]);
  assert.equal(memoire.candidatures.some((candidature) => candidature.compteId === troisieme.id), false, "rien n'est gardé");
  assert.deepEqual((await troisieme.candidater({ ...CANDIDATURE, communeCode: "93010", pepites: "court" })).corps.erreur, "plus-de-place", "avant les autres champs");

  // Le fondateur déménage : il garde ses numéros, sa place se rouvre
  assert.equal(memoire.repondreCandidature(premier.id, "souvenir"), true);
  const souvenir = (await premier.lire()).candidature;
  assert.deepEqual([souvenir?.statut, souvenir?.numeroLocal, souvenir?.numeroNational, souvenir?.zone?.prises], ["souvenir", 1, vue?.numeroNational, 0]);
  assert.equal((await troisieme.candidater({ ...CANDIDATURE, communeCode: "93010" })).statut, 201);
  assert.equal(memoire.repondreCandidature(second.id, "acceptee"), true);
  const suivant = (await second.lire()).candidature;
  assert.equal(suivant?.numeroLocal, 2, "le n° 1 n'est jamais redonné");
  assert.equal(suivant?.numeroNational, (vue?.numeroNational ?? 0) + 1);
  // Parti dans une autre ville, l'ancien fondateur peut recandidater
  assert.equal((await premier.candidater({ ...CANDIDATURE, communeCode: "84007" })).statut, 201);
});

test("poser ou changer la commune d'une candidature en attente (une ancienne candidature n'en a pas)", async () => {
  const { id, lire, changerCommune } = await creerCompteEtSession();
  assert.deepEqual((await changerCommune("69123")).corps, { ok: false, erreur: "aucune-candidature" });
  assert.equal((await changerCommune("69123")).statut, 404);
  // Une candidature d'avant les fondateurs par ville : ni commune ni zone
  await memoire.services.creerCandidature(id, { ...CANDIDATURE, communeCode: null as unknown as string, zoneCode: null as unknown as string });
  const ancienne = await lire();
  assert.deepEqual([ancienne.candidature?.commune, ancienne.candidature?.zone, ancienne.placesRestantes], [null, null, 367 - 1]);
  assert.deepEqual((await changerCommune("99999")).corps, { ok: false, erreur: "champ-invalide", champ: "communeCode" });
  const posee = await changerCommune("13201");
  assert.equal(posee.statut, 200);
  assert.deepEqual([posee.corps.candidature?.commune?.nom, posee.corps.candidature?.zone?.code], ["Marseille", "13055"]);
  assert.deepEqual([memoire.candidatures.at(-1)?.communeCode, memoire.candidatures.at(-1)?.zoneCode], ["13055", "13055"]);
  // Vers une zone complète : refusé (Bondy est complète depuis le test précédent) ; la même zone passe toujours
  assert.deepEqual((await changerCommune("93010")).corps, { ok: false, erreur: "plus-de-place" });
  assert.equal((await changerCommune("13055")).statut, 200);
  // Une fois traitée par l'équipe, elle ne change plus
  memoire.repondreCandidature(id, "refusee");
  const traitee = await changerCommune("69123");
  assert.deepEqual([traitee.statut, traitee.corps], [409, { ok: false, erreur: "deja-traitee" }]);
});

test("un robot (champ piège) reçoit « ok » et ne laisse rien, même sans commune", async () => {
  const { id, candidater } = await creerCompteEtSession();
  assert.equal((await candidater({ ...CANDIDATURE, piege: "robot" })).statut, 201);
  assert.equal(memoire.candidatures.some((candidature) => candidature.compteId === id), false);
});
