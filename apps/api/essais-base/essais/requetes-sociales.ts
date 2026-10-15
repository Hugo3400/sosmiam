// Essai sur base (PGlite, toutes les migrations du dépôt) des requêtes brutes du socle social (lot L2) par le VRAI client
// Prisma : recherche par pseudo (l'exact en tête, « _ » échappé, ni bloqués ni introuvables ni sans profil), potes de
// potes, pouls (non-lus, invitations, cloche, demandes, signature de la bande), « vu » de la cloche (ne recule jamais, jamais
// après maintenant, rien d'écrit sans profil), création du profil social (ON CONFLICT : un identifiant pris, on en tire un
// autre ; déjà là, on le rend). Porté du scratchpad (essai-l2b), où un faux client rejouait les gabarits. Aucune vraie base.
import "../socle/garde-fou.ts";
import type { Prisma } from "../../src/base-de-donnees/client-genere/client.ts";
import { creerCloche } from "../../src/services/cloche.ts";
import { creerRelationsSociales } from "../../src/services/relations-sociales.ts";
import { construireRequetePouls, lirePoulsSocial, presenterPouls, type LignePouls } from "../../src/services/social-pouls.ts";
import { construireRequetePotesDePotes, construireRequeteRecherche, creerSocial } from "../../src/services/social.ts";
import { creerBaseEnMemoire } from "../socle/base-en-memoire.ts";
import { creerVerifications, terminerEssai } from "../socle/verifications.ts";

const essai = await creerBaseEnMemoire();
const { base } = essai;
const q = essai.sql;
const verifications = creerVerifications();
const { egal } = verifications;
const brut = <T = Record<string, unknown>>(requete: Prisma.Sql) => base.$queryRaw<T[]>(requete);
const pseudos = async (compteId: number, debut: string) => (await brut<{ pseudo: string }>(construireRequeteRecherche(compteId, debut))).map((l) => l.pseudo);
const pouls = async (compteId: number, quand: Date) => presenterPouls((await brut<LignePouls>(construireRequetePouls(compteId, quand)))[0]!);
const compter = async (sql: string, valeurs: unknown[]) => Number((await q(sql, valeurs))[0]!.n);

const T = "2026-10-14T10:00:00Z";
const maintenant = new Date(T);
for (const [id, pseudo] of [[1, "moi"], [2, "tom"], [3, "tom_cache"], [4, "tomate"], [5, "toma"], [6, "bloqueur"], [7, "tom.bloque"], [8, "tomxx"], [9, "pote"], [10, "ami.ami"]] as const) {
  await q(`INSERT INTO comptes (id, email, mot_de_passe, prenom, cgu_version, pseudo, prive) VALUES ($1, $2, 'x', 'P', '2026-10-08', $3, $4)`, [id, `c${id}@exemple.fr`, pseudo, id === 5]);
  if (id !== 8) await q(`INSERT INTO profils_sociaux (compte_id, id_public, trouvable) VALUES ($1, $2, $3)`, [id, `id${String(id).padStart(8, "a")}`.slice(0, 10), id !== 3]);
}
await q(`INSERT INTO comptes (id, email, mot_de_passe, prenom, cgu_version, pseudo) VALUES (11, 'c11@exemple.fr', 'x', 'P', '2026-10-08', 'sans.profil'), (12, 'c12@exemple.fr', 'x', 'P', '2026-10-08', NULL)`);
await q(`INSERT INTO blocages (bloqueur_id, bloque_id) VALUES (6, 1), (1, 7)`);
await q(`INSERT INTO membres_bandes (compte_id, pote_id, cree_le) VALUES (1, 9, $1), (9, 1, $1), (9, 10, $1), (10, 9, $1), (9, 4, $1), (4, 9, $1)`, [T]);

// Recherche : exact en tête, plus courts d'abord, ni bloqués (dans les deux sens), ni introuvables, ni sans profil ; « _ » littéral
egal(await pseudos(1, "tom"), ["tom", "toma", "tomate"], "recherche « tom »");
egal(await pseudos(1, "tom_"), [], "« _ » n'est pas un joker (tom_cache est introuvable)");
egal((await pseudos(2, "tom_")).length, 0);
await q(`UPDATE profils_sociaux SET trouvable = true WHERE compte_id = 3`);
egal(await pseudos(2, "tom_"), ["tom_cache"]);
egal((await pseudos(2, "tomx")).length, 0, "« tomxx » n'a pas de profil social");
const [toma] = await brut<{ pseudo: string; prive: boolean; pote: boolean; idPublic: unknown }>(construireRequeteRecherche(1, "toma"));
egal([toma!.pseudo, toma!.prive, toma!.pote, typeof toma!.idPublic], ["toma", true, false, "string"]);

// Potes de potes : sans moi, sans mes potes, rangés par potes en commun
egal(await brut(construireRequetePotesDePotes(1)), [{ id: 4, communs: 1 }, { id: 10, communs: 1 }]);

// Pouls
const vide = await pouls(12, maintenant);
egal([vide.messages.signature, vide.bande.signature, vide.cloche.nonVues, vide.cloche.signature], ["", "", 0, "0:0:"], "sans profil : tout à zéro");
await q(`INSERT INTO conversations (id, type, modifie_le) VALUES (50, 'groupe', $1), (51, 'sortie', $1), (52, 'prive', $1)`, [T]);
await q(`INSERT INTO membres_conversations (conversation_id, compte_id, lu_jusqua, visible_apres) VALUES (50, 1, 0, 0), (50, 9, 0, 0), (51, 1, 0, 0), (52, 1, 3, 0)`);
await q(`INSERT INTO messages_conversations (id, conversation_id, auteur_id, type, id_client, supprime_le, suspendu_le) VALUES
  (1, 52, 9, 'texte', 'a', NULL, NULL), (2, 52, 9, 'texte', 'b', NULL, NULL), (3, 52, 9, 'texte', 'c', NULL, NULL), (4, 52, 9, 'texte', 'd', NULL, NULL),
  (5, 50, 9, 'texte', 'e', NULL, NULL), (6, 50, 1, 'texte', 'f', NULL, NULL), (7, 50, 6, 'texte', 'g', NULL, NULL), (8, 50, 7, 'texte', 'h', NULL, NULL),
  (9, 50, NULL, 'texte', 'i', NULL, NULL), (10, 50, 9, 'texte', 'j', $1, NULL), (11, 50, 9, 'texte', 'k', NULL, $1), (12, 51, 9, 'texte', 'l', NULL, NULL)`, [T]);
await q(`SELECT setval('messages_conversations_id_seq', 100)`);
for (let i = 0; i < 120; i++) await q(`INSERT INTO messages_conversations (conversation_id, auteur_id, type, id_client) VALUES (51, 9, 'texte', $1)`, [`s${i}`]);
await q(`INSERT INTO invitations_groupes (conversation_id, compte_id, invite_par_id, statut, cree_le) VALUES (50, 4, 9, 'invite', $1), (52, 4, 9, 'refuse', $1)`, [T]);
await q(`INSERT INTO sorties (id, conversation_id, organisateur_id, titre, emoji, quand, fin_vote, modifie_le) VALUES (70, 51, 9, 'Pizza', '🍕', '2026-10-20T19:00:00Z', '2026-10-19T19:00:00Z', $1)`, [T]);
await q(`INSERT INTO invitations_sorties (sortie_id, compte_id, statut) VALUES (70, 1, 'accepte'), (70, 4, 'invite'), (70, 10, 'refuse')`);
await q(`INSERT INTO notifications_cloche (compte_id, type, acteur_id, cree_le) VALUES (1, 'nouvel-abonne', 9, $1), (1, 'nouvel-abonne', 6, $1), (1, 'contenu-retire', NULL, $1), (4, 'invitation-groupe', 9, $1)`, [T]);
await q(`INSERT INTO demandes_bandes (de_id, a_id, cree_le, refusee_le) VALUES (2, 1, $1, NULL), (5, 1, $1, $1)`, [T]);
await q(`INSERT INTO suivis_personnes (suiveur_id, suivi_id, statut) VALUES (2, 1, 'demande'), (4, 1, 'refuse'), (5, 1, 'accepte')`);
const moi = await pouls(1, maintenant);
// Privé : le 4 (après lu_jusqua = 3) ; groupe : le 5 et le 9 (ni le mien, ni ceux d'un bloqueur ou d'un bloqué, ni le
// supprimé, ni le suspendu) ; la sortie compte à part
egal(moi.messages.nonLus, 3);
egal(moi.sorties.nonLus, 99, "99 au plus par conversation");
egal([moi.messages.invitations, moi.sorties.invitations], [0, 0]);
egal(moi.cloche.nonVues, 2, "sans l'acteur qui m'a bloquée");
egal([moi.demandes.bande, moi.demandes.suivis], [1, 1]);
egal(moi.bande.signature, "1:2026-10-14T10:00:00.000Z");
const invitee = await pouls(4, maintenant);
egal([invitee.messages.invitations, invitee.sorties.invitations, invitee.cloche.nonVues], [1, 1, 1], "invitations en attente (pas les refus)");
egal(await lirePoulsSocial(base, 4, maintenant), invitee, "le chemin de l'API (lirePoulsSocial) rend le même pouls");
egal((await pouls(4, new Date("2026-10-21T00:00:00Z"))).sorties.invitations, 0, "sortie passée");

// « Vu » de la cloche : ne recule jamais, jamais après maintenant ; sans profil, rien n'est écrit
const relations = creerRelationsSociales(base);
const cloche = creerCloche(relations, base);
egal((await cloche.marquerVu(1, new Date("2026-10-14T09:00:00Z"), maintenant)).toISOString(), "2026-10-14T09:00:00.000Z");
egal((await cloche.marquerVu(1, new Date("2026-10-14T08:00:00Z"), maintenant)).toISOString(), "2026-10-14T09:00:00.000Z", "ne recule jamais");
egal((await cloche.marquerVu(1, new Date("2026-10-15T08:00:00Z"), maintenant)).toISOString(), "2026-10-14T10:00:00.000Z", "jamais après maintenant");
egal((await cloche.marquerVu(12, new Date("2026-10-14T09:00:00Z"), maintenant)).toISOString(), "2026-10-14T09:00:00.000Z");
egal(await compter(`SELECT count(*) AS n FROM profils_sociaux WHERE compte_id = $1`, [12]), 0, "sans profil : rien n'est créé");
egal((await pouls(1, maintenant)).cloche.nonVues, 0, "vue jusqu'à maintenant");

// Création du profil : ON CONFLICT DO NOTHING (un identifiant pris : on en tire un autre ; déjà là : on le rend)
let tirages = 0;
// Premier tirage : « aaaaaaaaaa »… sauf qu'on le donne d'abord à quelqu'un d'autre
await q(`INSERT INTO comptes (id, email, mot_de_passe, prenom, cgu_version, pseudo) VALUES (2000, 'c2000@exemple.fr', 'x', 'P', '2026-10-08', 'prise')`);
await q(`INSERT INTO profils_sociaux (compte_id, id_public) VALUES (2000, 'aaaaaaaaaa') ON CONFLICT DO NOTHING`);
const social = creerSocial({ relations, tirer: (max) => (tirages++ < 10 ? 0 : 1) % max, base });
egal(await social.assurerProfil(12), null, "sans pseudo : pas de profil");
const cree = await social.assurerProfil(8);
egal([cree?.cree, cree?.idPublic], [true, "bbbbbbbbbb"], "« aaaaaaaaaa » était pris : nouvel essai");
egal(await social.assurerProfil(8), { compteId: 8, idPublic: "bbbbbbbbbb", cree: false });
egal(await compter(`SELECT count(*) AS n FROM profils_sociaux WHERE compte_id = $1`, [8]), 1);
await terminerEssai(import.meta.url, essai, verifications.nombre);
