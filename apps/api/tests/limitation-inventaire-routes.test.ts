// Inventaire des écritures sociales de l'app face à un compte limité (décision de Hugo du 15 octobre 2026, docs/decisions.md,
// « Modération des avis et limitation d'un compte ») : un compte limité par la modération perd seulement ce que les AUTRES
// voient. Ce test parcourt la pile des routeurs sociaux de l'app (routes/social-app.ts) et range CHAQUE route d'écriture
// (POST, PUT, PATCH, DELETE) : soit refusée (refuserSiLimite, après la session et la limite par compte, avant le profil
// social et le corps d'un média), soit permise (liste explicite, avec la raison). Une route nouvelle et pas encore rangée
// fait échouer le test : il faut la mettre dans l'une des deux listes. Les lectures ne sont jamais refusées. Même inventaire,
// plus bas, pour les routeurs montés à part par application.ts : les avis (routes/avis.ts), les visites, la fidélité, les
// réservations (routes/reservations.ts) et le comptoir de l'équipe (routes/visites.ts et routes/comptoir.ts : ce que le lieu
// publie est refusé, le comptoir reste permis), avec une troisième liste : les écritures CONDITIONNELLES, refusées seulement
// dans certains cas (un petit mot, ce qui est à un collègue, un programme qu'on ne fait pas qu'éteindre).
import assert from "node:assert/strict";
import { test } from "node:test";

import express, { type RequestHandler } from "express";

import { creerSignatureQr } from "../src/fonctions/securite/creer-signature-qr.ts";
import { creerProtectionComptes, creerStockageSessionsComptesEnMemoire } from "../src/middlewares/proteger-comptes.ts";
import { creerRefuserSiLimite } from "../src/middlewares/refuser-si-limite.ts";
import { creerRoutesAvisApp } from "../src/routes/avis.ts";
import { creerRoutesReservationsApp } from "../src/routes/reservations.ts";
import { creerRoutesSocialesApp } from "../src/routes/social-app.ts";
import { creerRoutesVisites } from "../src/routes/visites.ts";
import { creerAvisEnMemoire } from "../src/services/avis-en-memoire.ts";
import { creerChiffrementDonnees } from "../src/services/chiffrement-donnees.ts";
import { creerEvenementsEnMemoire } from "../src/services/evenements-en-memoire.ts";
import { creerMomentLieuEnMemoire } from "../src/services/moment-lieu-en-memoire.ts";
import { creerSocialAppEnMemoire } from "../src/services/social-app-en-memoire.ts";
import { creerStatistiquesLieuEnMemoire } from "../src/services/statistiques-lieu-en-memoire.ts";
import { creerVisitesEnMemoire } from "../src/services/visites-en-memoire.ts";

/** Les écritures que les autres voient : refusées à un compte limité (403 compte-limite) */
const ECRITURES_REFUSEES = [
  // Bande et suivis : entrer dans la bande de quelqu'un, lui demander, le suivre
  "POST /app/bande/rejoindre",
  "POST /app/bande/demandes",
  "PUT /app/suivis-personnes/abonnements/:personne",
  // Messagerie : créer, renommer, inviter, écrire, envoyer une photo ou une note vocale, réagir
  "POST /app/conversations/groupes",
  "PATCH /app/conversations/:id",
  "POST /app/conversations/:id/invites",
  // Décision de Hugo du 15/10/2026 : un compte limité ne redistribue pas les pouvoirs d'un groupe (retirer quelqu'un reste permis)
  "PUT /app/conversations/:id/membres/:personne/role",
  "POST /app/conversations/:id/messages",
  "POST /app/conversations/:id/medias",
  "PUT /app/conversations/:id/messages/:messageId/reactions/:reaction",
  "POST /app/lieux-envoyes",
  // Sorties : créer, inviter, proposer un lieu
  "POST /app/sorties",
  "POST /app/sorties/:id/invites",
  "POST /app/sorties/:id/propositions",
  // Listes : créer, modifier, ajouter un lieu, inviter un co-auteur
  "POST /app/listes",
  "PATCH /app/listes/:id",
  "PUT /app/listes/:id/lieux/:lieuId",
  "POST /app/listes/:id/co-auteurs",
  // Commentaires : écrire, modifier
  "POST /app/commentaires/publications/:publicationId",
  "PATCH /app/commentaires/:id",
];

/** Les écritures qui restent permises à un compte limité, et pourquoi */
const ECRITURES_PERMISES = new Map<string, string>([
  ["POST /app/social/moi", "ouvrir son profil social (Potes) : le pseudo et l'avatar passent par /comptes"],
  ["PATCH /app/social/moi", "réglages sociaux"],
  ["POST /app/personnes/recherche", "une lecture (le début cherché passe dans le corps)"],
  ["PUT /app/masques/:cible/:cibleId", "masquer pour soi"],
  ["DELETE /app/masques/:cible/:cibleId", "annuler un masque"],
  ["POST /app/cloche/vu", "marquer lu"],
  ["POST /app/bande/invitation/renouveler", "changer son propre code d'invitation"],
  ["POST /app/bande/demandes/:personne/accepter", "accepter une demande"],
  ["DELETE /app/bande/demandes/:personne", "refuser une demande reçue, ou annuler la sienne"],
  ["DELETE /app/bande/:personne", "retirer un pote (quitter)"],
  ["PUT /app/blocages/:personne", "bloquer"],
  ["DELETE /app/blocages/:personne", "débloquer"],
  ["DELETE /app/suivis-personnes/abonnements/:personne", "ne plus suivre"],
  ["POST /app/suivis-personnes/demandes/:personne/accepter", "accepter une demande"],
  ["DELETE /app/suivis-personnes/demandes/:personne", "refuser une demande"],
  ["DELETE /app/suivis-personnes/abonnes/:personne", "retirer un abonné"],
  ["PUT /app/suivis-personnes/confidentialite", "réglages sociaux (privé ou public)"],
  ["POST /app/conversations/prive", "ouvrir le privé avec un pote, sans texte (les messages, eux, sont refusés)"],
  ["POST /app/conversations/:id/reponse", "accepter ou refuser une invitation"],
  ["DELETE /app/conversations/:id/membres/:personne", "quitter un groupe, ou un admin retire un membre"],
  ["PUT /app/conversations/:id/notifications", "couper les notifications"],
  ["PUT /app/conversations/:id/lu", "marquer lu"],
  ["POST /app/conversations/:id/effacer", "effacer la discussion pour soi"],
  ["DELETE /app/conversations/:id/messages/:messageId", "supprimer son message"],
  ["DELETE /app/conversations/:id/messages/:messageId/reactions/:reaction", "retirer sa réaction"],
  ["PUT /app/lieux-envoyes/vus", "marquer lu"],
  ["DELETE /app/sorties/:id", "annuler sa sortie (supprimer son contenu)"],
  ["POST /app/sorties/:id/reponse", "accepter ou refuser une invitation"],
  ["PUT /app/sorties/:id/votes/:lieuId", "voter"],
  ["DELETE /app/sorties/:id/votes/:lieuId", "retirer son vote"],
  ["POST /app/sorties/:id/terminer-vote", "l'organisateur clôt le vote (rien d'écrit)"],
  ["DELETE /app/sorties/:id/participants/:personne", "l'organisateur retire quelqu'un"],
  ["DELETE /app/sorties/:id/participation", "quitter"],
  ["DELETE /app/listes/:id", "supprimer sa liste"],
  ["DELETE /app/listes/:id/lieux/:lieuId", "retirer un lieu"],
  ["POST /app/listes/:id/co-auteurs/moi/accepter", "accepter une invitation"],
  ["DELETE /app/listes/:id/co-auteurs/:personne", "refuser une invitation, ne plus remplir la liste, ou l'auteur retire un co-auteur"],
  ["PUT /app/listes/:id/abonnement", "suivre une liste"],
  ["DELETE /app/listes/:id/abonnement", "ne plus suivre une liste"],
  ["DELETE /app/commentaires/:id", "supprimer son commentaire"],
  ["PUT /app/commentaires/:id/jaime", "J'aime"],
  ["DELETE /app/commentaires/:id/jaime", "retirer son J'aime"],
  ["PUT /app/commentaires/:id/masque", "le gérant masque au nom du lieu (le commentaire part en modération)"],
  ["DELETE /app/commentaires/:id/masque", "le gérant démasque"],
  ["POST /app/signalements", "signaler"],
  ["POST /app/moderation/:id/contestation", "contester une décision"],
]);

/** Hors de la pile sociale (avis, visites, fidélité, réservations, comptoir) : ce que les autres verraient, refusé à un compte limité */
const ECRITURES_REFUSEES_HORS_SOCIAL = [
  // Un avis, vérifié ou non : il se lit sur la page du lieu
  "POST /app/avis",
  "POST /app/avis/non-verifie",
  // Ce que le lieu publie (décision de Hugo du 15/10/2026, espace pro) : le SOS du soir, le message du moment, ses
  // événements, sa réponse à un avis
  "POST /pro/comptoir/lieux/:id/sos",
  "PUT /pro/comptoir/lieux/:id/message",
  // Le message du moment ne garde pas qui l'a écrit : il est au lieu, donc aux autres (les collègues non limités l'effacent)
  "DELETE /pro/comptoir/lieux/:id/message",
  "POST /pro/comptoir/lieux/:id/evenements",
  "PUT /pro/comptoir/lieux/:id/evenements/:evenementId",
  "POST /pro/comptoir/avis/:avisId/reponse",
];

/** Hors de la pile sociale : les écritures qui restent permises à un compte limité, et pourquoi */
const ECRITURES_PERMISES_HORS_SOCIAL = new Map<string, string>([
  ["POST /app/avis/:id/relecture", "verdict consultatif d'un ambassadeur, que seule l'équipe SOS Miam lit"],
  ["POST /app/visites/addition", "demander l'addition : les visites restent permises"],
  ["POST /app/visites/comptoir", "scanner le QR du comptoir : une visite"],
  ["POST /app/visites/:id/annuler", "annuler sa demande d'addition"],
  ["POST /app/visites/:id/contester", "contester un refus (seule l'équipe SOS Miam le lit)"],
  ["POST /app/fidelite/cartes/:lieuId/demande", "demander sa récompense"],
  ["DELETE /app/fidelite/cartes/:lieuId/demande", "annuler sa demande de récompense"],
  ["POST /pro/comptoir/lieux/:id/qr", "le comptoir : montrer le QR qui valide les visites"],
  ["DELETE /pro/comptoir/lieux/:id/qr", "le comptoir : éteindre ce QR"],
  ["POST /pro/comptoir/visites/:visiteId/reglee", "le comptoir : valider une visite"],
  ["POST /pro/comptoir/visites/:visiteId/refuser", "le comptoir : refuser une visite (motif d'une liste fermée)"],
  ["POST /pro/comptoir/visites/:visiteId/annuler", "le comptoir : annuler une validation faite par erreur"],
  ["POST /pro/comptoir/recompenses/:demandeId/offrir", "le comptoir : offrir la récompense d'un client"],
  ["POST /pro/comptoir/reservations/:reservationId/accepter", "répondre à une réservation"],
  ["POST /pro/comptoir/reservations/:reservationId/refuser", "répondre à une réservation (motif d'une liste fermée)"],
  ["POST /pro/comptoir/reservations/:reservationId/annuler", "annuler une réservation acceptée (motif d'une liste fermée)"],
  ["POST /pro/comptoir/reservations/:reservationId/venu", "le client est arrivé : sa visite se valide"],
  ["POST /pro/comptoir/reservations/:reservationId/absent", "« Pas venu »"],
  ["POST /app/reservations/:id/annuler", "annuler sa réservation"],
  ["POST /app/reservations/:id/presence", "« Je suis là » : une visite"],
]);

/**
 * Hors de la pile sociale : les écritures refusées à un compte limité seulement dans certains cas (choix de la session App
 * du 15/10/2026, docs/decisions.md). « route » : refuserSiLimiteSi (middlewares/refuser-si-limite-selon.ts) sur la route,
 * à la place de refuserSiLimite ; « controleur » : rien sur la route, le contrôleur décide après le rôle et la ressource
 * relue (refuserSiLimiteIci), testé par la route dans limitation-routes-avis-comptoir.test.ts.
 */
const ECRITURES_CONDITIONNELLES_HORS_SOCIAL = new Map<string, { ou: "route" | "controleur"; quand: string }>([
  ["POST /app/reservations", { ou: "route", quand: "refusée avec un petit mot non vide (texte libre que lit le lieu) ; sans mot, une visite comme les autres" }],
  ["PUT /pro/comptoir/lieux/:id/programme", { ou: "controleur", quand: "l'éteindre sans rien y changer passe ; le créer, le rallumer ou changer la récompense est refusé" }],
  ["DELETE /pro/comptoir/lieux/:id/sos", { ou: "controleur", quand: "arrêter son propre SOS passe ; celui d'un collègue est refusé" }],
  ["DELETE /pro/comptoir/lieux/:id/evenements/:evenementId", { ou: "controleur", quand: "annuler son propre événement passe ; celui d'un collègue est refusé" }],
]);

/** Les middlewares reconnus par leur nom (les limites et la clé 🔐 sont anonymes) */
const SESSION = new Set(["limiteConnectee", "exigerCompte", "sansCache"]);
const APRES_LE_REFUS = ["lireProfilSocial", "exigerProfilSocial", "corpsMedia"];

type CoucheRoute = { name: string; method?: string };
type Couche = {
  name: string;
  handle: { stack?: Couche[] };
  route?: { path: string; methods: Record<string, boolean>; stack: CoucheRoute[] };
};
type RouteTrouvee = { cle: string; montage: string[]; pile: string[] };

/**
 * Construit la pile sociale en notant le chemin de chaque montage (routes.use(chemin, …)) : le routeur d'Express ne le garde
 * pas sous forme lisible. Router.prototype.use n'est remplacé que le temps de la construction.
 */
function construirePile() {
  const chemins = new WeakMap<object, string>();
  const prototype = (express.Router as unknown as { prototype: { use: (this: { stack: Couche[] }, ...a: unknown[]) => unknown } }).prototype;
  const useOriginal = prototype.use;
  prototype.use = function (this: { stack: Couche[] }, ...args: unknown[]) {
    const avant = this.stack.length;
    const resultat = useOriginal.apply(this, args);
    if (typeof args[0] === "string") for (const couche of this.stack.slice(avant)) chemins.set(couche, args[0]);
    return resultat;
  };
  try {
    const { dependances } = creerSocialAppEnMemoire();
    const protection = creerProtectionComptes(creerStockageSessionsComptesEnMemoire(), Date.now);
    const limiteConnectee: RequestHandler = function limiteConnectee(_q, _r, suite) {
      suite();
    };
    const pile = creerRoutesSocialesApp(dependances, protection, limiteConnectee, Date.now) as unknown as { stack: Couche[] };
    return { pile, chemins };
  } finally {
    prototype.use = useOriginal;
  }
}

/** Une route, une clé par méthode, avec sa propre pile de middlewares */
function lireRoute(route: NonNullable<Couche["route"]>, prefixe: string, montage: string[]): RouteTrouvee[] {
  const chemin = `${prefixe}${route.path === "/" ? "" : route.path}`;
  return Object.keys(route.methods).map((methode) => ({
    cle: `${methode.toUpperCase()} ${chemin}`, montage,
    pile: route.stack.filter((c) => c.method === undefined || c.method === methode).map((c) => c.name),
  }));
}

/** Toutes les routes de la pile, avec la chaîne de leur montage (session…) et leur propre pile de middlewares */
function parcourir(routeur: { stack: Couche[] }, chemins: WeakMap<object, string>, prefixe: string, montage: string[] = []): RouteTrouvee[] {
  const trouvees: RouteTrouvee[] = [];
  let chaine: { chemin: string; noms: string[] } = { chemin: "", noms: [] };
  for (const couche of routeur.stack) {
    if (couche.route) {
      trouvees.push(...lireRoute(couche.route, prefixe, montage));
      continue;
    }
    const chemin = chemins.get(couche) ?? "";
    if (couche.handle.stack) {
      const avant = chaine.chemin === chemin ? chaine.noms : [];
      trouvees.push(...parcourir(couche.handle as { stack: Couche[] }, chemins, `${prefixe}${chemin}`, [...montage, ...avant]));
      chaine = { chemin: "", noms: [] };
    } else if (chaine.chemin === chemin) {
      chaine.noms.push(couche.name);
    } else {
      chaine = { chemin, noms: [couche.name] };
    }
  }
  return trouvees;
}

const { pile, chemins } = construirePile();
const routes = parcourir(pile, chemins, "/app");
// Tout ce qui n'est pas une lecture est une écriture à classer : une route .all() (« _ALL ») ou une méthode inattendue
// ne passe pas en silence
const estEcriture = (cle: string) => !/^(GET|HEAD) /.test(cle);
const ecritures = routes.filter((r) => estEcriture(r.cle));

test("inventaire : chaque écriture sociale est rangée, refusée ou permise, et les listes sont à jour", () => {
  assert.ok(ecritures.length > 60, `la pile sociale a été trouvée (${ecritures.length} écritures)`);
  const cles = new Set(ecritures.map((r) => r.cle));
  assert.equal(cles.size, ecritures.length, "aucune écriture en double");
  const nonRangees = [...cles].filter((cle) => !ECRITURES_REFUSEES.includes(cle) && !ECRITURES_PERMISES.has(cle));
  assert.deepEqual(nonRangees, [], "écriture pas encore rangée : l'ajouter à ECRITURES_REFUSEES ou à ECRITURES_PERMISES");
  const disparues = [...ECRITURES_REFUSEES, ...ECRITURES_PERMISES.keys()].filter((cle) => !cles.has(cle));
  assert.deepEqual(disparues, [], "route rangée qui n'existe plus : la retirer de la liste");
  assert.deepEqual(ECRITURES_REFUSEES.filter((cle) => ECRITURES_PERMISES.has(cle)), [], "jamais refusée ET permise");
  assert.equal(new Set(ECRITURES_REFUSEES).size, ECRITURES_REFUSEES.length);
});

test("inventaire : les écritures refusées portent refuserSiLimite après la session et la limite, avant le profil social et le média", () => {
  for (const cle of ECRITURES_REFUSEES) {
    const route = ecritures.find((r) => r.cle === cle);
    assert.ok(route, cle);
    const { montage, pile: middlewares } = route;
    const iRefus = middlewares.indexOf("refuserSiLimite");
    assert.ok(iRefus >= 0, `${cle} : refuserSiLimite manque`);
    assert.equal(middlewares.lastIndexOf("refuserSiLimite"), iRefus, `${cle} : refuserSiLimite une seule fois`);
    // La session : dans le montage du domaine, ou en tête de la route (les commentaires montent leur propre chaîne)
    const iSession = middlewares.indexOf("exigerCompte");
    assert.ok(montage.includes("exigerCompte") || (iSession >= 0 && iSession < iRefus), `${cle} : refuserSiLimite après la session`);
    // La limite par compte juste avant : seulement des middlewares anonymes (les limites) entre la session et le refus
    const avant = middlewares.slice(0, iRefus).filter((nom) => !SESSION.has(nom));
    assert.ok(avant.length >= 1, `${cle} : une limite par compte avant refuserSiLimite`);
    assert.ok(avant.every((nom) => nom === "<anonymous>"), `${cle} : seulement des limites avant refuserSiLimite (${avant.join(", ")})`);
    assert.ok(middlewares.includes("exigerProfilSocial"), `${cle} : une écriture qui demande un pseudo`);
    for (const nom of APRES_LE_REFUS) {
      const i = middlewares.indexOf(nom);
      assert.ok(i === -1 || i > iRefus, `${cle} : ${nom} après refuserSiLimite`);
    }
  }
  const media = ecritures.find((r) => r.cle === "POST /app/conversations/:id/medias");
  assert.ok(media && media.pile.indexOf("corpsMedia") > media.pile.indexOf("refuserSiLimite"), "le corps d'un média est lu après le refus");
});

test("inventaire : rien d'autre n'est refusé (lectures, gestes permis, montages)", () => {
  for (const route of routes) {
    assert.ok(!route.montage.includes("refuserSiLimite"), `${route.cle} : jamais sur tout un domaine`);
    if (ECRITURES_REFUSEES.includes(route.cle)) continue;
    assert.ok(!route.pile.includes("refuserSiLimite"), `${route.cle} : ${ECRITURES_PERMISES.get(route.cle) ?? "une lecture"}, jamais refusée`);
  }
  assert.ok(routes.some((r) => r.cle === "GET /app/conversations/:id"), "les lectures sont bien parcourues");
});

/** Un routeur sans sous-routeur : chaque route, avec les middlewares posés avant elle sur tout le routeur (routes.use) */
function parcourirPlat(routeur: { stack: Couche[] }, prefixe: string): RouteTrouvee[] {
  const trouvees: RouteTrouvee[] = [];
  const montage: string[] = [];
  for (const couche of routeur.stack) {
    assert.ok(!couche.handle.stack, `${prefixe} : un sous-routeur inattendu, à parcourir autrement`);
    if (couche.route) trouvees.push(...lireRoute(couche.route, prefixe, [...montage]));
    else montage.push(couche.name);
  }
  return trouvees;
}

/** Les routeurs des avis, des visites, de la fidélité et du comptoir, branchés comme application.ts (tout en mémoire) */
function construireHorsSocial() {
  const protection = creerProtectionComptes(creerStockageSessionsComptesEnMemoire(), Date.now);
  const limiteConnectee: RequestHandler = function limiteConnectee(_q, _r, suite) {
    suite();
  };
  const exigerMajeur: RequestHandler = function exigerMajeur(_q, _r, suite) {
    suite();
  };
  const refuserSiLimite = creerRefuserSiLimite(async () => null);
  const visites = creerVisitesEnMemoire();
  const avis = creerAvisEnMemoire();
  const chiffrement = creerChiffrementDonnees(new Uint8Array(32).fill(9));
  const dependances = {
    depot: visites.depot, chiffrement, signerQr: creerSignatureQr(new Uint8Array(32).fill(3)), tirer: () => 1234,
    lireRole: async () => null, ajouterPoints: async () => {}, moment: creerMomentLieuEnMemoire().services,
    statistiques: creerStatistiquesLieuEnMemoire().services, evenements: creerEvenementsEnMemoire().services, avis: { depot: avis.depot },
  };
  const routesVisites = creerRoutesVisites(dependances, protection, limiteConnectee, Date.now, exigerMajeur, refuserSiLimite);
  const routeurs: [string, unknown][] = [
    ["/app/avis", creerRoutesAvisApp({ depot: avis.depot, chiffrement, tirer: () => 0 }, protection, limiteConnectee, Date.now, refuserSiLimite)],
    ["/app/visites", routesVisites.visites],
    ["/app/fidelite", routesVisites.fidelite],
    ["/app/reservations", creerRoutesReservationsApp(dependances, protection, limiteConnectee, Date.now, refuserSiLimite)],
    ["/pro/comptoir", routesVisites.comptoir],
  ];
  return routeurs.flatMap(([prefixe, routeur]) => parcourirPlat(routeur as { stack: Couche[] }, prefixe));
}

const routesHorsSocial = construireHorsSocial();
const ecrituresHorsSocial = routesHorsSocial.filter((r) => estEcriture(r.cle));

test("inventaire des avis, des visites, des réservations et du comptoir : chaque écriture est rangée, refusée, permise ou conditionnelle", () => {
  assert.ok(ecrituresHorsSocial.length > 25, `les routeurs ont été trouvés (${ecrituresHorsSocial.length} écritures)`);
  const cles = new Set(ecrituresHorsSocial.map((r) => r.cle));
  assert.equal(cles.size, ecrituresHorsSocial.length, "aucune écriture en double");
  const listes = [ECRITURES_REFUSEES_HORS_SOCIAL, [...ECRITURES_PERMISES_HORS_SOCIAL.keys()], [...ECRITURES_CONDITIONNELLES_HORS_SOCIAL.keys()]];
  const nonRangees = [...cles].filter((cle) => !listes.some((liste) => liste.includes(cle)));
  assert.deepEqual(nonRangees, [], "écriture pas encore rangée : l'ajouter aux refusées, aux permises ou aux conditionnelles (HORS_SOCIAL)");
  const disparues = listes.flat().filter((cle) => !cles.has(cle));
  assert.deepEqual(disparues, [], "route rangée qui n'existe plus : la retirer de la liste");
  assert.equal(new Set(listes.flat()).size, listes.flat().length, "une seule liste par écriture, une seule fois");
  // Les deux inventaires ne se recouvrent pas
  assert.deepEqual(ecritures.filter((r) => cles.has(r.cle)), []);
});

test("inventaire des avis et du comptoir : refuserSiLimite après la session (et la majorité au comptoir) et la limite, juste devant le contrôleur", () => {
  for (const cle of ECRITURES_REFUSEES_HORS_SOCIAL) {
    const route = ecrituresHorsSocial.find((r) => r.cle === cle);
    assert.ok(route, cle);
    const { montage, pile: middlewares } = route;
    const iRefus = middlewares.indexOf("refuserSiLimite");
    assert.ok(iRefus >= 0, `${cle} : refuserSiLimite manque`);
    assert.equal(middlewares.lastIndexOf("refuserSiLimite"), iRefus, `${cle} : refuserSiLimite une seule fois`);
    assert.ok(montage.includes("limiteConnectee") && montage.includes("exigerCompte"), `${cle} : refuserSiLimite après la session`);
    if (cle.includes(" /pro/")) assert.ok(montage.includes("exigerMajeur"), `${cle} : après la majorité`);
    // Seulement la limite par compte (anonyme) avant, et le contrôleur juste après
    assert.ok(iRefus >= 1 && middlewares.slice(0, iRefus).every((nom) => nom === "<anonymous>"), `${cle} : seulement des limites avant refuserSiLimite`);
    assert.equal(iRefus, middlewares.length - 2, `${cle} : refuserSiLimite juste devant le contrôleur`);
  }
});

test("inventaire des réservations et du comptoir : les écritures conditionnelles, sur la route (après la session et la limite) ou dans le contrôleur", () => {
  for (const [cle, { ou, quand }] of ECRITURES_CONDITIONNELLES_HORS_SOCIAL) {
    const route = ecrituresHorsSocial.find((r) => r.cle === cle);
    assert.ok(route, cle);
    const { montage, pile: middlewares } = route;
    assert.ok(!middlewares.includes("refuserSiLimite"), `${cle} : ${quand}, jamais refusée d'office`);
    const iRefus = middlewares.indexOf("refuserSiLimiteSi");
    if (ou === "controleur") {
      assert.equal(iRefus, -1, `${cle} : le contrôleur décide (${quand})`);
      continue;
    }
    assert.ok(iRefus >= 0 && middlewares.lastIndexOf("refuserSiLimiteSi") === iRefus, `${cle} : refuserSiLimiteSi une fois`);
    assert.ok(montage.includes("limiteConnectee") && montage.includes("exigerCompte"), `${cle} : après la session`);
    assert.ok(iRefus >= 1 && middlewares.slice(0, iRefus).every((nom) => nom === "<anonymous>"), `${cle} : seulement des limites avant`);
    assert.equal(iRefus, middlewares.length - 2, `${cle} : juste devant le contrôleur`);
  }
});

test("inventaire des avis, des visites, des réservations et du comptoir : rien d'autre n'est refusé (lectures, comptoir, retirer le sien)", () => {
  for (const route of routesHorsSocial) {
    assert.ok(!route.montage.includes("refuserSiLimite") && !route.montage.includes("refuserSiLimiteSi"), `${route.cle} : jamais sur tout un routeur`);
    if (ECRITURES_REFUSEES_HORS_SOCIAL.includes(route.cle) || ECRITURES_CONDITIONNELLES_HORS_SOCIAL.has(route.cle)) continue;
    const pourquoi = ECRITURES_PERMISES_HORS_SOCIAL.get(route.cle) ?? "une lecture";
    assert.ok(!route.pile.includes("refuserSiLimite") && !route.pile.includes("refuserSiLimiteSi"), `${route.cle} : ${pourquoi}, jamais refusée`);
  }
  for (const lecture of ["GET /app/avis/lieux/:lieuId", "GET /pro/comptoir/lieux/:id/moment", "GET /pro/comptoir/lieux/:id/evenements", "GET /pro/comptoir/lieux/:id/avis"]) {
    assert.ok(routesHorsSocial.some((r) => r.cle === lecture), `${lecture} : les lectures sont bien parcourues`);
  }
});
