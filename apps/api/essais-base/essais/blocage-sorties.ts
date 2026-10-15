// Essai sur base (PGlite, toutes les migrations du dépôt) du blocage par le VRAI client Prisma (services/bande.ts, bloquer
// puis couperEntre, dans sa transaction) : le bloqué sort des sorties où le bloqueur a LA MAIN (trouverOrganisateurEffectif :
// le plus ancien participant quand l'organisateur de la colonne est parti), pas seulement de celles de sa colonne ; ses votes
// et sa place dans la discussion partent avec lui ; son invitation en attente chez le bloqué part aussi (même invitée par un
// autre) ; les sorties et la discussion communes changent de version ; un second blocage ne change plus rien ; débloquer ne
// rend rien. Porté du scratchpad (assembleur, après l'intégration L3-L5). Aucune vraie base.
import "../socle/garde-fou.ts";
import { creerBande } from "../../src/services/bande.ts";
import { creerRelationsSociales } from "../../src/services/relations-sociales.ts";
import { creerBaseEnMemoire } from "../socle/base-en-memoire.ts";
import { creerVerifications, terminerEssai } from "../socle/verifications.ts";

const essai = await creerBaseEnMemoire();
const { base } = essai;
const q = essai.sql;
const verifications = creerVerifications();
const { egal } = verifications;
const ids = async (sql: string, valeurs: unknown[] = []) => (await q(sql, valeurs)).map((l) => Number(Object.values(l)[0]));

// 1 ancien organisateur (parti), 2 nouveau (a la main), 3 lui, 4 autre
for (let i = 1; i <= 4; i++) {
  await q(`INSERT INTO comptes (id, email, mot_de_passe, prenom, cgu_version, pseudo) VALUES ($1, $2, 'x', $3, '2026-10-08', $4)`, [i, `essai${i}@exemple.fr`, `Prenom${i}`, `essai.${i}`]);
  await q(`INSERT INTO profils_sociaux (compte_id, id_public) VALUES ($1, $2)`, [i, `essai${"abcdefghjk"[i]}xyzw`]);
}
await q(`INSERT INTO lieux (id, nom, type, emoji, info, texte, quartier, ville, prix, horaires, plat, statut) VALUES (1, 'Le Bouiboui', 'resto', '🍽️', '', '', '', 'Nantes', '€', '', '', 'publie')`);
// Sortie S (10) : colonne = 1, mais 1 est parti ; 2 est arrivé le premier
await q(`INSERT INTO conversations (id, type) VALUES (10, 'sortie'), (20, 'sortie')`);
await q(`INSERT INTO sorties (id, conversation_id, organisateur_id, titre, emoji, quand, fin_vote) VALUES (10, 10, 1, 'Pizza', '🍕', now() + interval '7 days', now() + interval '6 days')`);
await q(`INSERT INTO invitations_sorties (sortie_id, compte_id, invite_par_id, statut, cree_le) VALUES
  (10, 2, 1, 'accepte', now() - interval '2 days'), (10, 3, 1, 'accepte', now() - interval '1 day'), (10, 4, 1, 'accepte', now() - interval '1 day')`);
await q(`INSERT INTO membres_conversations (conversation_id, compte_id) VALUES (10, 2), (10, 3), (10, 4)`);
await q(`INSERT INTO propositions_sorties (id, sortie_id, lieu_id, propose_par_id) VALUES (1, 10, 1, 2)`);
await q(`INSERT INTO votes_sorties (proposition_id, compte_id) VALUES (1, 3), (1, 4)`);
// Sortie T (20) : 3 a la main ; 2 invité par 4
await q(`INSERT INTO sorties (id, conversation_id, organisateur_id, titre, emoji, quand, fin_vote) VALUES (20, 20, 3, 'Tacos', '🌮', now() + interval '7 days', now() + interval '6 days')`);
await q(`INSERT INTO invitations_sorties (sortie_id, compte_id, invite_par_id, statut, repondu_le) VALUES (20, 3, NULL, 'accepte', now()), (20, 4, 3, 'accepte', now()), (20, 2, 4, 'invite', NULL)`);
await q(`INSERT INTO membres_conversations (conversation_id, compte_id) VALUES (20, 3), (20, 4)`);
// 2 et 3 sont potes, 3 suit 2 : le blocage coupe tout
await q(`INSERT INTO membres_bandes (compte_id, pote_id) VALUES (2, 3), (3, 2)`);
await q(`INSERT INTO suivis_personnes (suiveur_id, suivi_id, statut) VALUES (3, 2, 'accepte')`);

const bande = creerBande({ relations: creerRelationsSociales(base), chiffrement: null, tirer: () => 0, base });
const dans = (sortie: number) => ids(`SELECT compte_id FROM invitations_sorties WHERE sortie_id = $1 ORDER BY compte_id`, [sortie]);
const version = async (table: string, id: number) => Number((await q(`SELECT version FROM ${table} WHERE id = $1`, [id]))[0]!.version);

egal(await bande.bloquer(1, 4, new Date()), { ok: true });
egal(await dans(10), [2, 3, 4], "1 est parti : il ne sort personne");
egal(await version("sorties", 10), 0, "1 n'est plus dans la sortie : rien ne change de version");

egal(await bande.bloquer(2, 3, new Date()), { ok: true });
egal(await dans(10), [2, 4], "2 a la main : 3 sort de la sortie");
egal(await ids(`SELECT compte_id FROM membres_conversations WHERE conversation_id = 10 ORDER BY compte_id`), [2, 4], "et de sa discussion");
egal(await ids(`SELECT compte_id FROM votes_sorties ORDER BY compte_id`), [4], "ses votes partent avec lui");
egal(await dans(20), [3, 4], "l'invitation en attente de 2 chez 3 part, même invitée par 4");
egal(await version("sorties", 10), 1);
egal(await version("sorties", 20), 1);
egal(await version("conversations", 10), 1, "la discussion commune change de version (avant que 3 en sorte)");
egal(await ids(`SELECT bloque_id FROM blocages WHERE bloqueur_id = 2`), [3]);
egal(await ids(`SELECT count(*) FROM membres_bandes WHERE compte_id IN (2, 3)`), [0], "la bande est coupée, dans les deux sens");
egal(await ids(`SELECT count(*) FROM suivis_personnes WHERE suiveur_id = 3`), [0], "le suivi aussi");

// Deux fois : déjà bloqué, rien ne bouge ; débloquer ne rend ni la sortie ni la bande
egal(await bande.bloquer(2, 3, new Date()), { ok: true });
egal([await version("sorties", 10), await version("sorties", 20)], [1, 1], "un second blocage ne change aucune version");
await bande.debloquer(2, 3);
egal([await ids(`SELECT count(*) FROM blocages WHERE bloqueur_id = 2`), await dans(10)], [[0], [2, 4]], "débloqué : 3 n'est pas remis dans la sortie");
await terminerEssai(import.meta.url, essai, verifications.nombre);
