// Tests de la bande de l'app (/app/bande) : lien et QR d'invitation (code sans date de fin, « Changer mon lien », lien qui
// a trop tourné, ancien lien après un changement de pseudo), demandes par pseudo (croisées, refus silencieux, expiration),
// retrait des deux côtés, 200 potes, « Quoi de neuf » et classement du mois de Paris, client commun (les blocages :
// bande-blocages.test.ts). Tout en mémoire (aucune base), avec une clé de test ; la version Prisma est essayée avec une
// fausse base (verrou, blocage relu dans la transaction).
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { after, before, test } from "node:test";

import { creerServicesSociauxApi } from "../../../packages/commun/src/client-api/api/creer-services-sociaux-api.ts";
import { creerClientHttp } from "../../../packages/commun/src/client-api/client-http.ts";
import { lireLienInvitation } from "../../../packages/commun/src/fonctions/potes/lire-lien-invitation.ts";
import { creerCodeInvitation } from "../src/fonctions/social/creer-code-invitation.ts";
import { ecrirePushBande } from "../src/fonctions/social/ecrire-push-bande.ts";
import { ecrireMoisParis } from "../src/services/bande-regles.ts";
import { creerChiffrementDonnees } from "../src/services/chiffrement-donnees.ts";
import { creerChiffrementSocial } from "../src/services/chiffrement-social.ts";
import { prendreId } from "../src/services/tables-sociales-en-memoire.ts";
import { creerBancSocial, type PersonneDeTest } from "./outils/creer-banc-social.ts";

// La version Prisma se branche sur la base au chargement, sans s'y connecter : une adresse d'essai suffit (fausse base)
process.env.DATABASE_URL ??= "postgresql://essai@127.0.0.1:1/essai";
const { creerBande } = await import("../src/services/bande.ts");

let banc: Awaited<ReturnType<typeof creerBancSocial>>;
before(async () => {
  banc = await creerBancSocial();
});
after(() => banc.fermer());

const JOUR = 24 * 60 * 60 * 1000;
const date = (decalageMs = 0) => new Date(banc.horloge.maintenant + decalageMs);
const inviter = async (p: PersonneDeTest) => (await p.demander("GET", "/app/bande/invitation")).corps.invitation as { pseudo: string; code: string; lien: string };
const rejoindre = (p: PersonneDeTest, invitation: { pseudo: string; code: string }) =>
  p.demander("POST", "/app/bande/rejoindre", { pseudo: invitation.pseudo, code: invitation.code, moyen: "qr" });
const potesDe = async (p: PersonneDeTest) => ((await p.demander("GET", "/app/bande")).corps.bande.membres as { personne: { id: string } }[]).map((m) => m.personne.id);
const clocheDe = (p: PersonneDeTest) => [...banc.tables.cloche.values()].filter((n) => n.compteId === p.compteId);

test("code d'invitation, notifications de la bande et mois de Paris : formes", () => {
  let n = 0;
  const code = creerCodeInvitation((max) => (n++ * 5) % max);
  assert.match(code, /^[a-hjkmnp-z2-9]{12}$/, "sans 0, o, 1, l ni i");
  assert.deepEqual(ecrirePushBande({ sorte: "bande-ajout", prenom: "Léa", idPublic: "ab2cd3ef4g" }), {
    titre: "🤝 Léa a rejoint ta bande", texte: "Grâce à ton lien. Dis-lui bonjour !", lien: "/potes/profil/ab2cd3ef4g",
  });
  assert.equal(ecrirePushBande({ sorte: "bande-acceptee", prenom: "Léa", idPublic: "ab2cd3ef4g" }).titre, "🤝 Léa a dit oui");
  assert.equal(ecrireMoisParis(new Date("2026-10-31T23:30:00Z")), "2026-11", "déjà le 1er novembre à Paris");
  assert.equal(ecrireMoisParis(new Date("2026-10-31T22:30:00Z")), "2026-10");
  assert.equal(ecrireMoisParis(new Date("2026-12-31T23:10:00Z")), "2027-01");
});

test("lien valide : les deux bandes tout de suite, « bande-ajout » en cloche et sur le téléphone ; déjà potes : 200", async () => {
  const lea = await banc.creerPersonne({ pseudo: "lea.croque", prenom: "Léa" });
  const tom = await banc.creerPersonne({ prenom: "Tom" });
  const avant = (await lea.demander("GET", "/app/social/pouls")).corps.pouls.bande.signature;
  const invitation = await inviter(lea);
  assert.equal(invitation.pseudo, "lea.croque");
  assert.equal(invitation.lien, `https://sosmiam.fr/invitation/lea.croque#c=${invitation.code}`);
  assert.deepEqual(lireLienInvitation(invitation.lien), { pseudo: "lea.croque", code: invitation.code });
  assert.equal((await inviter(lea)).code, invitation.code, "le même code sur tous les téléphones");
  const chiffre = banc.tables.profils.get(lea.compteId)!.codeInvitationChiffre!;
  assert.match(chiffre, /^v\d+:/);
  assert.ok(!chiffre.includes(invitation.code), "le code est chiffré en base");

  const r = await tom.demander("POST", "/app/bande/rejoindre", { pseudo: "@Lea.Croque", code: invitation.code.toUpperCase(), moyen: "lien" });
  assert.equal(r.statut, 201);
  assert.deepEqual([r.corps.personne.id, r.corps.deja], [lea.idPublic, false]);
  assert.deepEqual(await potesDe(tom), [lea.idPublic]);
  assert.deepEqual(await potesDe(lea), [tom.idPublic]);
  assert.deepEqual(clocheDe(lea).map((n) => [n.type, n.acteurId]), [["bande-ajout", tom.compteId]]);
  await banc.attendreEnvois();
  assert.deepEqual(banc.pushs.filter((p) => p.compteId === lea.compteId).map((p) => p.message), [
    { titre: "🤝 Tom a rejoint ta bande", texte: "Grâce à ton lien. Dis-lui bonjour !", lien: `/potes/profil/${tom.idPublic}` },
  ]);
  assert.notEqual((await lea.demander("GET", "/app/social/pouls")).corps.pouls.bande.signature, avant, "le pouls de la bande bouge");

  const encore = await rejoindre(tom, invitation);
  assert.deepEqual([encore.statut, encore.corps.deja], [200, true]);
  await banc.attendreEnvois();
  assert.equal(banc.pushs.filter((p) => p.compteId === lea.compteId).length, 1, "rien de plus");
  assert.equal(banc.tables.profils.get(lea.compteId)!.arriveesParLien, 1);
});

test("code faux, pseudo inconnu et blocage (dans les deux sens) : la même 404 ; ton propre lien : 400", async () => {
  const lea = await banc.creerPersonne({ pseudo: "lea.secrete" });
  const invitation = await inviter(lea);
  const bloquee = await banc.creerPersonne();
  const bloqueuse = await banc.creerPersonne();
  banc.bloquer(lea, bloquee);
  banc.bloquer(bloqueuse, lea);
  const curieux = await banc.creerPersonne();
  const essais = [
    await rejoindre(curieux, { pseudo: "lea.secrete", code: "abcdefghjkmn" }),
    await rejoindre(curieux, { pseudo: "personne.ici", code: invitation.code }),
    await rejoindre(bloquee, invitation),
    await rejoindre(bloqueuse, invitation),
  ];
  for (const r of essais) assert.deepEqual([r.statut, r.corps], [404, { ok: false, erreur: "invitation-invalide" }]);
  assert.deepEqual(await potesDe(lea), []);
  const soi = await rejoindre(lea, invitation);
  assert.deepEqual([soi.statut, soi.corps.champ], [400, "pseudo"]);
  assert.equal((await curieux.demander("POST", "/app/bande/rejoindre", { pseudo: "lea.secrete", code: invitation.code })).corps.champ, "moyen");
  assert.equal((await curieux.demander("POST", "/app/bande/rejoindre", { pseudo: "lea.secrete", code: "x", moyen: "qr" })).corps.champ, "code");
  assert.equal((await curieux.demander("POST", "/app/bande/rejoindre", { pseudo: "L", code: invitation.code, moyen: "qr" })).corps.champ, "pseudo");
});

test("ancien lien après un changement de pseudo : invitation-inconnue avec son bon code seulement ; compte supprimé : invitation-invalide", async () => {
  const lea = await banc.creerPersonne({ pseudo: "lea.avant" });
  const [tom, bloque] = [await banc.creerPersonne(), await banc.creerPersonne()];
  banc.bloquer(lea, bloque);
  const ancien = await inviter(lea);
  assert.equal(await banc.memoire.services.modifierProfil(lea.compteId, { pseudo: "lea.apres" }), "ok");
  assert.deepEqual(await rejoindre(tom, ancien).then((r) => [r.statut, r.corps]), [404, { ok: false, erreur: "invitation-inconnue" }]);
  // Sans son bon code, ou avec un blocage : rien ne dit que ce pseudo est réservé
  assert.equal((await rejoindre(tom, { pseudo: "lea.avant", code: "abcdefghjkmn" })).corps.erreur, "invitation-invalide");
  assert.equal((await rejoindre(bloque, ancien)).corps.erreur, "invitation-invalide");
  assert.deepEqual([await potesDe(lea), banc.tables.profils.get(lea.compteId)!.arriveesParLien], [[], 0], "rien d'écrit, aucune arrivée comptée");
  const nouveau = await inviter(lea);
  assert.deepEqual([nouveau.pseudo, nouveau.code], ["lea.apres", ancien.code], "le même code, sous le nouveau pseudo");
  assert.equal((await rejoindre(tom, nouveau)).statut, 201);
  // Réservation expirée (30 jours) : un pseudo inconnu comme un autre
  banc.memoire.pseudosReserves.reservations.get("lea.avant")!.reserveJusquLe = banc.horloge.maintenant - 1;
  assert.equal((await rejoindre(await banc.creerPersonne(), ancien)).corps.erreur, "invitation-invalide");
  // Compte supprimé : son pseudo est réservé pour personne, son lien ne dit rien de plus
  const zoe = await banc.creerPersonne({ pseudo: "zoe.partie" });
  const sien = await inviter(zoe);
  await banc.supprimerCompte(zoe);
  assert.equal(banc.memoire.pseudosReserves.reservations.get("zoe.partie")?.compteId, null);
  assert.equal((await rejoindre(tom, sien)).corps.erreur, "invitation-invalide");
});

test("« Changer mon lien » tue l'ancien ; la 10e arrivée en 24 h passe, puis le code change tout seul (« lien-renouvele »)", async () => {
  const lea = await banc.creerPersonne({ pseudo: "lea.populaire" });
  const premier = await inviter(lea);
  const change = await lea.demander("POST", "/app/bande/invitation/renouveler");
  assert.equal(change.statut, 201);
  const second = change.corps.invitation;
  assert.notEqual(second.code, premier.code);
  const arrivees: PersonneDeTest[] = [];
  for (let i = 0; i < 11; i++) arrivees.push(await banc.creerPersonne());
  assert.equal((await rejoindre(arrivees[0]!, premier)).statut, 404, "l'ancien lien ne marche plus, tout de suite");
  for (const p of arrivees.slice(0, 10)) assert.equal((await rejoindre(p, second)).statut, 201);
  const onze = await rejoindre(arrivees[10]!, second);
  assert.deepEqual([onze.statut, onze.corps.erreur], [404, "invitation-invalide"], "la 11e arrivée par le même lien");
  assert.notEqual((await inviter(lea)).code, second.code, "code changé tout seul");
  const renouvele = clocheDe(lea).filter((n) => n.type === "lien-renouvele");
  assert.deepEqual(renouvele.map((n) => n.acteurId), [null], "l'équipe SOS Miam, une seule fois");
  assert.equal((await lea.demander("GET", "/app/cloche")).corps.cloche.notifications[0].type, "lien-renouvele");
  assert.equal((await potesDe(lea)).length, 10);

  // Le compte repart de zéro après 24 h sans arrivée
  const calme = await banc.creerPersonne({ pseudo: "lea.calme" });
  const lien = await inviter(calme);
  const visiteurs: PersonneDeTest[] = [];
  for (let i = 0; i < 10; i++) visiteurs.push(await banc.creerPersonne());
  for (const p of visiteurs.slice(0, 9)) assert.equal((await rejoindre(p, lien)).statut, 201);
  banc.horloge.maintenant += JOUR + 1000;
  assert.equal((await rejoindre(visiteurs[9]!, lien)).statut, 201);
  assert.equal((await inviter(calme)).code, lien.code, "après 24 h sans arrivée, le compte repart de zéro");
  assert.equal(banc.tables.profils.get(calme.compteId)!.arriveesParLien, 1);

  // Un lien qui fuit, à cheval sur 24 h : 1 arrivée, 8 autres 23 h 58 plus tard, puis 1 de plus 3 minutes après. Une fenêtre
  // fixe repartait de zéro à 24 h et en laissait passer 18 en quelques minutes ; ici, la 10e en 24 h change le code
  const fuite = await banc.creerPersonne({ pseudo: "lea.fuite" });
  const fuyant = await inviter(fuite);
  const venus: PersonneDeTest[] = [];
  for (let i = 0; i < 11; i++) venus.push(await banc.creerPersonne());
  assert.equal((await rejoindre(venus[0]!, fuyant)).statut, 201);
  banc.horloge.maintenant += JOUR - 2 * 60_000;
  for (const p of venus.slice(1, 9)) assert.equal((await rejoindre(p, fuyant)).statut, 201);
  banc.horloge.maintenant += 3 * 60_000;
  assert.equal((await rejoindre(venus[9]!, fuyant)).statut, 201, "la 10e passe");
  assert.equal((await rejoindre(venus[10]!, fuyant)).corps.erreur, "invitation-invalide", "puis le code a changé");
  assert.notEqual((await inviter(fuite)).code, fuyant.code);
});

test("deux demandes du code en même temps : le même code ; sans pseudo : 409 ; sans profil, rien n'est créé", async () => {
  const lea = await banc.creerPersonne();
  const [a, b] = await Promise.all([inviter(lea), inviter(lea)]);
  assert.equal(a.code, b.code);
  const sansPseudo = await banc.creerPersonne({ sansPseudo: true });
  assert.deepEqual((await sansPseudo.demander("GET", "/app/bande/invitation")).corps, { ok: false, erreur: "pseudo-requis" });
  assert.equal((await sansPseudo.demander("POST", "/app/bande/demandes", { personne: lea.idPublic })).statut, 409);
  const discret = await banc.creerPersonne({ sansProfil: true });
  assert.deepEqual((await discret.demander("GET", "/app/bande")).corps.bande, { membres: [], demandesRecues: [], demandesEnvoyees: [], max: 200 });
  assert.deepEqual((await discret.demander("GET", "/app/bande/activite")).corps.activites, []);
  assert.deepEqual((await discret.demander("GET", "/app/bande/classement")).corps.classement, { mois: ecrireMoisParis(date()), places: [] });
  assert.equal(banc.tables.profils.has(discret.compteId), false, "une lecture ne crée jamais le profil social");
});

test("sans la clé des données : 503 pour le lien, et le profil social n'est pas créé", async () => {
  const sansCle = await creerBancSocial({ sansCle: true });
  try {
    const lea = await sansCle.creerPersonne({ sansProfil: true });
    const r = await lea.demander("GET", "/app/bande/invitation");
    assert.deepEqual([r.statut, r.corps.erreur], [503, "chiffrement-indisponible"]);
    assert.equal(sansCle.tables.profils.has(lea.compteId), false);
    assert.equal((await lea.demander("POST", "/app/bande/rejoindre", { pseudo: "lea", code: "abcdefghjkmn", moyen: "qr" })).statut, 503);
  } finally {
    await sansCle.fermer();
  }
});

test("200 potes : la bande affiche complet, par le lien comme par une demande acceptée", async () => {
  const pleine = await banc.creerPersonne();
  for (let i = 0; i < 200; i++) banc.tables.bande.push({ compteId: pleine.compteId, poteId: 900_000 + i, creeLe: date() });
  const tom = await banc.creerPersonne();
  assert.deepEqual((await rejoindre(tom, await inviter(pleine))).corps, { ok: false, erreur: "bande-pleine" });
  assert.equal((await tom.demander("POST", "/app/bande/demandes", { personne: pleine.idPublic })).statut, 201);
  const accepte = await pleine.demander("POST", `/app/bande/demandes/${tom.idPublic}/accepter`);
  assert.deepEqual([accepte.statut, accepte.corps.erreur], [409, "bande-pleine"]);
  assert.equal((await pleine.demander("POST", "/app/bande/demandes", { personne: tom.idPublic })).corps.erreur, "bande-pleine");
});

test("demandes par pseudo : envoyée, croisée qui ajoute (« bande-acceptee »), acceptée ; 50 en attente au plus", async () => {
  const lea = await banc.creerPersonne({ prenom: "Léa" });
  const tom = await banc.creerPersonne({ prenom: "Tom" });
  const noe = await banc.creerPersonne({ prenom: "Noé" });
  const r = await lea.demander("POST", "/app/bande/demandes", { personne: tom.idPublic });
  assert.deepEqual([r.statut, r.corps], [201, { ok: true, etat: "demande" }]);
  assert.deepEqual((await tom.demander("GET", "/app/bande")).corps.bande.demandesRecues.map((d: { personne: { id: string } }) => d.personne.id), [lea.idPublic]);
  assert.deepEqual((await lea.demander("GET", "/app/bande")).corps.bande.demandesEnvoyees.map((d: { personne: { id: string } }) => d.personne.id), [tom.idPublic]);
  assert.equal((await tom.demander("GET", "/app/social/pouls")).corps.pouls.demandes.bande, 1);
  assert.equal((await lea.demander("POST", "/app/bande/demandes", { personne: tom.idPublic })).corps.etat, "deja");
  await banc.attendreEnvois();
  assert.equal(banc.pushs.filter((p) => p.compteId === tom.compteId).length, 0, "pas de notification pour une demande reçue");

  const croisee = await tom.demander("POST", "/app/bande/demandes", { personne: lea.idPublic });
  assert.deepEqual([croisee.statut, croisee.corps.etat, croisee.corps.personne.id], [200, "ajoute", lea.idPublic]);
  assert.deepEqual(await potesDe(lea), [tom.idPublic]);
  assert.equal(banc.tables.demandes.some((d) => d.deId === lea.compteId || d.aId === lea.compteId), false, "les demandes entre eux sont effacées");
  assert.deepEqual(clocheDe(lea).map((n) => [n.type, n.acteurId]), [["bande-acceptee", tom.compteId]]);
  await banc.attendreEnvois();
  assert.deepEqual(banc.pushs.filter((p) => p.compteId === lea.compteId).map((p) => p.message.titre), ["🤝 Tom a dit oui"]);
  assert.equal((await tom.demander("POST", "/app/bande/demandes", { personne: lea.idPublic })).corps.etat, "deja", "déjà potes");

  assert.equal((await noe.demander("POST", "/app/bande/demandes", { personne: lea.idPublic })).statut, 201);
  const acceptee = await lea.demander("POST", `/app/bande/demandes/${noe.idPublic}/accepter`);
  assert.deepEqual([acceptee.statut, acceptee.corps.personne.id], [200, noe.idPublic]);
  assert.deepEqual(clocheDe(noe).map((n) => n.type), ["bande-acceptee"]);
  const encore = await lea.demander("POST", `/app/bande/demandes/${noe.idPublic}/accepter`);
  assert.deepEqual([encore.statut, encore.corps.personne.id], [200, noe.idPublic], "deux touchers (ou un renvoi) : pas d'erreur");
  assert.deepEqual(clocheDe(noe).map((n) => n.type), ["bande-acceptee"], "et rien de plus");
  assert.equal((await lea.demander("POST", `/app/bande/demandes/${tom.idPublic}/accepter`)).statut, 200, "déjà potes autrement : 200 aussi");
  const sam = await banc.creerPersonne();
  assert.equal((await lea.demander("POST", `/app/bande/demandes/${sam.idPublic}/accepter`)).corps.erreur, "demande-inconnue", "sans demande ni lien");
  assert.equal((await lea.demander("POST", "/app/bande/demandes", { personne: lea.idPublic })).corps.champ, "personne", "toi");
  assert.equal((await lea.demander("POST", "/app/bande/demandes", { personne: "zzzzzzzzzz" })).corps.erreur, "personne-inconnue");

  const presse = await banc.creerPersonne();
  for (let i = 0; i < 50; i++) banc.tables.demandes.push({ deId: presse.compteId, aId: 800_000 + i, creeLe: date(), refuseeLe: null });
  assert.equal((await presse.demander("POST", "/app/bande/demandes", { personne: lea.idPublic })).corps.erreur, "trop-de-demandes-en-attente");
});

test("refus silencieux qui reste : renvoyer rend « deja », rien chez l'autre ; il change d'avis ; 30 jours plus tard, ça repart", async () => {
  const lea = await banc.creerPersonne();
  const tom = await banc.creerPersonne();
  await lea.demander("POST", "/app/bande/demandes", { personne: tom.idPublic });
  assert.deepEqual((await tom.demander("DELETE", `/app/bande/demandes/${lea.idPublic}`)).corps, { ok: true });
  assert.deepEqual((await tom.demander("GET", "/app/bande")).corps.bande.demandesRecues, []);
  assert.equal((await lea.demander("GET", "/app/bande")).corps.bande.demandesEnvoyees.length, 1, "elle voit toujours « envoyée »");
  assert.deepEqual((await lea.demander("POST", "/app/bande/demandes", { personne: tom.idPublic })).corps, { ok: true, etat: "deja" });
  assert.deepEqual((await tom.demander("GET", "/app/bande")).corps.bande.demandesRecues, [], "rien n'apparaît chez lui");
  assert.equal((await tom.demander("GET", "/app/social/pouls")).corps.pouls.demandes.bande, 0);

  banc.horloge.maintenant += 31 * JOUR;
  assert.deepEqual((await lea.demander("GET", "/app/bande")).corps.bande.demandesEnvoyees, [], "expirée");
  assert.equal((await lea.demander("POST", "/app/bande/demandes", { personne: tom.idPublic })).statut, 201, "elle peut redemander");
  await tom.demander("DELETE", `/app/bande/demandes/${lea.idPublic}`);
  assert.equal((await tom.demander("POST", "/app/bande/demandes", { personne: lea.idPublic })).corps.etat, "ajoute", "il change d'avis");

  const noe = await banc.creerPersonne();
  await noe.demander("POST", "/app/bande/demandes", { personne: tom.idPublic });
  await noe.demander("DELETE", `/app/bande/demandes/${tom.idPublic}`);
  assert.deepEqual((await tom.demander("GET", "/app/bande")).corps.bande.demandesRecues, [], "annulée par elle");

  // « Qu'on me trouve par mon pseudo » éteint : on n'entre dans sa bande que par son lien (la demande part refusée, en silence)
  const discrete = await banc.creerPersonne();
  banc.tables.profils.get(discrete.compteId)!.trouvable = false;
  assert.equal((await noe.demander("POST", "/app/bande/demandes", { personne: discrete.idPublic })).statut, 201);
  assert.equal((await noe.demander("GET", "/app/bande")).corps.bande.demandesEnvoyees.length, 1);
  assert.deepEqual((await discrete.demander("GET", "/app/bande")).corps.bande.demandesRecues, [], "elle ne voit rien");
  assert.equal((await rejoindre(noe, await inviter(discrete))).statut, 201, "son lien, lui, marche");
});

test("retirer : des deux côtés, sans prévenir ; discussion privée en lecture seule (nouvelle version) ; co-auteurs partis", async () => {
  const lea = await banc.creerPersonne();
  const tom = await banc.creerPersonne();
  banc.rendrePotes(lea, tom);
  const prive = conversation("prive", [lea, tom]);
  const deLea = liste(lea);
  const deTom = liste(tom);
  banc.tables.coAuteurs.push(
    { listeId: deLea, compteId: tom.compteId, statut: "accepte", creeLe: date(), reponduLe: date() },
    { listeId: deTom, compteId: lea.compteId, statut: "refuse", creeLe: date(), reponduLe: date() },
  );
  const r = await lea.demander("DELETE", `/app/bande/${tom.idPublic}`);
  assert.deepEqual([r.statut, r.corps], [200, { ok: true }]);
  assert.deepEqual(await potesDe(tom), []);
  assert.equal(banc.tables.conversations.get(prive)!.version, 1);
  assert.deepEqual(banc.tables.coAuteurs.filter((c) => c.listeId === deLea || c.listeId === deTom).map((c) => c.statut), ["refuse"], "un refus reste noté");
  assert.equal(clocheDe(tom).length, 0, "sans prévenir");
  assert.equal((await lea.demander("DELETE", `/app/bande/${tom.idPublic}`)).statut, 200, "pas pote : 200");
  assert.equal(banc.tables.conversations.get(prive)!.version, 1);
});

test("« Quoi de neuf » : potes qui partagent, 30 jours, lieux publiés, sans les lignes retirées ni les listes signalées", async () => {
  const moi = await banc.creerPersonne();
  const lea = await banc.creerPersonne();
  const sam = await banc.creerPersonne();
  const inconnu = await banc.creerPersonne();
  banc.rendrePotes(moi, lea);
  banc.rendrePotes(moi, sam);
  banc.tables.profils.get(sam.compteId)!.activitePartagee = false;
  banc.tables.lieux.set(7001, { statut: "publie" });
  banc.tables.lieux.set(7002, { statut: "brouillon" });
  banc.tables.lieux.set(7003, { statut: "publie" });
  for (const p of [lea, sam, inconnu]) banc.tables.rescousses.push({ compteId: p.compteId, lieuId: 7001, creeLe: date(-JOUR) });
  banc.tables.rescousses.push({ compteId: lea.compteId, lieuId: 7002, creeLe: date(-JOUR) }, { compteId: lea.compteId, lieuId: 7001, creeLe: date(-40 * JOUR) });
  banc.tables.gardes.push({ compteId: lea.compteId, lieuId: 7001, creeLe: date(-2 * JOUR) }, { compteId: lea.compteId, lieuId: 7003, creeLe: date(-3 * JOUR) });
  const pizzas = liste(lea, "Pizzas du jeudi", date(-4 * JOUR));
  const signalee = liste(lea, "Pas top", date(-4 * JOUR));
  const idSignalement = prendreId(banc.tables, "signalements");
  banc.tables.signalements.set(idSignalement, { id: idSignalement, cible: "liste", cibleId: String(signalee), signaleParId: moi.compteId } as never);
  assert.equal((await moi.demander("PUT", `/app/masques/activite/garde:${lea.idPublic}:7003`)).statut, 200);

  const { activites } = (await moi.demander("GET", "/app/bande/activite")).corps;
  const rescousse = banc.tables.rescousses.findIndex((r) => r.compteId === lea.compteId) + 1;
  assert.deepEqual(activites.map((a: { id: string }) => a.id), [`rescousse:${rescousse}`, `garde:${lea.idPublic}:7001`, `liste:${pizzas}`]);
  assert.deepEqual(activites[0], { id: `rescousse:${rescousse}`, personne: activites[0].personne, type: "rescousse", lieuId: 7001, date: date(-JOUR).toISOString() });
  assert.equal(activites[0].personne.id, lea.idPublic);
  assert.deepEqual([activites[2].detail, activites[2].listeId], ["Pizzas du jeudi", String(pizzas)]);
  assert.ok(activites.every((a: { personne: { id: string } }) => a.personne.id === lea.idPublic), "ni Sam (ne partage pas), ni un inconnu");
});

test("classement : toi et tes potes qui partagent, points nets du mois de Paris puis rescousses, même rang à égalité", async () => {
  const sauve = banc.horloge.maintenant;
  banc.horloge.maintenant = Date.parse("2026-10-31T23:30:00Z");
  try {
    const moi = await banc.creerPersonne();
    const lea = await banc.creerPersonne();
    const tom = await banc.creerPersonne();
    const sam = await banc.creerPersonne();
    for (const p of [lea, tom, sam]) banc.rendrePotes(moi, p);
    banc.tables.profils.get(sam.compteId)!.activitePartagee = false;
    const point = (p: PersonneDeTest, points: number, quand: string) => banc.tables.journalPoints.push({ compteId: p.compteId, points, creeLe: new Date(quand) });
    point(moi, 50, "2026-10-31T22:50:00Z"); // encore octobre à Paris
    point(moi, 4, "2026-10-31T23:10:00Z");
    point(lea, 7, "2026-10-31T23:05:00Z");
    point(lea, -3, "2026-10-31T23:06:00Z");
    point(tom, 4, "2026-10-31T23:20:00Z");
    point(sam, 99, "2026-10-31T23:20:00Z");
    banc.tables.rescousses.push({ compteId: tom.compteId, lieuId: 7001, creeLe: new Date("2026-10-31T23:15:00Z") });
    const { classement } = (await moi.demander("GET", "/app/bande/classement")).corps;
    assert.equal(classement.mois, "2026-11");
    assert.deepEqual(classement.places.map((p: { personne: { id: string }; pointsDuMois: number; rescoussesDuMois: number; rang: number; estMoi: boolean }) =>
      [p.personne.id, p.pointsDuMois, p.rescoussesDuMois, p.rang, p.estMoi]), [
      [tom.idPublic, 4, 1, 1, false],
      [moi.idPublic, 4, 0, 2, true],
      [lea.idPublic, 4, 0, 2, false],
    ]);
  } finally {
    banc.horloge.maintenant = sauve;
  }
});

test("client commun : les adresses de la bande et des blocages, contre les vraies routes", async () => {
  const lea = await banc.creerPersonne({ pseudo: "lea.client" });
  const tom = await banc.creerPersonne();
  const { bande } = clientDe(tom);
  const invitation = await clientDe(lea).bande.lireInvitation();
  assert.ok(invitation.ok);
  const r = await bande.rejoindre(invitation.invitation.pseudo, invitation.invitation.code, "qr");
  assert.ok(r.ok && r.personne.id === lea.idPublic && !r.deja);
  assert.ok((await bande.lireBande()).ok);
  assert.ok((await bande.lireActivite()).ok);
  assert.ok((await bande.lireClassement()).ok);
  assert.ok((await clientDe(lea).bande.renouvelerInvitation()).ok);
  assert.ok((await bande.retirer(lea.idPublic!)).ok);
  const demande = await bande.demander(lea.idPublic!);
  assert.ok(demande.ok && demande.etat === "demande");
  const accepte = await clientDe(lea).bande.accepter(tom.idPublic!);
  assert.ok(accepte.ok && accepte.personne.id === tom.idPublic);
  assert.ok((await bande.retirerDemande(lea.idPublic!)).ok);
  assert.ok((await bande.bloquer(lea.idPublic!, true)).ok);
  const bloques = await bande.listerBloques();
  assert.ok(bloques.ok && bloques.bloques[0]?.id === lea.idPublic);
  assert.ok((await bande.bloquer(lea.idPublic!, false)).ok);
  const refus = await clientDe(lea).bande.rejoindre("lea.client", "abcdefghjkmn", "lien");
  assert.ok(!refus.ok && refus.champ === "pseudo");
});

test("version Prisma : rejoindre verrouille les deux comptes avant de lire le code, relit le blocage dans la transaction, change le code à la 10e arrivée", async () => {
  const chiffrement = creerChiffrementSocial(creerChiffrementDonnees(randomBytes(32)))!;
  const maintenant = new Date("2026-10-14T10:00:00Z");
  const { base, appels, tx } = fausseBase({
    "base.compte.findUnique": { id: 2, profilSocial: { compteId: 2 } },
    "tx.profilSocial.findUnique": { codeInvitationChiffre: chiffrement.chiffrerCode("abcdefghjkmn", 2), arriveesParLien: 9, arriveesDepuis: new Date(maintenant.getTime() - 3_600_000) },
  });
  const blocages: unknown[] = [];
  const relations = {
    verrouillerComptes: async (t: unknown, ids: readonly number[]) => void appels.push(`verrou:${t === tx}:${ids.join(",")}`),
    bloqueEntre: async (_a: number, _b: number, t?: unknown) => (blocages.push(t), false),
    presenter: async () => new Map([[1, { id: "tomtomtom2", pseudo: "tom", prenom: "Tom", avatar: null }]]),
    lirePushSocial: async () => new Set([2]),
  };
  const lireAncienTitulaire = async () => assert.fail("un pseudo porté ne cherche pas de réservation");
  const service = creerBande({ relations: relations as never, chiffrement, tirer: () => 0, base: base as never, lireAncienTitulaire });
  const r = await service.rejoindre(1, "lea", "abcdefghjkmn", maintenant);
  assert.ok(r.ok && !r.deja);
  assert.deepEqual(r.effets.map((e) => (e.quoi === "cloche" ? e.notification.type : `push:${e.sorte}`)), ["bande-ajout", "push:bande-ajout", "lien-renouvele"]);
  assert.deepEqual(appels.slice(0, 3), ["base.compte.findUnique", "verrou:true:1,2", "tx.profilSocial.findUnique"]);
  assert.deepEqual(blocages, [tx], "le blocage relu dans la transaction verrouillée");
  const miseAJour = appels.indexOf("tx.profilSocial.update");
  assert.ok(miseAJour > appels.indexOf("tx.membreBande.createMany"));
  assert.equal((await service.rejoindre(1, "lea", "mauvaiscode1", maintenant)).ok, false);

  // Pseudo inconnu : le même travail qu'un code faux (transaction, verrou, lecture d'un profil), puis la même réponse ; le
  // pseudo d'avant d'un compte qui en a changé (2) : le même travail sous les deux verrous, et son bon code seulement dit
  // « invitation-inconnue », sans rien écrire
  const pseudosLus: string[] = [];
  const essayer = async (ancien: number | null, code: string) => {
    const f = fausseBase({ "tx.profilSocial.findUnique": { codeInvitationChiffre: chiffrement.chiffrerCode("abcdefghjkmn", 2), arriveesParLien: 0, arriveesDepuis: null } });
    const verrouillerComptes = async (t: unknown, ids: readonly number[]) => void f.appels.push(`verrou:${t === f.tx}:${ids.join(",")}`);
    const lireAncienTitulaire = async (pseudo: string) => (pseudosLus.push(pseudo), ancien);
    const issue = await creerBande({ relations: { ...relations, verrouillerComptes } as never, chiffrement, tirer: () => 0, base: f.base as never, lireAncienTitulaire })
      .rejoindre(1, "personne.ici", code, maintenant);
    return [issue, f.appels] as const;
  };
  assert.deepEqual(await essayer(null, "abcdefghjkmn"), [{ ok: false, erreur: "invitation-invalide" }, ["base.compte.findUnique", "verrou:true:1", "tx.profilSocial.findUnique"]]);
  const lu = ["base.compte.findUnique", "verrou:true:1,2", "tx.profilSocial.findUnique"];
  assert.deepEqual(await essayer(2, "abcdefghjkmn"), [{ ok: false, erreur: "invitation-inconnue" }, lu]);
  assert.deepEqual(await essayer(2, "mauvaiscode1"), [{ ok: false, erreur: "invitation-invalide" }, lu]);
  assert.deepEqual(pseudosLus, ["personne.ici", "personne.ici", "personne.ici"]);
});

test("version Prisma : « Changer mon lien » prend le verrou de mon compte (celui de rejoindre) avant d'écrire le nouveau code", async () => {
  const chiffrement = creerChiffrementSocial(creerChiffrementDonnees(randomBytes(32)))!;
  const { base, appels, tx } = fausseBase({ "tx.profilSocial.update": { compte: { pseudo: "lea" } } });
  const relations = { verrouillerComptes: async (t: unknown, ids: readonly number[]) => void appels.push(`verrou:${t === tx}:${ids.join(",")}`) };
  const r = await creerBande({ relations: relations as never, chiffrement, tirer: () => 0, base: base as never }).renouvelerInvitation(2, new Date());
  assert.equal(r.pseudo, "lea");
  assert.deepEqual(appels, ["verrou:true:2", "tx.profilSocial.update"]);
});

/** Une conversation et ses membres, dans les tables en mémoire */
function conversation(type: "prive" | "groupe" | "sortie", membres: PersonneDeTest[]) {
  const id = prendreId(banc.tables, "conversations");
  banc.tables.conversations.set(id, { id, type, clePrive: null, titreChiffre: null, emoji: null, creeParId: null, version: 0, dernierMessageLe: date(), modifieLe: date(), creeLe: date() });
  for (const m of membres) banc.tables.membres.push({ conversationId: id, compteId: m.compteId, role: "membre", visibleApres: 0, luJusqua: 0, coupee: false, arriveLe: date() });
  return id;
}
/** Une liste de lieux */
function liste(auteur: PersonneDeTest, titre = "Pizzas du jeudi", creeLe = date()) {
  const id = prendreId(banc.tables, "listes");
  banc.tables.listes.set(id, { id, auteurId: auteur.compteId, titre, emoji: "🍕", description: "", visibilite: "tous", suspendueLe: null, retireeLe: null, creeLe, modifieLe: creeLe });
  return id;
}
/** Le client commun de cette personne, branché sur les routes du banc (un faux fetch qui passe par elles) */
function clientDe(p: PersonneDeTest) {
  const faux = (async (url: string, init: RequestInit) => {
    const r = await p.demander(String(init.method), url.replace("https://api.exemple.fr", ""), init.body ? JSON.parse(String(init.body)) : undefined);
    return new Response(JSON.stringify(r.corps), { status: r.statut, headers: { "Content-Type": "application/json" } });
  }) as unknown as typeof fetch;
  return creerServicesSociauxApi(creerClientHttp({ adresse: "https://api.exemple.fr", lireJeton: () => p.jeton, fetch: faux }));
}
/**
 * Une fausse base Prisma : chaque appel (« base.<modèle>.<geste> » ou « tx.<modèle>.<geste> ») est noté et rend la réponse
 * donnée, sinon une réponse vide (0, [], null, { count: 0 }) ; $transaction passe la fausse transaction
 */
function fausseBase(reponses: Record<string, unknown> = {}) {
  const appels: string[] = [];
  const vide = (geste: string) => (geste === "count" ? 0 : geste === "findMany" ? [] : geste === "findUnique" || geste === "findFirst" ? null : { count: 0 });
  const client = (nom: string): object => new Proxy({}, {
    get: (_cible, modele: string) => new Proxy({}, {
      get: (_m, geste: string) => async () => {
        appels.push(`${nom}.${modele}.${geste}`);
        return `${nom}.${modele}.${geste}` in reponses ? reponses[`${nom}.${modele}.${geste}`] : vide(geste);
      },
    }),
  });
  const tx = client("tx");
  const base = new Proxy(client("base"), {
    get: (cible, cle: string) => (cle === "$transaction"
      ? async (f: unknown) => (typeof f === "function" ? f(tx) : Promise.all(f as Promise<unknown>[]))
      : Reflect.get(cible, cle)),
  });
  return { base, tx, appels };
}

