// Tests de l'export « Télécharger mes données sociales » (GET /app/social/export, lot L7) : TES messages déchiffrés, jamais
// ceux des autres ni ton code d'invitation ; rien de ce que l'autre ne t'a pas montré (refus silencieux, blocage dans un
// sens ou dans l'autre, liste qui ne t'est plus visible, invitation refusée ou cachée) ; tes suivis et ce que tu as écrit en
// signalant ; déchiffré par paquets ; sans profil social, rien n'est créé ; 503 sans la clé ; 2 par 24 h. La sortie quittée
// et les limitations de ton compte : export-social-sorties-limitations.test.ts. Tout en mémoire, avec une clé de test.
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { after, before, test } from "node:test";

import { creerChiffrementDonnees } from "../src/services/chiffrement-donnees.ts";
import { creerChiffrementSocial } from "../src/services/chiffrement-social.ts";
import { assemblerExportSocial, PAQUET_DECHIFFREMENT, type DonneesExportSocial } from "../src/services/export-social-regles.ts";
import { creerBancSocial, type PersonneDeTest } from "./outils/creer-banc-social.ts";

let banc: Awaited<ReturnType<typeof creerBancSocial>>;
before(async () => {
  banc = await creerBancSocial();
  banc.tables.lieux.set(12, { statut: "publie", nom: "Chez Léa" });
});
after(() => banc.fermer());

const date = (decalageMs = 0) => new Date(banc.horloge.maintenant + decalageMs);
const exporter = async (p: PersonneDeTest) => {
  const r = await p.demander("GET", "/app/social/export");
  assert.equal(r.statut, 200, JSON.stringify(r.corps));
  return r;
};
const ecrire = (p: PersonneDeTest, id: string, texte: string) =>
  p.demander("POST", `/app/conversations/${id}/messages`, { idClient: randomUUID(), type: "texte", texte });

test("tes messages déchiffrés, le titre de tes groupes, tes réactions ; jamais les messages des autres ni ton code", async () => {
  const lea = await banc.creerPersonne({ prenom: "Léa", pseudo: "lea.export" });
  const malo = await banc.creerPersonne({ prenom: "Malo", pseudo: "malo.export" });
  const zoe = await banc.creerPersonne({ prenom: "Zoé", pseudo: "zoe.export" });
  const noe = await banc.creerPersonne({ prenom: "Noé", pseudo: "noe.export" });
  banc.rendrePotes(lea, malo);
  banc.rendrePotes(lea, zoe);
  banc.rendrePotes(lea, noe);
  const code = (await lea.demander("GET", "/app/bande/invitation")).corps.invitation.code as string;
  assert.match(code, /^[a-z0-9]{12}$/i);

  const prive = (await lea.demander("POST", "/app/conversations/prive", { personne: malo.idPublic })).corps.conversation.id as string;
  assert.equal((await ecrire(lea, prive, "Coucou Malo, on se fait une rescousse ?")).statut, 201);
  const secret = await ecrire(malo, prive, "Secret de Malo");
  assert.equal(secret.statut, 201);
  const lieu = await lea.demander("POST", `/app/conversations/${prive}/messages`, { idClient: randomUUID(), type: "lieu", lieuId: 12, texte: "Le meilleur kebab" });
  assert.equal(lieu.statut, 201, JSON.stringify(lieu.corps));
  assert.equal((await lea.demander("PUT", `/app/conversations/${prive}/messages/${secret.corps.message.id}/reactions/coeur`)).statut, 200);

  const groupe = (await lea.demander("POST", "/app/conversations/groupes", { titre: "Les Miamis", emoji: "🍕", invites: [malo.idPublic, zoe.idPublic, noe.idPublic], idClient: randomUUID() })).corps.conversation.id as string;
  assert.equal((await malo.demander("POST", `/app/conversations/${groupe}/reponse`, { rejoint: true })).statut, 200);
  assert.equal((await zoe.demander("POST", `/app/conversations/${groupe}/reponse`, { rejoint: false })).statut, 200);
  await ecrire(lea, groupe, "Bienvenue la Brigade");
  await ecrire(malo, groupe, "Message de Malo dans le groupe");

  const r = await exporter(lea);
  assert.match(r.entetes.get("cache-control") ?? "", /no-store/);
  const e = r.corps.export;
  assert.equal(e.genereLe, date().toISOString());
  assert.deepEqual([e.profil.personne.id, e.profil.reglages.trouvable], [lea.idPublic, true]);
  assert.deepEqual(e.bande.map((b: { personne: { id: string } }) => b.personne.id).sort(), [malo.idPublic, zoe.idPublic, noe.idPublic].sort());
  const [conversationPrivee, conversationGroupe] = e.conversations;
  assert.deepEqual([conversationPrivee.id, conversationPrivee.type, conversationPrivee.titre, [...conversationPrivee.membres].sort()], [prive, "prive", null, ["lea.export", "malo.export"]]);
  assert.deepEqual(conversationPrivee.messages.map((m: { type: string; texte: string; lieuId: number | null; taille: number | null }) => [m.type, m.texte, m.lieuId, m.taille]), [
    ["texte", "Coucou Malo, on se fait une rescousse ?", null, null],
    ["lieu", "Le meilleur kebab", 12, null],
  ], "tes messages seulement, déchiffrés");
  assert.deepEqual([conversationGroupe.titre, [...conversationGroupe.membres].sort(), conversationGroupe.messages.map((m: { texte: string }) => m.texte)],
    ["Les Miamis", ["lea.export", "malo.export"], ["Bienvenue la Brigade"]], "titre déchiffré ; Zoé a refusé : pas membre");
  assert.deepEqual(e.reactions.map((x: { messageId: string; reaction: string }) => [x.messageId, x.reaction]), [[secret.corps.message.id, "coeur"]]);
  const texte = JSON.stringify(e);
  for (const interdit of ["Secret de Malo", "Message de Malo", code, "v1:"]) assert.ok(!texte.includes(interdit), `jamais « ${interdit} » dans l'export`);

  const pourZoe = (await exporter(zoe)).corps.export;
  assert.deepEqual(pourZoe.invitationsGroupes.map((i: { titre: string | null; statut: string }) => [i.titre, i.statut]), [[null, "refuse"]], "refusée : plus son titre");
  assert.deepEqual(pourZoe.conversations, [], "ni messages ni membres d'un groupe où elle n'est pas entrée");
  assert.ok(!JSON.stringify(pourZoe).includes("Les Miamis"));
  const pourNoe = (await exporter(noe)).corps.export;
  assert.deepEqual(pourNoe.invitationsGroupes.map((i: { titre: string | null; statut: string }) => [i.titre, i.statut]), [["Les Miamis", "invite"]], "en attente : son titre");

  // Malo quitte le groupe : ses messages y restent, sans le titre ni les membres d'aujourd'hui
  assert.equal((await malo.demander("DELETE", `/app/conversations/${groupe}/membres/moi`)).statut, 200);
  const quitte = (await exporter(malo)).corps.export.conversations.find((c: { id: string }) => c.id === groupe);
  assert.deepEqual([quitte.titre, quitte.membres, quitte.messages.map((m: { texte: string }) => m.texte)], [null, [], ["Message de Malo dans le groupe"]]);
});

test("rien de ce que l'autre ne t'a pas montré : refus silencieux, puis blocage dans un sens ou dans l'autre", async () => {
  const demandeur = await banc.creerPersonne();
  const discrete = await banc.creerPersonne();
  const insistant = await banc.creerPersonne();
  banc.tables.demandes.push({ deId: demandeur.compteId, aId: discrete.compteId, creeLe: date(), refuseeLe: date() });
  banc.suivre(demandeur, discrete, "refuse");
  const avant = (await exporter(demandeur)).corps.export;
  assert.deepEqual(avant.demandesBande.envoyees.map((x: { personne: { id: string } }) => x.personne.id), [discrete.idPublic], "toujours « envoyée »");
  assert.deepEqual(avant.suivis.abonnements.map((x: { personne: { id: string }; statut: string }) => [x.personne.id, x.statut]), [[discrete.idPublic, "demande"]],
    "un suivi refusé se lit « demande » : on ne te dit pas qu'il a été refusé");
  const pourDiscrete = (await exporter(discrete)).corps.export;
  assert.deepEqual([pourDiscrete.demandesBande.recues, pourDiscrete.suivis.abonnes, pourDiscrete.suivis.demandesRecues], [[], [], []], "refusées : comme dans l'app");

  // Des liens restés malgré un blocage (sans les effacements de la vraie route) : la bande, les demandes et les suivis ne
  // nomment ni qui t'a bloqué, ni qui tu as bloqué
  banc.rendrePotes(demandeur, discrete);
  banc.tables.demandes.push({ deId: discrete.compteId, aId: demandeur.compteId, creeLe: date(), refuseeLe: null });
  banc.suivre(discrete, demandeur, "accepte");
  banc.suivre(insistant, demandeur, "demande");
  banc.bloquer(discrete, demandeur);
  banc.bloquer(demandeur, insistant);
  const apres = (await exporter(demandeur)).corps.export;
  assert.deepEqual([apres.bande, apres.demandesBande, apres.suivis], [[], { envoyees: [], recues: [] }, { abonnements: [], abonnes: [], demandesRecues: [] }]);
  assert.deepEqual(apres.bloques.map((p: { id: string }) => p.id), [insistant.idPublic], "ceux que TU as bloqués, jamais qui t'a bloqué");
  const pourDiscreteApres = (await exporter(discrete)).corps.export;
  assert.deepEqual(pourDiscreteApres.bloques.map((p: { id: string }) => p.id), [demandeur.idPublic], "ceux que TU as bloqués");
  assert.ok(!JSON.stringify({ ...pourDiscreteApres, bloques: [] }).includes(demandeur.idPublic!), "et nulle part ailleurs");
});

test("blocage par l'autre, puis il change de pseudo : ni son nouveau pseudo ni l'ancien ; tes messages du privé restent", async () => {
  const lea = await banc.creerPersonne({ pseudo: "lea.brouille" });
  const malo = await banc.creerPersonne({ pseudo: "malo.avant" });
  const noe = await banc.creerPersonne({ pseudo: "noe.temoin" });
  banc.rendrePotes(lea, malo);
  banc.rendrePotes(lea, noe);
  const prive = (await lea.demander("POST", "/app/conversations/prive", { personne: malo.idPublic })).corps.conversation.id as string;
  assert.equal((await ecrire(lea, prive, "Avant la brouille")).statut, 201);
  assert.equal((await ecrire(malo, prive, "Réponse de Malo")).statut, 201);
  const groupe = (await lea.demander("POST", "/app/conversations/groupes", { titre: "La tablée", emoji: "🍲", invites: [malo.idPublic, noe.idPublic], idClient: randomUUID() })).corps.conversation.id as string;
  for (const p of [malo, noe]) assert.equal((await p.demander("POST", `/app/conversations/${groupe}/reponse`, { rejoint: true })).statut, 200);

  // Malo bloque Léa (la vraie route : bande, suivis et invitations partent ; le privé et le groupe restent), puis change de pseudo
  assert.equal((await malo.demander("PUT", `/app/blocages/${lea.idPublic}`)).statut, 200);
  banc.tables.comptes.get(malo.compteId)!.pseudo = "malo.apres";
  const e = (await exporter(lea)).corps.export;
  const texte = JSON.stringify(e);
  for (const interdit of ["malo.apres", "malo.avant", malo.idPublic!, "Réponse de Malo"]) assert.ok(!texte.includes(interdit), `jamais « ${interdit} »`);
  const pourLea = (id: string) => e.conversations.find((c: { id: string }) => c.id === id);
  assert.deepEqual([pourLea(prive).membres, pourLea(prive).messages.map((m: { texte: string }) => m.texte)], [["lea.brouille"], ["Avant la brouille"]], "toi seul, tes messages");
  assert.deepEqual([...pourLea(groupe).membres].sort(), ["lea.brouille", "noe.temoin"], "le groupe ne le nomme pas non plus");
  assert.deepEqual(e.bloques, [], "il t'a bloqué : tu ne le sais pas");

  // Pour Malo, qui a bloqué : Léa dans « bloques » (comme Réglages › Personnes bloquées), nulle part ailleurs
  const pourMalo = (await exporter(malo)).corps.export;
  assert.deepEqual(pourMalo.bloques.map((p: { pseudo: string }) => p.pseudo), ["lea.brouille"]);
  const privePourMalo = pourMalo.conversations.find((c: { id: string }) => c.id === prive);
  assert.deepEqual([privePourMalo.membres, privePourMalo.messages.map((m: { texte: string }) => m.texte)], [["malo.apres"], ["Réponse de Malo"]]);
  assert.ok(!JSON.stringify({ ...pourMalo, bloques: [] }).includes("lea.brouille"));
});

test("invitations qu'un blocage te cache : un groupe sans son titre, une sortie absente (même quand l'organisateur est parti)", async () => {
  const moi = await banc.creerPersonne();
  const hote = await banc.creerPersonne();
  const ami = await banc.creerPersonne();
  banc.rendrePotes(hote, moi);
  const groupe = await hote.demander("POST", "/app/conversations/groupes", { titre: "Club secret", emoji: "🎲", invites: [moi.idPublic], idClient: randomUUID() });
  assert.equal(groupe.statut, 201, JSON.stringify(groupe.corps));
  const t = banc.tables;
  const sortie = (id: number, titre: string, organisateurId: number | null, inviteParId: number | null, jours: number) => {
    t.sorties.set(id, {
      id, conversationId: id, organisateurId, titre, emoji: "🍕", quand: date(jours * 86_400_000), finVote: date(), lieuChoisiId: null, voteTermineLe: null, rappelEnvoyeLe: null, version: 0, modifieLe: date(), creeLe: date(),
    });
    if (organisateurId !== null) t.invitationsSorties.push({ sortieId: id, compteId: organisateurId, inviteParId: null, statut: "accepte", creeLe: date(-9_000), reponduLe: null });
    t.invitationsSorties.push({ sortieId: id, compteId: moi.compteId, inviteParId, statut: "invite", creeLe: date(), reponduLe: null });
  };
  sortie(9801, "Chez l'hôte", hote.compteId, hote.compteId, 1);
  // L'organisateur est parti avec son compte : l'hôte, plus ancien participant, a la main
  sortie(9802, "Sans organisateur", null, null, 2);
  t.invitationsSorties.push({ sortieId: 9802, compteId: hote.compteId, inviteParId: null, statut: "accepte", creeLe: date(-5_000), reponduLe: date(-4_000) });
  sortie(9803, "Chez l'ami", ami.compteId, ami.compteId, 3);
  const titres = (e: { invitationsGroupes: { titre: string | null }[]; sorties: { titre: string; role: string }[] }) =>
    [e.invitationsGroupes.map((i) => i.titre), e.sorties.map((s) => [s.titre, s.role])];
  assert.deepEqual(titres((await exporter(moi)).corps.export), [["Club secret"], [["Chez l'hôte", "invite"], ["Sans organisateur", "invite"], ["Chez l'ami", "invite"]]]);
  banc.bloquer(moi, hote);
  const apres = (await exporter(moi)).corps.export;
  assert.deepEqual(titres(apres), [[null], [["Chez l'ami", "invite"]]]);
  assert.ok(!JSON.stringify(apres).includes("Club secret"));
});

test("sorties, listes, commentaires, cloche, signalements, masques et médias", async () => {
  const moi = await banc.creerPersonne();
  const autre = await banc.creerPersonne();
  const t = banc.tables;
  const c = 9100;
  t.conversations.set(c, { id: c, type: "groupe", clePrive: null, titreChiffre: null, emoji: "📷", photo: null, creeParId: moi.compteId, version: 0, dernierMessageLe: date(), modifieLe: date(), creeLe: date() });
  t.membres.push({ conversationId: c, compteId: moi.compteId, role: "admin", visibleApres: 0, luJusqua: 0, coupee: false, arriveLe: date(), epingleeLe: null, luLe: null });
  t.messages.set(9101, {
    id: 9101, conversationId: c, auteurId: moi.compteId, type: "photo", idClient: randomUUID(), texteChiffre: null, fichier: null, typeMime: "image/jpeg", taille: 1234,
    largeur: 10, hauteur: 10, dureeSecondes: null, mediaExpireLe: date(), creeLe: date(), supprimeLe: null, suspenduLe: null, retireLe: null, reponseAId: null, modifieLe: null, album: null, onde: null, systeme: null,
  });
  const sortie = (id: number, titre: string, organisateurId: number, statut: string | null, joursAvant: number) => {
    t.sorties.set(id, {
      id, conversationId: id, organisateurId, titre, emoji: "🍝", quand: date(-joursAvant * 86_400_000), finVote: date(), lieuChoisiId: null, voteTermineLe: null, rappelEnvoyeLe: null, version: 0, modifieLe: date(), creeLe: date(),
    });
    // Comme dans la vraie base : l'organisateur participe à sa sortie (son invitation « accepte »)
    if (organisateurId !== moi.compteId) t.invitationsSorties.push({ sortieId: id, compteId: organisateurId, inviteParId: null, statut: "accepte", creeLe: date(-9_000), reponduLe: null });
    if (statut) t.invitationsSorties.push({ sortieId: id, compteId: moi.compteId, inviteParId: organisateurId === moi.compteId ? null : autre.compteId, statut, creeLe: date(), reponduLe: null });
  };
  sortie(9201, "Mon resto", moi.compteId, "accepte", 4);
  sortie(9202, "Invité", autre.compteId, "invite", 3);
  sortie(9203, "Participant", autre.compteId, "accepte", 2);
  sortie(9204, "Refusée", autre.compteId, "refuse", 1);
  t.propositions.set(9301, { id: 9301, sortieId: 9201, lieuId: 12, proposeParId: moi.compteId, creeLe: date() });
  t.propositions.set(9302, { id: 9302, sortieId: 9203, lieuId: 14, proposeParId: autre.compteId, creeLe: date() });
  t.votes.push({ propositionId: 9302, compteId: moi.compteId, creeLe: date() });
  const liste = (id: number, auteurId: number, titre: string) =>
    t.listes.set(id, { id, auteurId, titre, emoji: "📋", description: "", visibilite: "tous", suspendueLe: null, retireeLe: null, creeLe: date(), modifieLe: date() });
  liste(9401, moi.compteId, "Mes kebabs");
  liste(9402, autre.compteId, "On remplit ensemble");
  liste(9403, autre.compteId, "Je la suis");
  t.lieuxListes.push(
    { listeId: 9401, lieuId: 12, ajouteParId: moi.compteId, creeLe: date() }, { listeId: 9401, lieuId: 13, ajouteParId: autre.compteId, creeLe: date() },
    { listeId: 9402, lieuId: 14, ajouteParId: moi.compteId, creeLe: date() }, { listeId: 9402, lieuId: 15, ajouteParId: autre.compteId, creeLe: date() },
    { listeId: 9403, lieuId: 16, ajouteParId: autre.compteId, creeLe: date() },
  );
  t.coAuteurs.push({ listeId: 9402, compteId: moi.compteId, statut: "accepte", creeLe: date(), reponduLe: date() });
  t.abonnementsListes.push({ listeId: 9403, compteId: moi.compteId, creeLe: date() });
  t.commentaires.set(9501, {
    id: 9501, publicationId: 7, auteurId: moi.compteId, commeLieuId: null, ecritParId: null, texte: "Trop bon !", mentions: [], reponseAId: null, creeLe: date(),
    modifieLe: null, supprimeLe: null, masqueParLieuLe: null, suspenduLe: null, retireLe: null,
  });
  t.jaimesCommentaires.push({ commentaireId: 9502, compteId: moi.compteId, creeLe: date() });
  t.cloche.set(9601, { id: 9601, compteId: moi.compteId, type: "mention", acteurId: autre.compteId, cible: "commentaire", cibleId: "9501", detail: null, enRetour: false, creeLe: date() });
  const signalement = (id: number, cible: string) =>
    t.signalements.set(id, { id, cible, cibleId: "1", raison: "haine", precision: null, explication: "", statut: "a-traiter", creeLe: date(), signaleParId: moi.compteId } as never);
  signalement(9701, "message");
  signalement(9702, "publication");
  t.masques.push({ compteId: moi.compteId, cible: "sortie", cibleId: "42", creeLe: date() });

  const e = (await exporter(moi)).corps.export;
  assert.deepEqual(e.conversations[0].messages, [{ date: date().toISOString(), type: "photo", texte: null, lieuId: null, taille: 1234 }], "un média : date, type et taille");
  assert.deepEqual(e.sorties.map((s: { titre: string; role: string; propositions: number[]; votes: number[] }) => [s.titre, s.role, s.propositions, s.votes]), [
    ["Mon resto", "organisateur", [12], []], ["Invité", "invite", [], []], ["Participant", "participant", [], [14]],
  ], "une invitation refusée n'y est pas");
  assert.deepEqual(e.listes.map((l: { titre: string; role: string; lieux: number[] }) => [l.titre, l.role, l.lieux]), [
    ["Mes kebabs", "auteur", [12, 13]], ["On remplit ensemble", "co-auteur", [14]], ["Je la suis", "abonne", []],
  ]);
  assert.deepEqual(e.commentaires, [{ publicationId: "7", texte: "Trop bon !", date: date().toISOString() }]);
  assert.deepEqual([e.jaimesCommentaires, e.cloche, e.masques], [["9502"], [{ type: "mention", date: date().toISOString() }], [{ cible: "sortie", cibleId: "42" }]]);
  assert.deepEqual(e.signalements, [{ cible: "message", raison: "haine", precision: null, explication: "", date: date().toISOString(), statut: "a-traiter" }], "seulement les contenus sociaux");
});

test("listes suivies ou co-écrites : le titre seulement si elle t'est encore visible ; tes lieux de co-auteur restent", async () => {
  const moi = await banc.creerPersonne();
  const auteur = await banc.creerPersonne();
  const discrete = await banc.creerPersonne({ prive: true });
  const fache = await banc.creerPersonne();
  const t = banc.tables;
  const liste = (id: number, auteurId: number, titre: string, en: { visibilite?: string; suspendueLe?: Date; retireeLe?: Date } = {}) => t.listes.set(id, {
    id, auteurId, titre, emoji: "📋", description: "", visibilite: en.visibilite ?? "tous", suspendueLe: en.suspendueLe ?? null, retireeLe: en.retireeLe ?? null, creeLe: date(), modifieLe: date(),
  });
  const suivre = (id: number) => t.abonnementsListes.push({ listeId: id, compteId: moi.compteId, creeLe: date() });
  liste(9901, auteur.compteId, "Visible");
  liste(9902, auteur.compteId, "Suspendue", { suspendueLe: date() });
  liste(9903, auteur.compteId, "Retirée", { retireeLe: date() });
  liste(9904, auteur.compteId, "Pour sa bande", { visibilite: "bande" });
  liste(9905, discrete.compteId, "Compte privé");
  liste(9906, auteur.compteId, "Signalée par toi");
  liste(9907, fache.compteId, "De qui t'a bloqué");
  for (let id = 9901; id <= 9907; id++) suivre(id);
  t.signalements.set(9908, { id: 9908, cible: "liste", cibleId: "9906", raison: "haine", precision: null, explication: "", statut: "a-traiter", creeLe: date(), signaleParId: moi.compteId } as never);
  liste(9909, auteur.compteId, "Co-écrite puis suspendue", { suspendueLe: date() });
  t.coAuteurs.push({ listeId: 9909, compteId: moi.compteId, statut: "accepte", creeLe: date(), reponduLe: date() });
  t.lieuxListes.push(
    { listeId: 9901, lieuId: 20, ajouteParId: auteur.compteId, creeLe: date() },
    { listeId: 9909, lieuId: 21, ajouteParId: moi.compteId, creeLe: date() }, { listeId: 9909, lieuId: 22, ajouteParId: auteur.compteId, creeLe: date() },
  );
  banc.bloquer(fache, moi);
  const listes = async () => (await exporter(moi)).corps.export.listes.map((l: { titre: string | null; role: string; lieux: number[] }) => [l.titre, l.role, l.lieux]);
  assert.deepEqual(await listes(), [
    ["Visible", "abonne", []], [null, "abonne", []], [null, "abonne", []], [null, "abonne", []], [null, "abonne", []], [null, "abonne", []], [null, "abonne", []],
    [null, "co-auteur", [21]],
  ], "abonné : jamais de lieux ; co-auteur : les tiens, même quand le titre est caché");
  // Pote de l'auteur, abonné accepté du compte privé : leurs listes te sont de nouveau visibles
  banc.rendrePotes(moi, auteur);
  banc.suivre(moi, discrete);
  assert.deepEqual((await listes()).map(([titre]: [string | null]) => titre), ["Visible", null, null, "Pour sa bande", "Compte privé", null, null, null]);
});

test("tes abonnements avec leur statut, tes demandes de suivi reçues, et ce que TU as écrit en signalant (jamais la décision)", async () => {
  const moi = await banc.creerPersonne();
  const [suivie, demandee, refuseuse, curieux, fan] = await Promise.all([1, 2, 3, 4, 5].map(() => banc.creerPersonne()));
  banc.suivre(moi, suivie!, "accepte");
  banc.suivre(moi, demandee!, "demande");
  banc.suivre(moi, refuseuse!, "refuse");
  banc.suivre(curieux!, moi, "demande");
  banc.suivre(fan!, moi, "accepte");
  banc.tables.signalements.set(9951, {
    id: 9951, cible: "message", cibleId: "77", lieuId: null, raison: "haine", precision: "Insultes", explication: "Il m'a insultée deux fois", source: "app",
    statut: "retenu", decision: "Note privée de la Brigade", motif: "haine", motivation: "Motivation pour l'auteur", contestation: "Je conteste",
    contesteLe: date(), reexamineLe: null, creeLe: date(), traiteLe: date(), signaleParId: moi.compteId, auteurContenuId: fan!.compteId,
    instantaneChiffre: "v1:instantane-secret", fichierMedia: "fichier-secret.bin",
  } as never);
  const e = (await exporter(moi)).corps.export;
  const ids = (liens: { personne: { id: string } }[]) => liens.map((l) => l.personne.id);
  assert.deepEqual(e.suivis.abonnements.map((s: { personne: { id: string }; statut: string; depuis: string }) => [s.personne.id, s.statut, s.depuis]), [
    [suivie!.idPublic, "suivi", date().toISOString()], [demandee!.idPublic, "demande", date().toISOString()], [refuseuse!.idPublic, "demande", date().toISOString()],
  ], "un refus, silencieux, se lit « demande »");
  assert.deepEqual([ids(e.suivis.demandesRecues), ids(e.suivis.abonnes)], [[curieux!.idPublic], [fan!.idPublic]]);
  assert.deepEqual(e.signalements, [{
    cible: "message", raison: "haine", precision: "Insultes", explication: "Il m'a insultée deux fois", date: date().toISOString(), statut: "retenu",
  }]);
  const texte = JSON.stringify(e);
  for (const interdit of ["Note privée", "Motivation pour", "Je conteste", "instantane-secret", "fichier-secret", '"77"']) assert.ok(!texte.includes(interdit), `jamais « ${interdit} »`);
});

test("des milliers de messages : déchiffrés par paquets, en laissant passer les autres demandes entre deux paquets", async () => {
  const chiffrement = creerChiffrementSocial(creerChiffrementDonnees(randomBytes(32)))!;
  const nombre = PAQUET_DECHIFFREMENT * 2 + 1;
  const messages: DonneesExportSocial["messages"] = Array.from({ length: nombre }, (_, i) => {
    const idClient = randomUUID();
    const conversationId = 1 + (i % 2);
    return { id: i + 1, conversationId, type: "texte", idClient, texteChiffre: chiffrement.chiffrerMessage(`Message ${i + 1}`, conversationId, idClient), taille: null, creeLe: date() };
  });
  const d: DonneesExportSocial = {
    profil: null, bande: [], demandesEnvoyees: [], demandesRecues: [], abonnements: [], abonnes: [], demandesSuiviRecues: [],
    conversations: [1, 2].map((id) => ({ id, type: "groupe", titreChiffre: null, titreSortie: null })),
    membres: [1, 2].map((conversationId) => ({ conversationId, compteId: 1 })), messages,
    invitationsGroupes: [], reactions: [], sondages: [], votesSondages: [], sorties: [], invitationsSorties: [], participantsSorties: [], propositions: [], votes: [], listes: [], coAuteur: [],
    abonnementsListes: [], lieuxListes: [], commentaires: [], jaimesCommentaires: [], cloche: [], signalements: [], masques: [],
  };
  const relations = {
    presenter: async () => new Map(), lireLiens: async () => new Map(),
    listerBlocages: async () => ({ parMoi: [], contreMoi: [], caches: new Set<number>() }),
  };
  // Un tour de boucle compté à chaque fois que Node reprend la main (sans paquets, aucun avant la fin)
  let tours = 0;
  let fini = false;
  const compter = () => {
    tours += 1;
    if (!fini) setImmediate(compter);
  };
  setImmediate(compter);
  const e = await assemblerExportSocial(d, { compteId: 1, relations, chiffrement, maintenant: date() });
  const toursPendant = tours;
  fini = true;
  assert.ok(toursPendant >= 2, `l'API a repris la main entre les paquets (${toursPendant} fois)`);
  const textes = e.conversations.flatMap((c) => c.messages.map((m) => m.texte));
  assert.equal(textes.length, nombre);
  assert.deepEqual(e.conversations[0]!.messages.slice(0, 2).map((m) => m.texte), ["Message 1", "Message 3"], "rangés par conversation, dans l'ordre");
  assert.equal(e.conversations[1]!.messages.at(-1)!.texte, `Message ${nombre - 1}`);
});

test("sans profil social : profil null, et rien n'est créé", async () => {
  const discret = await banc.creerPersonne({ sansProfil: true });
  banc.tables.masques.push({ compteId: discret.compteId, cible: "suggestion", cibleId: "personne:abcdefghij", creeLe: date() });
  const e = (await exporter(discret)).corps.export;
  assert.deepEqual([e.profil, e.masques], [null, [{ cible: "suggestion", cibleId: "personne:abcdefghij" }]]);
  assert.equal(banc.tables.profils.has(discret.compteId), false, "une lecture ne crée jamais le profil social");
});

test("2 exports par 24 h ; sans session : 401", async () => {
  const p = await banc.creerPersonne();
  await exporter(p);
  await exporter(p);
  const trop = await p.demander("GET", "/app/social/export");
  assert.deepEqual([trop.statut, trop.corps.erreur], [429, "trop-de-demandes"]);
  assert.ok(Number(trop.entetes.get("retry-after")) > 0);
  assert.equal((await banc.demander("GET", "/app/social/export")).statut, 401);
});

test("sans la clé des données : 503 chiffrement-indisponible, sans compter dans les 2 par 24 h", async () => {
  const sansCle = await creerBancSocial({ sansCle: true });
  try {
    const p = await sansCle.creerPersonne({ sansProfil: true });
    for (let i = 0; i < 3; i++) assert.deepEqual((await p.demander("GET", "/app/social/export")).corps, { ok: false, erreur: "chiffrement-indisponible" });
    assert.equal((await p.demander("GET", "/app/social/export")).statut, 503);
  } finally {
    await sansCle.fermer();
  }
});
