// Mes infos sans réseau, les fuites d'un compte à l'autre (une réponse de A arrivée chez B), et l'ordre « marque, puis
// profil » sur le téléphone. Chaque essai monte son propre serveur en doublure, au plus simple.
import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { creerMoteurSynchroProfil } from "~/services/synchro-profil";
import { CLE_SYNCHRO, LOCAL, VU, etat, lireEtatGarde } from "./banc/donnees.mjs";
import { lireMinuteriesPosees, oublierMinuteries, pause } from "./banc/minuteries.mjs";
import { remettreDoublures } from "./banc/serveur.mjs";

beforeEach(remettreDoublures);

/** Un serveur qui accepte tout, sauf ce que `comptes.patch`, `comptes.lire` ou `moderation.lister` répondent à sa place */
function monterSimple({ comptes = {}, moderation = {} } = {}) {
  const journal = { demandes: [], vues: [], profils: [] };
  let serveur = structuredClone(VU);
  const c = {
    lireProfil: async () => {
      journal.demandes.push("GET");
      return comptes.lire ? comptes.lire(serveur) : { ok: true, profil: structuredClone(serveur) };
    },
    modifierProfil: async (m) => {
      journal.demandes.push("PATCH " + JSON.stringify(m));
      if (comptes.patch) return comptes.patch(m, serveur);
      serveur = { ...serveur, ...m };
      return { ok: true, profil: structuredClone(serveur) };
    },
  };
  const mod = { listerDecisions: async () => (moderation.lister ? moderation.lister() : { ok: true, decisions: [] }) };
  const moteur = creerMoteurSynchroProfil({
    comptes: c,
    moderation: mod,
    rafraichirCompte: async () => {},
    afficherProfil: (p) => journal.profils.push(p),
    montrer: (v) => journal.vues.push(v),
  });
  return { moteur, journal, poserServeur: (s) => (serveur = s) };
}

/** L'état gardé, sa date de lecture vérifiée puis mise de côté (elle change à chaque passage) */
function lireEtatSansDate() {
  const garde = lireEtatGarde();
  assert.equal(typeof garde?.luLe, "number");
  assert.ok(garde.luLe > 0, "le serveur a été lu");
  return { ...garde, luLe: "lu" };
}

test("1. Mes infos sans réseau (ville) : une seule demande, gardé sur le téléphone, nouvel essai dans 30 s", async () => {
  oublierMinuteries();
  const horsLigne = async () => ({ ok: false, erreur: "hors-ligne" });
  const { moteur, journal } = monterSimple({ comptes: { patch: horsLigne, lire: horsLigne } });
  moteur.poserProfil(structuredClone(LOCAL));
  moteur.charger();
  await pause(5);
  moteur.activer(true);
  await pause(20);
  journal.demandes.length = 0;
  oublierMinuteries();
  const r = await moteur.modifierInfos({ ville: "Lyon" });
  await pause(30);
  assert.deepEqual(r, { ok: true, parti: false, attente: "reseau" });
  assert.deepEqual(journal.demandes, ['PATCH {"ville":"Lyon"}'], "une seule demande");
  assert.deepEqual(lireMinuteriesPosees(), [30000], "une seule minuterie posée : 30 s");
});

test("3. fuite : la liste des décisions de A répond après l'installation de B, rien n'arrive chez B", async () => {
  oublierMinuteries();
  let relacher;
  const attente = new Promise((r) => (relacher = r));
  const lister = async () => {
    await attente;
    return { ok: false, erreur: "hors-ligne" };
  };
  const { moteur, journal, poserServeur } = monterSimple({ moderation: { lister } });
  moteur.poserProfil(structuredClone(LOCAL));
  moteur.charger();
  await pause(5);
  moteur.activer(true); // 1re lecture : pseudoServeur = bob
  await pause(20);
  poserServeur({ ...VU, pseudo: "miami4821" }); // la modération passe
  moteur.auPremierPlan(); // luLe récent : pas de relecture… on la force
  moteur.activer(false);
  moteur.activer(true); // relecture : la liste des décisions attend
  await pause(20);
  await moteur.oublier(); // déconnexion
  moteur.poserProfil(null);
  await moteur.installer({ ...LOCAL, prenom: "Zoe", pseudo: "zoe" }); // autre compte
  relacher(); // la réponse tardive pour A arrive
  await pause(20);
  const derniere = journal.vues.at(-1);
  moteur.fermerAnnonce();
  assert.deepEqual(derniere, { annonce: null, pseudoMisDeCote: null }, "rien d'annoncé à B");
  // Le serveur du banc montre encore miami4821 à B : B garde ce qu'il a lu, sans annonce ni pseudo mis de côté
  assert.deepEqual(lireEtatSansDate(), {
    version: 1,
    premiereFaite: true,
    aEnvoyer: [],
    pseudoMisDeCote: null,
    annonce: null,
    luLe: "lu",
    pseudoServeur: "miami4821",
  });
});

test("fuite : déconnexion de A, connexion de B, puis la liste des décisions de A répond : B ne voit rien", async () => {
  const PROFIL_A = { prenom: "Hugo", pseudo: "bob", dateNaissance: "1995-01-01", ville: "Montpellier", envies: {}, creeLe: "2026-01-01T00:00:00.000Z" };
  const PROFIL_B = { prenom: "Zoe", pseudo: "zoe", dateNaissance: "1990-05-05", ville: "Lyon", envies: {}, creeLe: "2026-02-02T00:00:00.000Z" };
  const vu = (p) => ({ ...VU, prenom: p.prenom, pseudo: p.pseudo, dateNaissance: p.dateNaissance, ville: p.ville, envies: {}, age: 30 });
  let serveur = vu(PROFIL_A);
  let relacher;
  const attente = new Promise((r) => (relacher = r));
  const vues = [];
  const moteur = creerMoteurSynchroProfil({
    comptes: {
      lireProfil: async () => ({ ok: true, profil: structuredClone(serveur) }),
      modifierProfil: async () => ({ ok: true, profil: structuredClone(serveur) }),
    },
    moderation: {
      listerDecisions: async () => {
        await attente;
        return { ok: false, erreur: "hors-ligne" };
      },
    },
    rafraichirCompte: async () => {},
    afficherProfil: () => {},
    montrer: (v) => vues.push(v),
  });
  moteur.poserProfil({ ...PROFIL_A });
  moteur.charger();
  await pause(5);
  moteur.activer(true); // A : 1re lecture, pseudoServeur = bob
  await pause(20);
  serveur = { ...serveur, pseudo: "miami4821" }; // la modération retient le profil de A
  moteur.activer(false);
  moteur.activer(true); // relecture de A (retour dans l'app) : la liste des décisions traîne
  await pause(20);
  moteur.activer(false); // A se déconnecte
  await moteur.oublier();
  moteur.poserProfil(null);
  serveur = vu(PROFIL_B); // B se connecte
  await moteur.installer({ ...PROFIL_B });
  moteur.activer(true); // B : 1re lecture
  await pause(20);
  relacher(); // la réponse de A arrive enfin
  await pause(20);
  moteur.activer(false);
  moteur.activer(true); // B : relecture suivante (retour dans l'app)
  await pause(20);
  assert.deepEqual(vues.at(-1), { annonce: null, pseudoMisDeCote: null }, "vue montrée à B");
  assert.deepEqual(lireEtatSansDate(), {
    version: 1,
    premiereFaite: true,
    aEnvoyer: [],
    pseudoMisDeCote: null,
    annonce: null,
    luLe: "lu",
    pseudoServeur: "zoe",
  });
});

test("la marque « à envoyer » est gardée AVANT le profil, deux fois : app tuée entre les deux, rien n'est perdu", async () => {
  const local = { ...LOCAL, envies: {} };
  globalThis.__magasin = new Map(etat());
  const journal = [];
  const poser = globalThis.__magasin.set.bind(globalThis.__magasin);
  globalThis.__magasin.set = (cle, valeur) => {
    if (cle === CLE_SYNCHRO) journal.push("marque:" + JSON.stringify(JSON.parse(valeur).aEnvoyer.map((m) => m.champ)));
    return poser(cle, valeur);
  };
  globalThis.__ecritures = new Proxy([], {
    get(liste, propriete) {
      if (propriete === "push") {
        return (p) => {
          journal.push("profil:" + p.ville + "/" + JSON.stringify(p.envies));
          return liste.push(p);
        };
      }
      return liste[propriete];
    },
  });
  const vu = { ...VU, envies: {} };
  const moteur = creerMoteurSynchroProfil({
    comptes: { lireProfil: async () => ({ ok: true, profil: structuredClone(vu) }), modifierProfil: async () => ({ ok: false, erreur: "hors-ligne" }) },
    moderation: { listerDecisions: async () => ({ ok: true, decisions: [] }) },
    rafraichirCompte: async () => {},
    afficherProfil: () => {},
    montrer: () => {},
  });
  moteur.poserProfil({ ...local });
  moteur.charger();
  await pause(5);
  moteur.activer(true);
  await pause(20);
  journal.length = 0;
  await moteur.modifierInfos({ ville: "Lyon" });
  await pause(10);
  await moteur.modifierEnvies({ lieux: ["restos"] });
  await pause(10);
  const iMarqueVille = journal.findIndex((e) => e.startsWith("marque:") && e.includes("ville"));
  const iProfilVille = journal.findIndex((e) => e.startsWith("profil:Lyon"));
  const iMarqueEnvies = journal.findIndex((e) => e.startsWith("marque:") && e.includes("envies"));
  const iProfilEnvies = journal.findIndex((e) => e.includes("restos"));
  assert.ok(iMarqueVille >= 0 && iMarqueVille < iProfilVille, "ville : marque avant le profil | " + journal.join(" → "));
  assert.ok(iMarqueEnvies >= 0 && iMarqueEnvies < iProfilEnvies, "envies : marque avant le profil | " + journal.join(" → "));
  assert.deepEqual(journal, ['marque:["ville"]', "profil:Lyon/{}", 'marque:["ville","envies"]', 'profil:Lyon/{"lieux":["restos"]}']);
});
