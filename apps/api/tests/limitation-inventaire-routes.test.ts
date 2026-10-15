// Inventaire des écritures sociales de l'app face à un compte limité (décision de Hugo du 15 octobre 2026, docs/decisions.md,
// « Modération des avis et limitation d'un compte ») : un compte limité par la modération perd seulement ce que les AUTRES
// voient. Ce test parcourt la pile des routeurs sociaux de l'app (routes/social-app.ts) et range CHAQUE route d'écriture
// (POST, PUT, PATCH, DELETE) : soit refusée (refuserSiLimite, après la session et la limite par compte, avant le profil
// social et le corps d'un média), soit permise (liste explicite, avec la raison). Une route nouvelle et pas encore rangée
// fait échouer le test : il faut la mettre dans l'une des deux listes. Les lectures ne sont jamais refusées.
import assert from "node:assert/strict";
import { test } from "node:test";

import express, { type RequestHandler } from "express";

import { creerProtectionComptes, creerStockageSessionsComptesEnMemoire } from "../src/middlewares/proteger-comptes.ts";
import { creerRoutesSocialesApp } from "../src/routes/social-app.ts";
import { creerSocialAppEnMemoire } from "../src/services/social-app-en-memoire.ts";

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
  ["PUT /app/conversations/:id/membres/:personne/role", "un admin change un rôle (rien d'écrit)"],
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

// À brancher plus tard : les avis (routes/avis.ts, montées sur /app/avis par application.ts, hors de la pile sociale) se
// voient des autres, mais un autre chantier y travaille en ce moment. refuserSiLimite y sera posé avec lui ; ces deux routes
// passeront alors dans un inventaire des avis.
const A_BRANCHER_PLUS_TARD = ["POST /app/avis", "POST /app/avis/non-verifie"];

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

/** Toutes les routes de la pile, avec la chaîne de leur montage (session…) et leur propre pile de middlewares */
function parcourir(routeur: { stack: Couche[] }, chemins: WeakMap<object, string>, prefixe: string, montage: string[] = []): RouteTrouvee[] {
  const trouvees: RouteTrouvee[] = [];
  let chaine: { chemin: string; noms: string[] } = { chemin: "", noms: [] };
  for (const couche of routeur.stack) {
    if (couche.route) {
      const chemin = `${prefixe}${couche.route.path === "/" ? "" : couche.route.path}`;
      for (const methode of Object.keys(couche.route.methods)) {
        const pile = couche.route.stack.filter((c) => c.method === undefined || c.method === methode).map((c) => c.name);
        trouvees.push({ cle: `${methode.toUpperCase()} ${chemin}`, montage, pile });
      }
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
  assert.deepEqual(A_BRANCHER_PLUS_TARD.filter((cle) => cles.has(cle)), [], "les avis ne sont pas dans la pile sociale");
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
