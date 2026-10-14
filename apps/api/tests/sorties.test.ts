// Tests des sorties de l'app (/app/sorties) : « Tu viens ? » (rien de visible avant d'accepter), refus silencieux gardé,
// 404 avant 403, 15 personnes, votes multiples (ceux d'une personne bloquée comptés mais pas nommés), égalité au premier
// proposé, fin des votes par la tâche de la minute, organisateur qui part, annulation (un message signalé garde son
// fichier), discussion qui suit les participants, Idempotency-Key, pouls et relecture par version, blocage avec celui qui
// a pris la main, un seul son par 24 h pour une réinvitation, ordre des verrous. Tout en mémoire (aucune base), avec une
// clé de test ; les lieux sont ceux, fictifs, que le test prépare.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";

import { creerSortiesApi } from "../../../packages/commun/src/client-api/api/api-sorties.ts";
import { creerClientHttp } from "../../../packages/commun/src/client-api/client-http.ts";
import { creerAppliquerEffetsSociaux } from "../src/controleurs/effets-sociaux.ts";
import { assemblerSortie } from "../src/fonctions/social/assembler-sortie.ts";
import { construireEffetsSortie } from "../src/fonctions/social/construire-effets-sortie.ts";
import { ecrirePushSortie } from "../src/fonctions/social/ecrire-push-sortie.ts";
import { presenterSortie } from "../src/fonctions/social/presenter-sortie.ts";
import { prendreId } from "../src/services/tables-sociales-en-memoire.ts";
import { passerFinDesVotes, planifierFinDesVotes } from "../src/taches/terminer-votes-sorties.ts";
import { creerBancSocial, type PersonneDeTest } from "./outils/creer-banc-social.ts";

// La version Prisma se branche sur la base au chargement, sans s'y connecter : une adresse d'essai suffit (fausse base)
process.env.DATABASE_URL ??= "postgresql://essai@127.0.0.1:1/essai";
const { creerSorties } = await import("../src/services/sorties.ts");

let banc: Awaited<ReturnType<typeof creerBancSocial>>;
before(async () => {
  banc = await creerBancSocial();
});
after(() => banc.fermer());

const MINUTE = 60_000;
const iso = (decalageMs: number) => new Date(banc.horloge.maintenant + decalageMs).toISOString();
let dernierLieu = 500;
/** Un lieu fictif (« publie » par défaut) */
function lieu(statut = "publie"): number {
  dernierLieu += 1;
  banc.tables.lieux.set(dernierLieu, { statut, nom: `Le Bouiboui n°${dernierLieu}` });
  return dernierLieu;
}
/** Une bande : l'organisateur et ses potes */
async function bande(n: number) {
  const organisateur = await banc.creerPersonne({ prenom: "Léa" });
  const potes: PersonneDeTest[] = [];
  for (let i = 0; i < n; i++) {
    const pote = await banc.creerPersonne();
    banc.rendrePotes(organisateur, pote);
    potes.push(pote);
  }
  return { organisateur, potes };
}
/** POST /app/sorties ; l'idClient part dans le corps (lireIdClient le prend là, ou dans l'en-tête Idempotency-Key) */
const creer = (p: PersonneDeTest, invites: PersonneDeTest[], lieux: number[], enPlus: Record<string, unknown> = {}) =>
  p.demander("POST", "/app/sorties", {
    titre: "Pizza du jeudi", emoji: "🍕", quand: iso(3 * 60 * MINUTE), finVote: iso(60 * MINUTE), invites: invites.map((i) => i.idPublic), lieux,
    idClient: randomUUID(), ...enPlus,
  });
const clocheDe = (p: PersonneDeTest) => [...banc.tables.cloche.values()].filter((n) => n.compteId === p.compteId);
const membresDe = (conversationId: string) => banc.tables.membres.filter((m) => m.conversationId === Number(conversationId)).map((m) => m.compteId).sort((a, b) => a - b);

test("lieu retenu, organisateur, présentation et notifications : fonctions pures", () => {
  const quand = new Date("2026-10-20T19:00:00Z");
  const lignes = {
    sortie: { id: 7, titre: "Brunch", emoji: "🥞", quand, finVote: new Date("2026-10-20T12:00:00Z"), organisateurId: null, lieuChoisiId: null, voteTermineLe: null, version: 3, conversationId: 70 },
    invitations: [
      { compteId: 3, statut: "accepte", inviteParId: 1, creeLe: new Date("2026-10-14T10:00:00Z"), reponduLe: new Date("2026-10-15T10:00:00Z") },
      { compteId: 2, statut: "accepte", inviteParId: 1, creeLe: new Date("2026-10-14T10:00:00Z"), reponduLe: new Date("2026-10-14T11:00:00Z") },
      { compteId: 4, statut: "invite", inviteParId: 1, creeLe: new Date("2026-10-14T10:00:00Z"), reponduLe: null },
      { compteId: 5, statut: "refuse", inviteParId: 1, creeLe: new Date("2026-10-14T10:00:00Z"), reponduLe: null },
    ],
    propositions: [{ id: 12, lieuId: 40, proposeParId: 3, votants: [3, 2, 9] }, { id: 11, lieuId: 41, proposeParId: null, votants: [2, 2, 4] }, { id: 13, lieuId: 42, proposeParId: 2, votants: [2] }],
  };
  const d = assemblerSortie(lignes, new Set([40, 41]));
  assert.equal(d.organisateurEffectif, 2, "organisateur parti avec son compte : le plus ancien participant");
  assert.deepEqual([d.participants, d.invites, d.refus], [[2, 3], [4], [5]]);
  assert.deepEqual(d.propositions.map((p) => [p.lieuId, p.votants.length]), [[41, 1], [40, 2]], "ordre de proposition, lieux publiés, votes uniques des seuls participants");
  const personne = (id: number) => ({ id: `personne${id}x`.slice(0, 10), pseudo: `p${id}`, prenom: `P${id}`, avatar: null });
  const vue = { moi: 2, personnes: new Map([2, 3, 4].map((id) => [id, personne(id)])), caches: new Set([3]), nonLus: 4, maintenant: new Date("2026-10-20T13:00:00Z") };
  const api = presenterSortie(d, vue);
  assert.equal(api.propositions[1]!.nombreVotes, 2);
  assert.deepEqual(api.propositions[1]!.votes.map((p) => p.pseudo), ["p2"], "le vote d'une personne bloquée compte, sans être nommé");
  assert.equal(api.propositions[1]!.proposePar, null);
  assert.deepEqual(api.participants.map((p) => p.pseudo), ["p2", "p3"], "les participants restent nommés");
  assert.deepEqual([api.voteTermine, api.moi.organisateur, api.nonLus, api.conversationId], [true, true, 4, "70"], "finVote passé : vote terminé");
  assert.deepEqual(ecrirePushSortie({ quoi: "invitation", prenom: "Léa", titre: "Brunch", sortieId: 7 }), {
    titre: "🎉 Léa t'invite : Brunch", texte: "Tu viens ? Réponds-lui dans Potes.", lien: "/potes/sortie/7",
  });
  assert.deepEqual(ecrirePushSortie({ quoi: "lieu-choisi", titre: "Brunch", lieu: "Le Bouiboui", sortieId: 7 }), {
    titre: "🗳️ C'est voté !", texte: "Brunch : rendez-vous chez Le Bouiboui.", lien: "/potes/sortie/7",
  });
  const effets = construireEffetsSortie({ quoi: "invitation", sortieId: 7, titre: "Brunch", acteur: { id: 1, prenom: "Léa" }, destinataires: [1, 2, 3], pushAutorises: new Set([2]) });
  assert.deepEqual(effets.map((e) => [e.quoi, e.quoi === "cloche" ? e.notification.compteId : e.compteId]), [["cloche", 2], ["push", 2], ["cloche", 3]], "jamais l'acteur ; le téléphone seulement si pushSocial");
  const annulee = construireEffetsSortie({ quoi: "annulee", sortieId: 7, titre: "Brunch", acteurId: 1, destinataires: [2, 4] });
  assert.ok(annulee.every((e) => e.quoi === "cloche" && e.notification.type === "sortie-annulee" && e.notification.detail === "Brunch"), "annulation : la cloche seulement");
});

test("création : validation, bande, lieux publiés ; « invitation-sortie » en cloche et sur le téléphone ; même clé : une seule sortie", async () => {
  const { organisateur, potes: [tom, zoe] } = await bande(2);
  const inconnu = await banc.creerPersonne();
  const ici = lieu();
  assert.equal((await creer(organisateur, [tom!], [ici], { titre: "Soirée connard" })).corps.erreur, "message-refuse");
  const sansCle = await organisateur.demander("POST", "/app/sorties", { titre: "Pizza", emoji: "🍕", quand: iso(3 * 60 * MINUTE), finVote: iso(60 * MINUTE), invites: [tom!.idPublic], lieux: [ici] });
  assert.deepEqual([sansCle.statut, sansCle.corps.champ], [400, "idClient"]);
  assert.deepEqual([(await creer(organisateur, [tom!], [ici], { quand: iso(5 * MINUTE) })).corps.champ], ["quand"]);
  assert.deepEqual([(await creer(organisateur, [tom!], [ici], { finVote: iso(4 * 60 * MINUTE) })).corps.champ], ["finVote"]);
  const horsBande = await creer(organisateur, [tom!, inconnu], [ici]);
  assert.deepEqual([horsBande.statut, horsBande.corps.erreur], [409, "pas-dans-la-bande"]);
  const brouillon = await creer(organisateur, [tom!], [ici, lieu("brouillon")]);
  assert.deepEqual([brouillon.statut, brouillon.corps.erreur], [404, "lieu-inconnu"]);
  const sansPseudo = await banc.creerPersonne({ sansPseudo: true });
  assert.equal((await creer(sansPseudo, [tom!], [ici])).corps.erreur, "pseudo-requis");

  const idClient = randomUUID();
  const premiere = await creer(organisateur, [tom!, zoe!], [ici, ici], { idClient });
  assert.equal(premiere.statut, 201);
  const sortie = premiere.corps.sortie;
  assert.deepEqual(sortie.propositions.map((p: { lieuId: number; nombreVotes: number }) => [p.lieuId, p.nombreVotes]), [[ici, 1]], "lieux dédoublonnés, l'organisateur vote d'office");
  assert.deepEqual(sortie.invites.map((p: { id: string }) => p.id).sort(), [tom!.idPublic, zoe!.idPublic].sort());
  assert.deepEqual([sortie.moi.organisateur, sortie.voteTermine, sortie.lieuChoisi, sortie.version], [true, false, null, 0]);
  assert.deepEqual(membresDe(sortie.conversationId), [organisateur.compteId], "la discussion : l'organisateur seulement, avant les réponses");
  assert.equal(banc.tables.conversations.get(Number(sortie.conversationId))!.type, "sortie");
  await banc.attendreEnvois();
  assert.deepEqual(clocheDe(tom!).map((n) => [n.type, n.acteurId, n.cibleId, n.detail]), [["invitation-sortie", organisateur.compteId, sortie.id, "Pizza du jeudi"]]);
  const pushsTom = banc.pushs.filter((p) => p.compteId === tom!.compteId);
  assert.deepEqual(pushsTom.map((p) => p.message.titre), ["🎉 Léa t'invite : Pizza du jeudi"]);

  const rejouee = await creer(organisateur, [tom!, zoe!], [ici], { idClient, quand: iso(5 * MINUTE) });
  assert.deepEqual([rejouee.statut, rejouee.corps.sortie.id], [200, sortie.id], "même clé : la sortie déjà créée, même avec des dates qui ne passeraient plus");
  await banc.attendreEnvois();
  assert.equal(banc.tables.invitationsSorties.filter((i) => i.compteId === tom!.compteId && i.sortieId === Number(sortie.id)).length, 1);
  assert.equal(banc.pushs.filter((p) => p.compteId === tom!.compteId).length, 1, "personne n'est prévenu deux fois");
  assert.equal(clocheDe(tom!).length, 1);
});

test("« Tu viens ? » : rien de visible avant d'accepter ; oui : vote et discussion ; non : refus silencieux gardé, réinviter le saute", async () => {
  const { organisateur, potes: [tom, zoe] } = await bande(2);
  const sortie = (await creer(organisateur, [tom!, zoe!], [lieu()])).corps.sortie;
  const vue = await tom!.demander("GET", `/app/sorties/${sortie.id}`);
  assert.deepEqual(Object.keys(vue.corps).sort(), ["invitation", "ok"]);
  assert.deepEqual([vue.corps.invitation.participants, vue.corps.invitation.invitePar.id, vue.corps.invitation.organisateur.prenom], [1, organisateur.idPublic, "Léa"]);
  assert.equal(vue.corps.invitation.propositions, undefined, "ni propositions, ni votes, ni discussion");
  assert.equal((await tom!.demander("PUT", `/app/sorties/${sortie.id}/votes/${sortie.propositions[0].lieuId}`)).statut, 404, "pas de vote avant d'accepter");
  assert.deepEqual((await tom!.demander("GET", "/app/sorties")).corps.invitations.map((i: { id: string }) => i.id), [sortie.id]);

  const avant = (await tom!.demander("GET", "/app/social/pouls")).corps.pouls.sorties;
  assert.equal(avant.invitations, 1);
  const oui = await tom!.demander("POST", `/app/sorties/${sortie.id}/reponse`, { vient: true });
  assert.deepEqual([oui.statut, oui.corps.sortie.participants.length, oui.corps.sortie.version], [200, 2, 1]);
  assert.deepEqual(membresDe(sortie.conversationId), [organisateur.compteId, tom!.compteId].sort((a, b) => a - b), "il entre dans la discussion");
  assert.equal(banc.tables.membres.find((m) => m.compteId === tom!.compteId && m.conversationId === Number(sortie.conversationId))!.visibleApres, 0, "il la lit depuis le début");
  assert.notEqual((await tom!.demander("GET", "/app/social/pouls")).corps.pouls.sorties.signature, avant.signature, "le pouls bouge");

  const non = await zoe!.demander("POST", `/app/sorties/${sortie.id}/reponse`, { vient: false });
  assert.deepEqual([non.statut, non.corps], [200, { ok: true }]);
  assert.equal((await zoe!.demander("GET", `/app/sorties/${sortie.id}`)).statut, 404, "après un refus, la sortie n'existe plus pour elle");
  const vueOrga = await organisateur.demander("GET", `/app/sorties/${sortie.id}`);
  assert.deepEqual(vueOrga.corps.sortie.invites, [], "le refus ne se voit pas");
  const clocheAvant = clocheDe(zoe!).length;
  const reinvitee = await organisateur.demander("POST", `/app/sorties/${sortie.id}/invites`, { invites: [zoe!.idPublic] });
  assert.deepEqual([reinvitee.statut, reinvitee.corps.sortie.invites], [200, []], "réinviter saute la personne, sans le dire");
  assert.equal(clocheDe(zoe!).length, clocheAvant);
  assert.equal(banc.tables.invitationsSorties.find((i) => i.compteId === zoe!.compteId && i.sortieId === Number(sortie.id))!.statut, "refuse");
  assert.equal((await zoe!.demander("POST", `/app/sorties/${sortie.id}/reponse`, { vient: true })).statut, 404);
  assert.equal((await tom!.demander("POST", `/app/sorties/${sortie.id}/reponse`, { vient: "oui" })).corps.champ, "vient");

  banc.horloge.maintenant += 4 * 60 * MINUTE;
  const tard = await banc.creerPersonne();
  banc.rendrePotes(organisateur, tard);
  assert.equal((await organisateur.demander("POST", `/app/sorties/${sortie.id}/invites`, { invites: [tard.idPublic] })).corps.erreur, "sortie-passee");
});

test("404 avant 403, organisateur seul pour inviter, terminer, retirer et annuler ; retiré : hors de la discussion, réinvitable", async () => {
  const { organisateur, potes: [tom, zoe] } = await bande(2);
  const intrus = await banc.creerPersonne();
  const sortie = (await creer(organisateur, [tom!, zoe!], [lieu()])).corps.sortie;
  for (const [methode, chemin] of [["POST", "terminer-vote"], ["POST", "invites"], ["DELETE", `participants/${tom!.idPublic}`], ["DELETE", ""]] as const) {
    const r = await intrus.demander(methode, `/app/sorties/${sortie.id}/${chemin}`.replace(/\/$/, ""), chemin === "invites" ? { invites: [tom!.idPublic] } : undefined);
    assert.deepEqual([r.statut, r.corps.erreur], [404, "sortie-inconnue"], `${methode} ${chemin} : jamais 403 pour qui ne voit pas la sortie`);
  }
  await tom!.demander("POST", `/app/sorties/${sortie.id}/reponse`, { vient: true });
  const reserve = await tom!.demander("POST", `/app/sorties/${sortie.id}/terminer-vote`);
  assert.deepEqual([reserve.statut, reserve.corps.erreur], [403, "reserve-a-l-organisateur"]);
  assert.equal((await tom!.demander("DELETE", `/app/sorties/${sortie.id}`)).statut, 403);
  assert.equal((await intrus.demander("DELETE", `/app/sorties/${sortie.id}/participation`)).statut, 200, "quitter ne dit rien d'une sortie qu'on ne voit pas");

  const retire = await organisateur.demander("DELETE", `/app/sorties/${sortie.id}/participants/${tom!.idPublic}`);
  assert.deepEqual([retire.statut, retire.corps], [200, { ok: true }]);
  assert.deepEqual(membresDe(sortie.conversationId), [organisateur.compteId], "il sort de la discussion");
  assert.equal((await tom!.demander("GET", `/app/sorties/${sortie.id}`)).statut, 404);
  assert.equal((await organisateur.demander("DELETE", `/app/sorties/${sortie.id}/participants/${intrus.idPublic}`)).corps.erreur, "personne-inconnue");
  const reinvite = await organisateur.demander("POST", `/app/sorties/${sortie.id}/invites`, { invites: [tom!.idPublic] });
  assert.deepEqual(reinvite.corps.sortie.invites.map((p: { id: string }) => p.id).sort(), [tom!.idPublic, zoe!.idPublic].sort(), "l'organisateur peut le réinviter");

  // La personne n'est cherchée qu'après la sortie et l'organisateur : rien n'est dit d'un compte qui t'a bloqué
  const bloqueuse = await banc.creerPersonne();
  banc.bloquer(bloqueuse, organisateur);
  for (const personne of [bloqueuse.idPublic, "zzzzzzzzzz"]) {
    const ailleurs = await organisateur.demander("DELETE", `/app/sorties/999999/participants/${personne}`);
    assert.deepEqual([ailleurs.statut, ailleurs.corps.erreur], [404, "sortie-inconnue"], "une sortie inconnue d'abord, quelle que soit la personne");
    const ici = await organisateur.demander("DELETE", `/app/sorties/${sortie.id}/participants/${personne}`);
    assert.deepEqual([ici.statut, ici.corps.erreur], [404, "personne-inconnue"], "qui t'a bloqué sans être de la sortie : comme un inconnu");
  }
  assert.equal((await organisateur.demander("DELETE", `/app/sorties/${sortie.id}/participants/pas-un-id`)).corps.champ, "personne");
  await zoe!.demander("POST", `/app/sorties/${sortie.id}/reponse`, { vient: true });
  banc.bloquer(zoe!, organisateur);
  const bloquante = await organisateur.demander("DELETE", `/app/sorties/${sortie.id}/participants/${zoe!.idPublic}`);
  assert.deepEqual([bloquante.statut, membresDe(sortie.conversationId).includes(zoe!.compteId)], [200, false], "une participante qui l'a bloqué : il peut la retirer");
});

test("15 personnes au plus, invitations en attente comprises, refus non comptés", async () => {
  const { organisateur, potes } = await bande(16);
  const sortie = (await creer(organisateur, potes.slice(0, 14), [lieu()])).corps.sortie;
  assert.equal(sortie.invites.length, 14);
  const pleine = await organisateur.demander("POST", `/app/sorties/${sortie.id}/invites`, { invites: [potes[14]!.idPublic] });
  assert.deepEqual([pleine.statut, pleine.corps.erreur], [409, "sortie-pleine"]);
  await potes[0]!.demander("POST", `/app/sorties/${sortie.id}/reponse`, { vient: false });
  const place = await organisateur.demander("POST", `/app/sorties/${sortie.id}/invites`, { invites: [potes[14]!.idPublic] });
  assert.equal(place.statut, 200, "un refus libère sa place");
  assert.equal((await creer(organisateur, potes.slice(0, 15), [lieu()])).corps.champ, "invites", "14 invités au plus à la création");
});

test("votes multiples, vote d'une personne bloquée compté sans être nommé, égalité au premier proposé, propositions", async () => {
  const { organisateur, potes: [tom, zoe] } = await bande(2);
  const [a, b] = [lieu(), lieu()];
  const sortie = (await creer(organisateur, [tom!, zoe!], [a!, b!])).corps.sortie;
  for (const p of [tom!, zoe!]) await p.demander("POST", `/app/sorties/${sortie.id}/reponse`, { vient: true });
  banc.bloquer(zoe!, tom!);
  const vote = await tom!.demander("PUT", `/app/sorties/${sortie.id}/votes/${b}`);
  assert.equal(vote.statut, 200);
  await tom!.demander("PUT", `/app/sorties/${sortie.id}/votes/${a}`);
  await tom!.demander("PUT", `/app/sorties/${sortie.id}/votes/${a}`);
  const vuZoe = (await zoe!.demander("GET", `/app/sorties/${sortie.id}`)).corps.sortie;
  const pourA = vuZoe.propositions.find((p: { lieuId: number }) => p.lieuId === a);
  assert.deepEqual([pourA.nombreVotes, pourA.votes.map((p: { id: string }) => p.id)], [2, [organisateur.idPublic]], "compté, pas nommé ; voter deux fois ne compte qu'une");
  assert.equal(vuZoe.participants.length, 3, "les participants restent nommés");
  await tom!.demander("DELETE", `/app/sorties/${sortie.id}/votes/${a}`);
  assert.equal((await tom!.demander("PUT", `/app/sorties/${sortie.id}/votes/${lieu()}`)).corps.erreur, "lieu-inconnu", "pas proposé");

  const c = lieu();
  const proposee = await zoe!.demander("POST", `/app/sorties/${sortie.id}/propositions`, { lieuId: c });
  assert.equal(proposee.statut, 201);
  assert.deepEqual(proposee.corps.sortie.propositions.at(-1).votes.map((p: { id: string }) => p.id), [zoe!.idPublic], "celui qui propose vote d'office");
  const deja = await tom!.demander("POST", `/app/sorties/${sortie.id}/propositions`, { lieuId: c });
  assert.deepEqual([deja.statut, deja.corps.deja], [200, true]);
  assert.equal(deja.corps.sortie.propositions.at(-1).proposePar, null, "proposé par une personne bloquée : pas nommé");
  assert.equal((await tom!.demander("POST", `/app/sorties/${sortie.id}/propositions`, { lieuId: "12" })).corps.champ, "lieuId");
  for (let i = 0; i < 5; i++) await tom!.demander("POST", `/app/sorties/${sortie.id}/propositions`, { lieuId: lieu() });
  assert.equal((await tom!.demander("POST", `/app/sorties/${sortie.id}/propositions`, { lieuId: lieu() })).corps.erreur, "max-propositions");

  // a : l'organisateur ; b : l'organisateur et Tom ; c : Zoé et Tom → b et c à égalité, b proposé le premier
  await tom!.demander("PUT", `/app/sorties/${sortie.id}/votes/${c}`);
  const fin = await organisateur.demander("POST", `/app/sorties/${sortie.id}/terminer-vote`);
  assert.deepEqual([fin.statut, fin.corps.sortie.lieuChoisi, fin.corps.sortie.voteTermine], [200, b, true], "à égalité, le premier proposé");
  assert.equal((await tom!.demander("PUT", `/app/sorties/${sortie.id}/votes/${a}`)).corps.erreur, "vote-termine");
  assert.equal((await organisateur.demander("POST", `/app/sorties/${sortie.id}/terminer-vote`)).corps.erreur, "vote-termine");
  await banc.attendreEnvois();
  assert.deepEqual(clocheDe(tom!).filter((n) => n.type === "sortie-lieu-choisi").map((n) => [n.acteurId, n.detail]), [[organisateur.compteId, `Le Bouiboui n°${b}`]]);
  assert.equal(clocheDe(organisateur).filter((n) => n.type === "sortie-lieu-choisi").length, 0, "pas pour celui qui a terminé");
  assert.ok(banc.pushs.some((p) => p.compteId === zoe!.compteId && p.message.texte === `Pizza du jeudi : rendez-vous chez Le Bouiboui n°${b}.`));
});

test("tâche de la minute : les votes échus reçoivent leur lieu, tout le monde est prévenu ; jamais deux passages en même temps", async () => {
  const { organisateur, potes: [tom] } = await bande(1);
  const ici = lieu();
  const sortie = (await creer(organisateur, [tom!], [ici])).corps.sortie;
  await tom!.demander("POST", `/app/sorties/${sortie.id}/reponse`, { vient: true });
  const sorties = banc.social.dependances.sorties;
  const appliquer = creerAppliquerEffetsSociaux({ cloche: banc.social.dependances.cloche, prevenirCompte: banc.social.dependances.prevenirCompte, horloge: () => banc.horloge.maintenant });
  // Les sorties des tests d'avant (l'horloge a avancé) passent d'abord
  await passerFinDesVotes({ sorties, appliquer, horloge: () => banc.horloge.maintenant });
  assert.deepEqual(await passerFinDesVotes({ sorties, appliquer, horloge: () => banc.horloge.maintenant }), { terminees: 0, echecs: 0 }, "pas encore l'heure");
  banc.horloge.maintenant += 61 * MINUTE;
  assert.equal((await tom!.demander("GET", `/app/sorties/${sortie.id}`)).corps.sortie.voteTermine, true, "finVote passé : terminé pour l'app, même avant la tâche");
  assert.equal((await tom!.demander("PUT", `/app/sorties/${sortie.id}/votes/${ici}`)).corps.erreur, "vote-termine");
  const bilan = await passerFinDesVotes({ sorties, appliquer, horloge: () => banc.horloge.maintenant });
  assert.equal(bilan.terminees >= 1, true);
  const lue = (await tom!.demander("GET", `/app/sorties/${sortie.id}`)).corps.sortie;
  assert.equal(lue.lieuChoisi, ici);
  await banc.attendreEnvois();
  for (const p of [organisateur, tom!]) {
    assert.deepEqual(clocheDe(p).filter((n) => n.type === "sortie-lieu-choisi").map((n) => n.acteurId), [null], "tous les participants, organisateur compris");
  }
  assert.deepEqual(await passerFinDesVotes({ sorties, appliquer, horloge: () => banc.horloge.maintenant }), { terminees: 0, echecs: 0 }, "une seule fois");

  let appels = 0;
  let finir: () => void = () => {};
  const lent = { terminerVotesEchus: () => { appels += 1; return new Promise<{ terminees: number; echecs: number; effets: [] }>((r) => { finir = () => r({ terminees: 0, echecs: 0, effets: [] }); }); } };
  const arreter = planifierFinDesVotes({ sorties: lent, appliquer, intervalleMs: 5 });
  await new Promise((r) => setTimeout(r, 40));
  assert.equal(appels, 1, "le passage d'avant n'est pas fini : on attend");
  finir();
  await new Promise((r) => setTimeout(r, 30));
  arreter();
  assert.ok(appels >= 2);
  const enPanne = { terminerVotesEchus: async () => { throw new Error("base indisponible"); } };
  assert.deepEqual(await passerFinDesVotes({ sorties: enPanne, appliquer }), { terminees: 0, echecs: 0 }, "une panne ne fait pas tomber la tâche");
});

test("l'organisateur qui part passe la main au plus ancien ; le dernier parti efface la sortie ; compte supprimé : on garde un organisateur", async () => {
  const { organisateur, potes: [tom, zoe, max] } = await bande(3);
  const sortie = (await creer(organisateur, [tom!, zoe!, max!], [lieu()])).corps.sortie;
  await zoe!.demander("POST", `/app/sorties/${sortie.id}/reponse`, { vient: true });
  banc.horloge.maintenant += MINUTE;
  await tom!.demander("POST", `/app/sorties/${sortie.id}/reponse`, { vient: true });
  assert.equal((await organisateur.demander("DELETE", `/app/sorties/${sortie.id}/participation`)).statut, 200);
  const vue = (await tom!.demander("GET", `/app/sorties/${sortie.id}`)).corps.sortie;
  assert.deepEqual([vue.organisateur.id, vue.participants.length], [zoe!.idPublic, 2], "Zoé a répondu la première");
  assert.equal((await zoe!.demander("GET", `/app/sorties/${sortie.id}`)).corps.sortie.moi.organisateur, true);
  assert.ok(!membresDe(sortie.conversationId).includes(organisateur.compteId));

  await banc.supprimerCompte(zoe!);
  const sansZoe = (await tom!.demander("GET", `/app/sorties/${sortie.id}`)).corps.sortie;
  assert.deepEqual([sansZoe.organisateur.id, sansZoe.moi.organisateur], [tom!.idPublic, true], "compte supprimé : le plus ancien participant prend la main");
  assert.equal((await tom!.demander("POST", `/app/sorties/${sortie.id}/invites`, { invites: [] })).corps.champ, "invites");
  await tom!.demander("DELETE", `/app/sorties/${sortie.id}/participation`);
  assert.equal(banc.tables.sorties.has(Number(sortie.id)), false, "plus de participant : la sortie est effacée");
  assert.equal(banc.tables.conversations.has(Number(sortie.conversationId)), false, "avec sa discussion");
  assert.equal((await max!.demander("GET", `/app/sorties/${sortie.id}`)).statut, 404, "l'invitation en attente part avec elle");
});

test("annulation : sortie et discussion effacées, « sortie-annulee » aux participants et invités, un message signalé garde son fichier", async () => {
  const { organisateur, potes: [tom, zoe] } = await bande(2);
  const sortie = (await creer(organisateur, [tom!, zoe!], [lieu()])).corps.sortie;
  await tom!.demander("POST", `/app/sorties/${sortie.id}/reponse`, { vient: true });
  const conversationId = Number(sortie.conversationId);
  const [garde, libre] = [banc.social.medias.tirerNom(), banc.social.medias.tirerNom()];
  for (const [fichier, auteurId] of [[garde, tom!.compteId], [libre, organisateur.compteId]] as const) {
    const id = prendreId(banc.tables, "messages");
    banc.tables.messages.set(id, { id, conversationId, auteurId, type: "photo", idClient: randomUUID(), fichier, creeLe: new Date(banc.horloge.maintenant) } as never);
    await banc.social.medias.ecrire(fichier, Buffer.from("photo"));
  }
  const signalement = prendreId(banc.tables, "signalements");
  banc.tables.signalements.set(signalement, { id: signalement, cible: "message", fichierMedia: garde, statut: "a-traiter", contesteLe: null, reexamineLe: null } as never);

  const nonLus = (await organisateur.demander("GET", `/app/sorties/${sortie.id}`)).corps.sortie.nonLus;
  assert.equal(nonLus, 1, "le message de Tom, pas le sien");
  assert.equal((await organisateur.demander("GET", `/app/sorties/${sortie.id}?version=${banc.tables.sorties.get(Number(sortie.id))!.version}`)).corps.inchange, true);
  assert.equal((await organisateur.demander("GET", `/app/sorties/${sortie.id}?version=abc`)).corps.champ, "version");

  assert.equal((await organisateur.demander("DELETE", `/app/sorties/${sortie.id}`)).statut, 200);
  assert.equal(banc.tables.sorties.has(Number(sortie.id)), false);
  assert.equal(banc.tables.conversations.has(conversationId), false);
  assert.ok(await banc.social.medias.lire(garde), "gardé pour la modération");
  assert.equal(await banc.social.medias.lire(libre), null);
  assert.ok(banc.tables.signalements.has(signalement), "le signalement reste");
  for (const p of [tom!, zoe!]) assert.deepEqual(clocheDe(p).filter((n) => n.type === "sortie-annulee").map((n) => n.detail), ["Pizza du jeudi"]);
  assert.equal((await tom!.demander("GET", `/app/sorties/${sortie.id}`)).statut, 404);
});

test("liste de mes sorties : à venir d'abord, puis les passées ; masquées absentes ; 20 sorties à venir au plus ; client commun", async () => {
  const { organisateur, potes: [tom] } = await bande(1);
  const tot = (await creer(organisateur, [tom!], [lieu()], { quand: iso(2 * 60 * MINUTE), finVote: iso(30 * MINUTE) })).corps.sortie;
  const tard = (await creer(organisateur, [tom!], [lieu()], { quand: iso(5 * 60 * MINUTE) })).corps.sortie;
  const passee = (await creer(organisateur, [tom!], [lieu()], { quand: iso(20 * MINUTE), finVote: iso(15 * MINUTE) })).corps.sortie;
  const masquee = (await creer(organisateur, [tom!], [lieu()])).corps.sortie;
  await organisateur.demander("PUT", `/app/masques/sortie/${masquee.id}`);
  banc.horloge.maintenant += 30 * MINUTE;
  const liste = (await organisateur.demander("GET", "/app/sorties")).corps.sorties.map((s: { id: string }) => s.id);
  assert.deepEqual(liste.filter((id: string) => [tot.id, tard.id, passee.id, masquee.id].includes(id)), [tot.id, tard.id, passee.id]);
  assert.deepEqual((await tom!.demander("GET", "/app/sorties")).corps.invitations.map((i: { id: string }) => i.id), [tot.id, masquee.id, tard.id], "invitations à venir seulement, la plus proche d'abord");

  const { organisateur: chargee, potes: [ami] } = await bande(1);
  const statuts: number[] = [];
  for (let i = 0; i < 11; i++) statuts.push((await creer(chargee, [ami!], [lieu()])).statut);
  assert.deepEqual(statuts, [...Array<number>(10).fill(201), 429], "10 créations par 24 h");
  const sorties = banc.social.dependances.sorties;
  const nouvelle = () => ({
    titre: "Encore", emoji: "🍕", quand: new Date(banc.horloge.maintenant + 3 * 60 * MINUTE), finVote: new Date(banc.horloge.maintenant + 60 * MINUTE),
    invites: [ami!.compteId], lieux: [lieu()],
  });
  for (let i = 10; i < 20; i++) assert.equal((await sorties.creer(chargee.compteId, nouvelle(), randomUUID(), new Date(banc.horloge.maintenant))).ok, true);
  assert.deepEqual(await sorties.creer(chargee.compteId, nouvelle(), randomUUID(), new Date(banc.horloge.maintenant)), { ok: false, erreur: "trop-de-sorties" }, "20 sorties à venir au plus");

  const appels: { methode: string; chemin: string; entetes: Record<string, string>; corps: unknown }[] = [];
  const faux = (async (adresse: string | URL | Request, init?: RequestInit) => {
    appels.push({ methode: init?.method ?? "GET", chemin: String(adresse).replace("https://api.exemple.fr", ""), entetes: init?.headers as Record<string, string>, corps: init?.body ? JSON.parse(String(init.body)) : undefined });
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } });
  }) as typeof fetch;
  const api = creerSortiesApi(creerClientHttp({ adresse: "https://api.exemple.fr", lireJeton: () => "jeton", fetch: faux }));
  await api.creer({ titre: "Brunch", emoji: "🥞", quand: "2026-10-20T10:00:00.000Z", finVote: "2026-10-20T09:00:00.000Z", invites: ["ab2cd3ef4g"], lieux: [3] }, "11111111-1111-4111-8111-111111111111");
  await api.lire("7", 3);
  await api.voter("7", 12, false);
  await api.retirerParticipant("7", "ab2cd3ef4g");
  assert.deepEqual(appels.map((a) => `${a.methode} ${a.chemin}`), ["POST /app/sorties", "GET /app/sorties/7?version=3", "DELETE /app/sorties/7/votes/12", "DELETE /app/sorties/7/participants/ab2cd3ef4g"]);
  assert.equal(appels[0]!.entetes["Idempotency-Key"], "11111111-1111-4111-8111-111111111111");
});

test("blocage avec celui qui a pris la main : invitation cachée et plus acceptable ; son premier geste l'écrit organisateur", async () => {
  const { organisateur, potes: [paul, bob, max] } = await bande(3);
  const sortie = (await creer(organisateur, [paul!, bob!, max!], [lieu()])).corps.sortie;
  await paul!.demander("POST", `/app/sorties/${sortie.id}/reponse`, { vient: true });
  banc.horloge.maintenant += MINUTE;
  await max!.demander("POST", `/app/sorties/${sortie.id}/reponse`, { vient: true });
  await banc.supprimerCompte(organisateur);
  // Paul a la main (le plus ancien participant), mais la colonne de l'organisateur est vide : le blocage ne retrouve pas la sortie
  assert.equal((await paul!.demander("PUT", `/app/blocages/${bob!.idPublic}`)).statut, 200);
  assert.deepEqual((await bob!.demander("GET", "/app/sorties")).corps.invitations, [], "l'invitation est cachée");
  assert.equal((await bob!.demander("GET", `/app/sorties/${sortie.id}`)).statut, 404);
  const oui = await bob!.demander("POST", `/app/sorties/${sortie.id}/reponse`, { vient: true });
  assert.deepEqual([oui.statut, oui.corps.erreur], [404, "sortie-inconnue"], "elle ne s'accepte plus");
  assert.ok(!membresDe(sortie.conversationId).includes(bob!.compteId), "ni la sortie, ni sa discussion");
  assert.equal(banc.tables.invitationsSorties.some((i) => i.sortieId === Number(sortie.id) && i.compteId === bob!.compteId), false, "invitation effacée");

  assert.equal((await paul!.demander("PUT", `/app/sorties/${sortie.id}/votes/${sortie.propositions[0].lieuId}`)).statut, 200);
  assert.equal(banc.tables.sorties.get(Number(sortie.id))!.organisateurId, paul!.compteId, "le premier geste écrit l'organisateur qui a la main");
  assert.equal((await paul!.demander("PUT", `/app/blocages/${max!.idPublic}`)).statut, 200);
  assert.ok(!membresDe(sortie.conversationId).includes(max!.compteId), "le blocage retrouve la sortie : Max en sort");
  assert.equal((await max!.demander("GET", `/app/sorties/${sortie.id}`)).statut, 404);
});

test("retirer, puis réinviter : la cloche suit, le téléphone ne sonne qu'une fois par 24 h pour la même sortie", async () => {
  const { organisateur, potes: [cible] } = await bande(1);
  const sortie = (await creer(organisateur, [cible!], [lieu()], { quand: iso(3 * 24 * 60 * MINUTE) })).corps.sortie;
  const boucle = async () => {
    assert.equal((await organisateur.demander("DELETE", `/app/sorties/${sortie.id}/participants/${cible!.idPublic}`)).statut, 200);
    assert.equal((await organisateur.demander("POST", `/app/sorties/${sortie.id}/invites`, { invites: [cible!.idPublic] })).statut, 200);
  };
  for (let i = 0; i < 3; i++) await boucle();
  await banc.attendreEnvois();
  const sons = () => banc.pushs.filter((p) => p.compteId === cible!.compteId).length;
  assert.equal(sons(), 1, "l'invitation de la création, et rien de plus");
  assert.equal(banc.tables.invitationsSorties.find((i) => i.sortieId === Number(sortie.id) && i.compteId === cible!.compteId)!.statut, "invite");
  banc.horloge.maintenant += 24 * 60 * MINUTE;
  await boucle();
  await banc.attendreEnvois();
  assert.equal(sons(), 2, "24 h plus tard, le téléphone peut sonner de nouveau");
});

test("version Prisma : un geste verrouille d'abord les comptes (FOR NO KEY UPDATE), puis la ligne de la sortie, puis relit la bande et les blocages", async () => {
  const appels: string[] = [];
  const noter = <T>(nom: string, valeur: T) => async () => (appels.push(nom), valeur);
  const creeLe = new Date("2026-10-14T10:00:00Z");
  const ligne = {
    id: 9, titre: "Brunch", emoji: "🥞", quand: new Date("2026-10-20T10:00:00Z"), finVote: new Date("2026-10-19T10:00:00Z"), organisateurId: 1,
    lieuChoisiId: null, voteTermineLe: null, version: 0, conversationId: 90,
    invitations: [{ compteId: 1, statut: "accepte", inviteParId: null, creeLe, reponduLe: creeLe }], propositions: [],
  };
  const tx = {
    $queryRaw: async (morceaux: readonly string[] | object) => {
      appels.push(Array.isArray(morceaux) ? morceaux.join("?").replace(/\s+/g, " ").trim() : "non-lus");
      return [];
    },
    sortie: { findMany: noter("sortie.findMany", [ligne]), update: noter("sortie.update", { id: 9 }) },
    lieu: { findMany: noter("lieu.findMany", []) },
    membreBande: { count: noter("membreBande.count", 1) },
    invitationSortie: { createMany: noter("invitationSortie.createMany", { count: 1 }) },
  };
  const base = { ...tx, $transaction: async (f: (t: typeof tx) => Promise<unknown>) => f(tx) };
  const relations = {
    bloqueEntre: async (_a: number, _b: number, dans?: unknown) => (appels.push(dans === tx ? "bloqueEntre(tx)" : "bloqueEntre(base)"), false),
    presenter: async () => new Map(),
    listerBlocages: async () => ({ parMoi: [], contreMoi: [], caches: new Set<number>() }),
    lirePushSocial: async () => new Set<number>(),
  };
  const sorties = creerSorties({ relations: relations as never, medias: banc.social.medias, base: base as never });
  const r = await sorties.inviter(1, 9, [2], new Date("2026-10-14T11:00:00Z"));
  assert.equal(r.ok, true);
  assert.deepEqual(appels.slice(0, 7), [
    "SELECT id FROM comptes WHERE id IN (?) ORDER BY id FOR NO KEY UPDATE", "SELECT id FROM sorties WHERE id = ? FOR UPDATE", "sortie.findMany",
    "membreBande.count", "bloqueEntre(tx)", "invitationSortie.createMany", "sortie.update",
  ]);
});
