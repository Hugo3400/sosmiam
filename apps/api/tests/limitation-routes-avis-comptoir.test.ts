// Tests par la route d'un compte limité, dans les avis, les réservations et au comptoir de l'équipe (décision de Hugo du
// 15 octobre 2026, docs/decisions.md, « Modération des avis et limitation d'un compte ») : 403 « compte-limite » { details:
// { jusqua } } sur ses avis, le petit mot d'une réservation et ce qu'il publierait pour son lieu (SOS du soir, message du
// moment, événements, réponse à un avis, récompense de fidélité), et rien n'est écrit ; le comptoir (valider une visite),
// ses propres visites, une réservation sans mot, les lectures, éteindre le programme et retirer ce qui est À LUI passent ;
// ce qui est aux autres (SOS ou événement d'un collègue, message du moment du lieu) reste ; les autres membres de l'équipe
// publient et retirent toujours. Monté par creerApplication, comme en vrai (les branchements de application.ts sont
// testés) : tout en mémoire, aucune base.
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { after, beforeEach, test } from "node:test";

import { DELAI_INVITATION_AVIS_MS, DUREE_INVITATION_AVIS_MS } from "../../../packages/commun/src/regles/visites.ts";
import { creerApplication } from "../src/application.ts";
import { calculerEmpreinteJeton } from "../src/fonctions/securite/calculer-empreinte-jeton.ts";
import { creerJeton } from "../src/fonctions/securite/creer-jeton.ts";
import { creerSignatureQr } from "../src/fonctions/securite/creer-signature-qr.ts";
import { creerAvisEnMemoire } from "../src/services/avis-en-memoire.ts";
import { creerChiffrementDonnees } from "../src/services/chiffrement-donnees.ts";
import { creerComptesEnMemoire } from "../src/services/comptes-en-memoire.ts";
import { creerEvenementsEnMemoire } from "../src/services/evenements-en-memoire.ts";
import { creerLimitationsEnMemoire } from "../src/services/limitations-comptes-en-memoire.ts";
import { creerMomentLieuEnMemoire } from "../src/services/moment-lieu-en-memoire.ts";
import type { RoleRattachement } from "../src/services/pro-regles.ts";
import { creerVisitesEnMemoire } from "../src/services/visites-en-memoire.ts";
import { LIEU_TEST as LIEU_EVENEMENTS } from "./outils/creer-banc-evenements.ts";
import { LIEU_TEST as LIEU_VISITES, SUR_PLACE } from "./outils/creer-banc-visites.ts";

/** Vendredi 9 octobre 2026, 12 h à Paris : le service du midi est ouvert (jusqu'à 14 h 30) */
const DEBUT = Date.parse("2026-10-09T10:00:00Z");
const JOUR = 86_400_000;
const banc = { horloge: DEBUT, tirage: 0 };
const horloge = () => banc.horloge;
const memoire = creerComptesEnMemoire(horloge);
const limitations = creerLimitationsEnMemoire(horloge);
const visites = creerVisitesEnMemoire();
const moment = creerMomentLieuEnMemoire((compteId) => visites.comptes.get(compteId)?.prenom ?? null);
const evenements = creerEvenementsEnMemoire();
const avis = creerAvisEnMemoire();
const chiffrement = creerChiffrementDonnees(new Uint8Array(32).fill(9));
const roles = new Map<string, RoleRattachement>();

const serveur = creerApplication({
  enregistrerInscription: async () => {},
  comptes: {
    services: memoire.services, sessions: memoire.sessions, zones: memoire.zones, courriels: memoire.courriels, pro: memoire.pro, horloge,
    limitations: limitations.services,
  },
  visitesApp: {
    depot: visites.depot, chiffrement, signerQr: creerSignatureQr(new Uint8Array(32).fill(3)), tirer: () => 1234 + banc.tirage++,
    lireRole: async (compteId, lieuId) => roles.get(`${compteId}:${lieuId}`) ?? null, ajouterPoints: async () => {},
    moment: moment.services, evenements: evenements.services, avis: { depot: avis.depot },
  },
  // Tirage à 7 : jamais relu au hasard
  avisApp: { depot: avis.depot, chiffrement, tirer: () => 7 },
}).listen(0, "127.0.0.1");
await new Promise<void>((pret) => serveur.once("listening", () => pret()));
const adresse = `http://127.0.0.1:${(serveur.address() as AddressInfo).port}`;
after(() => new Promise<void>((fini) => serveur.close(() => fini())));

/** Remet tout à zéro entre deux tests (les comptes et leurs sessions restent, les rôles partent) */
beforeEach(() => {
  banc.horloge = DEBUT;
  roles.clear();
  for (const compte of visites.comptes.values()) compte.rattachements.length = 0;
  for (const compte of avis.comptes.values()) compte.lieuxLies.length = 0;
  for (const liste of [visites.visites, visites.presentations, visites.cartes, visites.recompenses, visites.demandes, visites.reservations, visites.sos, moment.sos]) liste.length = 0;
  for (const liste of [avis.visites, avis.avis, avis.relectures, avis.pointsPhoto]) liste.length = 0;
  visites.programmes.clear();
  const comptesEvenements = new Map(evenements.comptes);
  evenements.vider();
  for (const [id, compte] of comptesEvenements) evenements.comptes.set(id, compte);
  visites.lieux.set(1, structuredClone(LIEU_VISITES));
  moment.lieux.set(1, { ouverture: structuredClone(LIEU_VISITES.ouverture), alerte: null, alerteJusqua: null });
  evenements.lieux.set(1, { ...LIEU_EVENEMENTS });
  // 1 : vérifié (il a un gérant) ; 2 : non vérifié, où l'on donne un avis sans visite
  avis.lieux.set(1, { id: 1, nom: "Chez Léa", emoji: "🍝", type: "resto", ville: "Montpellier", publie: true, verifie: true });
  avis.lieux.set(2, { id: 2, nom: "La Crêpe du Port", emoji: "🥞", type: "resto", ville: "Sète", publie: true, verifie: false });
});

async function demander(methode: string, chemin: string, jeton?: string, corps?: unknown) {
  const reponse = await fetch(`${adresse}${chemin}`, {
    method: methode,
    headers: { "X-IP-Visiteur": `v-${Math.random()}`, "Content-Type": "application/json", ...(jeton ? { Authorization: `Bearer ${jeton}` } : {}) },
    body: corps === undefined ? undefined : JSON.stringify(corps),
  });
  return { statut: reponse.status, corps: (await reponse.json()) as Record<string, any> };
}

let numero = 0;
/** Un compte avec session, connu des visites, des avis (créé il y a 30 jours : pas de relecture) et des événements */
async function creerCompte(prenom: string) {
  const id = await memoire.services.creerCompte({ email: `limite-pro${++numero}@exemple.fr`, motDePasse: "empreinte", prenom, ville: "", quartier: null, cguVersion: "2026-10-08", espace: "pro" });
  if (typeof id !== "number") throw new Error("compte de test impossible");
  const jeton = creerJeton();
  await memoire.sessions.creer(calculerEmpreinteJeton(jeton), { compteId: id, creeLe: banc.horloge, activite: banc.horloge, support: "app" });
  visites.comptes.set(id, { id, prenom, avatar: "🦊", nomChiffre: null, emailVerifie: true, rattachements: [] });
  avis.comptes.set(id, { id, prenom, nomChiffre: null, emailVerifie: true, creeLe: new Date(banc.horloge - 30 * JOUR), lieuxLies: [] });
  evenements.comptes.set(id, { prenom });
  return { id, jeton };
}

/** Un compte rattaché au lieu 1 (rôle validé) */
async function creerMembre(prenom: string, role: RoleRattachement) {
  const compte = await creerCompte(prenom);
  roles.set(`${compte.id}:1`, role);
  visites.comptes.get(compte.id)?.rattachements.push({ lieuId: 1, role });
  avis.comptes.get(compte.id)?.lieuxLies.push(1);
  return compte;
}

async function limiter(compteId: number, fin: Date | null = new Date(banc.horloge + 7 * JOUR)) {
  const r = await limitations.services.limiterCompte({ compteId, motif: "haine", motivation: "Des messages insultants envoyés à plusieurs personnes.", fin });
  if (!r.ok) throw new Error(`limitation de test impossible : ${JSON.stringify(r)}`);
  return r.limitation;
}
const refus = (jusqua: Date | null) => ({ ok: false, erreur: "compte-limite", details: { jusqua: jusqua?.toISOString() ?? null } });

/** Une visite validée au comptoir du lieu `lieuId`, dans les données des avis : son avis est ouvert (1 h après) */
function creerVisiteAvis(compteId: number, lieuId: number) {
  const valideLe = new Date(banc.horloge - 2 * 3600_000);
  const id = avis.visites.length + 1;
  avis.visites.push({
    id, compteId, lieuId, mode: "comptoir", statut: "validee", code: null, creeLe: valideLe, expireLe: null, valideLe, decideLe: valideLe,
    decideParId: null, pendantSos: false, points: 15, tampon: false, resultatPosition: "dans-rayon", motifRefus: null, contestee: false,
    contestation: null, avisOuvertLe: new Date(valideLe.getTime() + DELAI_INVITATION_AVIS_MS),
    avisFermeLe: new Date(valideLe.getTime() + DELAI_INVITATION_AVIS_MS + DUREE_INVITATION_AVIS_MS), avisDonne: false, presentationId: null,
    reservationId: null, annulableJusqua: null, reglement: { type: "paye", reductionPourcent: null, avantages: [] },
  });
  return id;
}

const TEXTE_AVIS = "Des pâtes fraîches comme en Italie, et un accueil adorable.";
const REPONSE = "Merci beaucoup ! Le tiramisu t'attend pour la prochaine fois.";
/** Un quiz le jeudi 15 octobre, de 20 h à 22 h (Paris) */
const QUIZ = {
  titre: "Quiz musical du jeudi", type: "quiz", description: "Viens avec ta bande, on fournit les buzzers.",
  debut: "2026-10-15T18:00:00.000Z", fin: "2026-10-15T20:00:00.000Z", hebdoJusqua: null,
  tarif: "gratuit", prixCentimes: null, places: null, alcool: false,
};
const PROGRAMME = { actif: true, visitesRequises: 5, recompense: "Un café gourmand", alcool: false, recompenseSansAlcool: null };

/** Ce que le lieu publie : chaque geste, avec le corps qu'il faut */
async function publier(jeton: string, avisId: number, evenementId: number) {
  return {
    sos: await demander("POST", "/pro/comptoir/lieux/1/sos", jeton, { places: 4 }),
    message: await demander("PUT", "/pro/comptoir/lieux/1/message", jeton, { texte: "Terrasse au soleil" }),
    creerEvenement: await demander("POST", "/pro/comptoir/lieux/1/evenements", jeton, QUIZ),
    modifierEvenement: await demander("PUT", `/pro/comptoir/lieux/1/evenements/${evenementId}`, jeton, { ...QUIZ, titre: "Quiz rock du jeudi" }),
    reponse: await demander("POST", `/pro/comptoir/avis/${avisId}/reponse`, jeton, { texte: REPONSE }),
    programme: await demander("PUT", "/pro/comptoir/lieux/1/programme", jeton, PROGRAMME),
  };
}
const statuts = (r: Awaited<ReturnType<typeof publier>>) => Object.fromEntries(Object.entries(r).map(([geste, { statut }]) => [geste, statut]));

test("compte limité, au comptoir : rien de ce que le lieu publie ne passe, rien n'est écrit ; levée, tout repasse", async () => {
  const gerant = await creerMembre("Max", "gerant");
  const evenementId = (await demander("POST", "/pro/comptoir/lieux/1/evenements", gerant.jeton, QUIZ)).corps.evenement.id as number;
  const { id: avisId } = await avis.depot.ecrire((t) => t.creerAvis({
    compteId: 999, lieuId: 1, visiteId: null, note: 4, texte: TEXTE_AVIS, photo: null, signature: "Sam B.", statut: "publie",
    raisonRelecture: null, repasOffert: false, creeLe: new Date(banc.horloge),
  }));
  const fin = new Date(banc.horloge + 7 * JOUR);
  const limitation = await limiter(gerant.id, fin);

  const refuses = await publier(gerant.jeton, avisId, evenementId);
  for (const [geste, r] of Object.entries(refuses)) assert.deepEqual([r.statut, r.corps], [403, refus(fin)], geste);
  // Rien n'a bougé : ni SOS, ni message, un seul événement (pas renommé), pas de réponse, pas de programme
  assert.deepEqual([moment.sos.length, moment.lieux.get(1)?.alerte], [0, null]);
  assert.deepEqual(evenements.evenements.map((e) => e.titre), [QUIZ.titre]);
  assert.equal(avis.avis.find((a) => a.id === avisId)?.reponseTexte, null);
  assert.equal(visites.programmes.size, 0);
  // Lire reste permis
  for (const lecture of ["/pro/comptoir/lieux/1", "/pro/comptoir/lieux/1/moment", "/pro/comptoir/lieux/1/evenements", "/pro/comptoir/lieux/1/avis", "/pro/comptoir/lieux/1/programme"]) {
    assert.equal((await demander("GET", lecture, gerant.jeton)).statut, 200, lecture);
  }

  const levee = await limitations.services.leverLimitation(limitation.id, new Date(banc.horloge));
  assert.ok(levee.ok);
  const repasses = await publier(gerant.jeton, avisId, evenementId);
  assert.deepEqual(statuts(repasses), { sos: 201, message: 200, creerEvenement: 201, modifierEvenement: 200, reponse: 201, programme: 200 });
});

test("compte limité, au comptoir : il retire son SOS et son événement, et les autres membres de l'équipe publient toujours", async () => {
  const gerant = await creerMembre("Max", "gerant");
  const serveuse = await creerMembre("Nina", "equipe");
  const evenementId = (await demander("POST", "/pro/comptoir/lieux/1/evenements", serveuse.jeton, QUIZ)).corps.evenement.id as number;
  assert.equal((await demander("POST", "/pro/comptoir/lieux/1/sos", serveuse.jeton, { places: 6 })).statut, 201);
  assert.equal((await demander("PUT", "/pro/comptoir/lieux/1/message", serveuse.jeton, { texte: "Happy hour jusqu'à 14 h" })).statut, 200);
  await limiter(serveuse.id, null);
  // Jusqu'à nouvel ordre : jusqua null
  assert.deepEqual((await demander("POST", "/pro/comptoir/lieux/1/evenements", serveuse.jeton, QUIZ)).corps, refus(null));

  // Son SOS et son événement : à elle, elle les retire
  const sos = await demander("DELETE", "/pro/comptoir/lieux/1/sos", serveuse.jeton);
  assert.deepEqual([sos.statut, sos.corps.moment.sos.enCours], [200, false]);
  const annule = await demander("DELETE", `/pro/comptoir/lieux/1/evenements/${evenementId}`, serveuse.jeton);
  assert.deepEqual([annule.statut, annule.corps.evenement.statut], [200, "annule"]);
  // Le message du moment ne garde pas qui l'a écrit : il est au lieu, elle ne l'efface plus
  const message = await demander("DELETE", "/pro/comptoir/lieux/1/message", serveuse.jeton);
  assert.deepEqual([message.statut, message.corps], [403, refus(null)]);
  assert.equal(moment.lieux.get(1)?.alerte, "Happy hour jusqu'à 14 h");
  // Le gérant, lui, n'est pas limité : il publie pour le lieu, et efface le message
  assert.equal((await demander("PUT", "/pro/comptoir/lieux/1/message", gerant.jeton, { texte: "Salle calme ce soir" })).statut, 200);
  assert.equal((await demander("POST", "/pro/comptoir/lieux/1/evenements", gerant.jeton, QUIZ)).statut, 201);
  const efface = await demander("DELETE", "/pro/comptoir/lieux/1/message", gerant.jeton);
  assert.deepEqual([efface.statut, efface.corps.moment.message], [200, null]);
});

test("compte limité, au comptoir : le SOS et l'événement d'un collègue restent ; un collègue non limité les retire", async () => {
  const gerant = await creerMembre("Max", "gerant");
  const serveuse = await creerMembre("Nina", "equipe");
  const serveur = await creerMembre("Léo", "equipe");
  assert.equal((await demander("POST", "/pro/comptoir/lieux/1/sos", serveuse.jeton, { places: 6 })).statut, 201);
  const evenementId = (await demander("POST", "/pro/comptoir/lieux/1/evenements", serveuse.jeton, QUIZ)).corps.evenement.id as number;
  const dejaAnnule = (await demander("POST", "/pro/comptoir/lieux/1/evenements", serveuse.jeton, { ...QUIZ, titre: "Blind test du jeudi" })).corps.evenement.id as number;
  assert.equal((await demander("DELETE", `/pro/comptoir/lieux/1/evenements/${dejaAnnule}`, serveuse.jeton)).statut, 200);
  const fin = new Date(banc.horloge + 7 * JOUR);
  await limiter(gerant.id, fin);

  // Ce que Nina a publié est à elle : le gérant limité n'y touche pas, et rien ne bouge
  for (const chemin of ["/pro/comptoir/lieux/1/sos", `/pro/comptoir/lieux/1/evenements/${evenementId}`]) {
    const r = await demander("DELETE", chemin, gerant.jeton);
    assert.deepEqual([r.statut, r.corps], [403, refus(fin)], chemin);
  }
  assert.deepEqual([moment.sos[0]?.arreteLe, evenements.evenements.find((e) => e.id === evenementId)?.annuleLe], [null, null]);
  // Un événement déjà annulé : rien ne change, rien à refuser
  assert.equal((await demander("DELETE", `/pro/comptoir/lieux/1/evenements/${dejaAnnule}`, gerant.jeton)).statut, 200);

  // Léo n'est pas limité : il arrête le SOS et annule l'événement de sa collègue, comme avant
  const sos = await demander("DELETE", "/pro/comptoir/lieux/1/sos", serveur.jeton);
  assert.deepEqual([sos.statut, sos.corps.moment.sos.enCours], [200, false]);
  const annule = await demander("DELETE", `/pro/comptoir/lieux/1/evenements/${evenementId}`, serveur.jeton);
  assert.deepEqual([annule.statut, annule.corps.evenement.statut], [200, "annule"]);
  // Plus de SOS en cours : rien à arrêter, ça passe même pour le gérant limité
  assert.equal((await demander("DELETE", "/pro/comptoir/lieux/1/sos", gerant.jeton)).statut, 200);
});

test("compte limité, programme de fidélité : l'éteindre passe, le créer, le rallumer ou le changer est refusé", async () => {
  const gerant = await creerMembre("Max", "gerant");
  const gerante = await creerMembre("Zoé", "gerant");
  assert.equal((await demander("PUT", "/pro/comptoir/lieux/1/programme", gerant.jeton, PROGRAMME)).statut, 200);
  const fin = new Date(banc.horloge + 7 * JOUR);
  await limiter(gerant.id, fin);
  const regler = (corps: unknown) => demander("PUT", "/pro/comptoir/lieux/1/programme", gerant.jeton, corps);

  // Changer la récompense ou le nombre de visites, même en l'éteignant : refusé, rien n'est écrit
  for (const corps of [{ ...PROGRAMME, recompense: "Un dessert offert" }, { ...PROGRAMME, actif: false, recompense: "Un dessert offert" }, { ...PROGRAMME, actif: false, visitesRequises: 6 }]) {
    const r = await regler(corps);
    assert.deepEqual([r.statut, r.corps], [403, refus(fin)], JSON.stringify(corps));
  }
  assert.deepEqual([visites.programmes.get(1)?.actif, visites.programmes.get(1)?.recompense], [true, "Un café gourmand"]);
  // L'éteindre, le reste tel qu'enregistré (espaces autour nettoyés) : permis, et de nouveau sans rien changer
  const eteint = await regler({ ...PROGRAMME, actif: false, recompense: "  Un café gourmand " });
  assert.equal(eteint.statut, 200, JSON.stringify(eteint.corps));
  assert.deepEqual([eteint.corps.programme.actif, eteint.corps.programme.recompense, eteint.corps.programme.visitesRequises], [false, "Un café gourmand", 5]);
  assert.equal((await regler({ ...PROGRAMME, actif: false })).statut, 200);
  // Le rallumer : refusé
  assert.deepEqual([(await regler(PROGRAMME)).statut, visites.programmes.get(1)?.actif], [403, false]);
  // Un membre d'équipe ne règle pas le programme (même s'il ne fait que l'éteindre), limité ou non
  const serveuse = await creerMembre("Nina", "equipe");
  await limiter(serveuse.id);
  const equipe = await demander("PUT", "/pro/comptoir/lieux/1/programme", serveuse.jeton, { ...PROGRAMME, actif: false });
  assert.deepEqual([equipe.statut, equipe.corps.erreur], [403, "role-requis"]);
  // Zoé n'est pas limitée : elle rallume et change la récompense, comme avant
  const rallume = await demander("PUT", "/pro/comptoir/lieux/1/programme", gerante.jeton, { ...PROGRAMME, recompense: "Un dessert offert" });
  assert.deepEqual([rallume.statut, rallume.corps.programme.actif, rallume.corps.programme.recompense], [200, true, "Un dessert offert"]);
  assert.equal((await demander("PUT", "/pro/comptoir/lieux/1/programme", gerante.jeton, { ...PROGRAMME, actif: false, recompense: "Un dessert offert" })).statut, 200);

  // Pas encore de programme : même éteint, le créer est refusé
  visites.programmes.clear();
  const cree = await regler({ ...PROGRAMME, actif: false });
  assert.deepEqual([cree.statut, cree.corps, visites.programmes.size], [403, refus(fin), 0]);
});

test("compte limité, réservation : sans petit mot, elle passe ; avec un mot, 403 et rien n'est écrit", async () => {
  visites.lieux.get(1)!.reservable = true;
  const lea = await creerCompte("Léa");
  const sam = await creerCompte("Sam");
  const fin = new Date(banc.horloge + 3 * JOUR);
  await limiter(lea.id, fin);
  const DEMANDE = { lieuId: 1, personnes: 2, jour: "2026-10-09", heure: "20:00" };
  const reserver = (jeton: string, corps: Record<string, unknown>) => demander("POST", "/app/reservations", jeton, { ...DEMANDE, ...corps });

  // Un mot (ou quelque chose qui n'est pas un texte) : refusé avant le contrôleur
  for (const message of ["Une table en terrasse ?", "  Anniversaire  ", 42]) {
    const r = await reserver(lea.jeton, { message });
    assert.deepEqual([r.statut, r.corps], [403, refus(fin)], JSON.stringify(message));
  }
  assert.equal(visites.reservations.length, 0);
  // Sans mot (fait d'espaces, null, vide ou absent) : la demande passe, puis Léa l'annule (permis)
  for (const corps of [{ message: "   " }, { message: null }, { message: "" }, {}]) {
    const r = await reserver(lea.jeton, corps);
    assert.deepEqual([r.statut, r.corps.reservation?.message], [201, null], JSON.stringify(corps));
    assert.equal((await demander("POST", `/app/reservations/${r.corps.reservation.id}/annuler`, lea.jeton)).statut, 200);
  }
  // Sam n'est pas limité : son mot passe
  const r = await reserver(sam.jeton, { message: "Une table en terrasse ?" });
  assert.deepEqual([r.statut, r.corps.reservation?.message], [201, "Une table en terrasse ?"]);
});

test("compte limité : le comptoir valide toujours les visites, et ses propres visites passent", async () => {
  const serveur = await creerMembre("Nina", "equipe");
  const client = await creerCompte("Léa");
  await limiter(serveur.id);
  await limiter(client.id);
  assert.equal((await demander("POST", "/pro/comptoir/lieux/1/qr", serveur.jeton, {})).statut, 200);
  const addition = await demander("POST", "/app/visites/addition", client.jeton, { lieuId: 1, position: SUR_PLACE });
  assert.equal(addition.statut, 201, JSON.stringify(addition.corps));
  const reglee = await demander("POST", `/pro/comptoir/visites/${addition.corps.visite.id}/reglee`, serveur.jeton, {});
  assert.equal(reglee.statut, 200, JSON.stringify(reglee.corps));
  assert.equal(visites.visites.find((v) => v.id === addition.corps.visite.id)?.statut, "validee");
});

test("compte limité : ses avis sont refusés, vérifiés ou non, et rien n'est écrit ; sans limitation, ils passent", async () => {
  const lea = await creerCompte("Léa");
  const sam = await creerCompte("Sam");
  const visiteLea = creerVisiteAvis(lea.id, 1);
  const visiteSam = creerVisiteAvis(sam.id, 1);
  const fin = new Date(banc.horloge + 3 * JOUR);
  await limiter(lea.id, fin);
  const verifie = await demander("POST", "/app/avis", lea.jeton, { visiteId: visiteLea, note: 5, texte: TEXTE_AVIS, photo: null });
  assert.deepEqual([verifie.statut, verifie.corps], [403, refus(fin)]);
  const nonVerifie = await demander("POST", "/app/avis/non-verifie", lea.jeton, { lieuId: 2, note: 4, texte: TEXTE_AVIS, photo: null });
  assert.deepEqual([nonVerifie.statut, nonVerifie.corps], [403, refus(fin)]);
  assert.deepEqual([avis.avis.length, avis.visites.find((v) => v.id === visiteLea)?.avisDonne], [0, false]);
  // Lire les avis d'un lieu et ses avis à écrire reste permis
  assert.equal((await demander("GET", "/app/avis/lieux/1")).statut, 200);
  assert.equal((await demander("GET", "/app/avis/a-ecrire", lea.jeton)).statut, 200);

  // Sam n'est pas limité : rien ne change pour lui
  assert.equal((await demander("POST", "/app/avis", sam.jeton, { visiteId: visiteSam, note: 5, texte: TEXTE_AVIS, photo: null })).statut, 201);
  assert.equal((await demander("POST", "/app/avis/non-verifie", sam.jeton, { lieuId: 2, note: 4, texte: TEXTE_AVIS, photo: null })).statut, 201);
  assert.deepEqual(avis.avis.map((a) => [a.compteId, a.lieuId]), [[sam.id, 1], [sam.id, 2]]);
});
