import "../socle/garde-fou.ts";
import { randomBytes, randomUUID } from "node:crypto";
import { creerChiffrementDonnees } from "../../src/services/chiffrement-donnees.ts";
import { creerChiffrementSocial } from "../../src/services/chiffrement-social.ts";
import { creerCommunaute } from "../../src/services/communaute.ts";
import { changerStatutIdee, choisirIdeeDuMois, listerEtiquettesLibres, listerIdeesGestion, repondreIdee, retirerEtiquetteLibre, retirerSortieMiamis } from "../../src/services/communaute-gestion.ts";
import { appliquerDecisionCommunaute } from "../../src/services/communaute-moderation.ts";
import { creerDepotCommunaute } from "../../src/services/communaute-tables.ts";
import { creerDecisionsModerationApp } from "../../src/services/decisions-moderation-app.ts";
import { faireLeMenageCommunaute } from "../../src/services/menage-communaute.ts";
import { creerRelationsSociales } from "../../src/services/relations-sociales.ts";
import { creerSignalementsSociaux } from "../../src/services/signalements-sociaux.ts";
import { creerStockageMediasChatEnMemoire } from "../../src/services/stockage-medias-chat.ts";
import { creerBaseEnMemoire } from "../socle/base-en-memoire.ts";
import { creerVerifications, terminerEssai } from "../socle/verifications.ts";

const essai = await creerBaseEnMemoire();
const { base } = essai;
const q = essai.sql;
const verifications = creerVerifications();
const { egal, vrai } = verifications;
const nombre = async (sql: string, valeurs: unknown[] = []) => Number(Object.values((await q(sql, valeurs))[0] ?? { n: 0 })[0]);
const reussi = <R extends { ok: boolean }>(r: R, message: string) => {
  vrai(r.ok, `${message} : ${JSON.stringify(r)}`);
  return r as Extract<R, { ok: true }>;
};

const DEBUT = new Date("2026-10-14T10:00:00Z");
const H = 3_600_000;
const JOUR = 24 * H;
const plus = (ms: number) => new Date(DEBUT.getTime() + ms);

for (let i = 1; i <= 8; i++) {
  await q(`INSERT INTO comptes (id, email, mot_de_passe, prenom, cgu_version, pseudo, ville, cree_le) VALUES ($1, $2, 'x', $3, '2026-10-08', $4, 'Nantes', $5)`,
    [i, `miami${i}@exemple.fr`, `Miami${i}`, `miami.${i}`, i <= 2 ? plus(-60 * JOUR) : DEBUT]);
  await q(`INSERT INTO profils_sociaux (compte_id, id_public) VALUES ($1, $2)`, [i, `miami${"abcdefghjk"[i]}xyzw`]);
}
for (let i = 1; i <= 3; i++) {
  await q(`INSERT INTO lieux (id, nom, type, emoji, info, texte, quartier, ville, prix, horaires, plat, statut) VALUES ($1, $2, 'resto', '🍜', '', '', '', 'Nantes', '€', '', '', $3)`,
    [i, `Chez Capitaine Bouiboui n°${i}`, i === 3 ? "brouillon" : "publie"]);
}

const chiffrementDonnees = creerChiffrementDonnees(randomBytes(32));
const relations = creerRelationsSociales(base);
const medias = creerStockageMediasChatEnMemoire({ partLibre: 0.5 });
const communaute = creerCommunaute({ depot: creerDepotCommunaute({ relations, medias, base }), relations, chiffrementDonnees });
const { sorties, genre, quiEstLa, idees, fil } = communaute;

const nouvelle = (enPlus: Record<string, unknown> = {}) => ({
  titre: "Brunch des nouveaux", description: "On papote.", quand: plus(3 * JOUR).toISOString(), lieuId: 1, public: { type: "tous" as const },
  etiquettes: [{ nom: "Végétarien", officielle: true }, { nom: "Fans de ramen", officielle: false }], places: 3, placeGardeePourNouveau: false, recurrente: true, ...enPlus,
});

egal((await sorties.creer(1, nouvelle({ lieuId: 3 }), randomUUID(), DEBUT)), { ok: false, erreur: "lieu-inconnu" });
const cle = randomUUID();
const creee = reussi(await sorties.creer(1, nouvelle(), cle, DEBUT), "création");
egal([creee.cree, creee.sortie.moi.place, creee.sortie.etiquettes.length], [true, "organisateur", 2], "sortie créée");
egal((reussi(await sorties.creer(1, nouvelle(), cle, DEBUT), "rejouée")).sortie.id, creee.sortie.id, "même clé : même sortie");
const id = Number(creee.sortie.id);
const conversationId = Number(creee.sortie.conversationId);
egal(await nombre(`SELECT count(*) FROM membres_conversations WHERE conversation_id = $1`, [conversationId]), 1, "l'organisateur dans la discussion");

for (const compte of [2, 3, 4]) reussi(await sorties.demander(compte, id, DEBUT), `demande ${compte}`);
reussi(await sorties.accepter(1, id, 2, DEBUT), "accepte 2");
reussi(await sorties.accepter(1, id, 3, DEBUT), "accepte 3");
const attente = reussi(await sorties.accepter(1, id, 4, DEBUT), "4 en attente");
egal([attente.sortie.nombreEnAttente, attente.sortie.participants.length], [1, 3], "complet : liste d'attente");
const promu = reussi(await sorties.quitter(2, id, DEBUT), "2 part");
vrai(promu.sortie.moi.place === "aucune");
egal((await sorties.lire(4, id, DEBUT))?.moi.place, "accepte", "le premier en attente entre");
egal(await nombre(`SELECT count(*) FROM membres_conversations WHERE conversation_id = $1`, [conversationId]), 3, "la discussion suit");
egal(await nombre(`SELECT count(*) FROM participations_sorties_des_miamis WHERE sortie_id = $1 AND compte_id = 2`, [id]), 0, "partie tôt : la ligne s'efface");

reussi(await sorties.demander(5, id, DEBUT), "demande 5");
reussi(await sorties.refuser(1, id, 5, DEBUT), "refus");
egal((await sorties.lire(5, id, DEBUT))?.moi.place, "demande", "refus silencieux");

const quand = plus(3 * JOUR);
const pendant = new Date(quand.getTime() + 30 * 60_000);
egal(await sorties.validerPresence(3, id, pendant), { ok: false, erreur: "presence-non-validee" }, "sans visite");
await q(`INSERT INTO visites (compte_id, lieu_id, mode, statut, cree_le, valide_le) VALUES (3, 1, 'comptoir', 'validee', $1, $1)`, [pendant]);
egal(reussi(await sorties.validerPresence(3, id, pendant), "présence").sortie.moi.present, true, "présence validée au QR");

const taches = await sorties.passerTaches(new Date("2026-10-16T16:00:00Z"));
egal(taches.rappels, 1, "rappel la veille à 18 h");
const suite = await sorties.passerTaches(new Date(quand.getTime() + 5 * H));
egal(suite.suites, 1, "la semaine suivante est créée");
const prochaine = Number((await q(`SELECT id FROM sorties_des_miamis WHERE serie_id = $1`, [id]))[0]!.id);
vrai((await sorties.lire(3, prochaine, new Date(quand.getTime() + 5 * H)))?.invitationHabitue, "habitué invité en premier");

egal(reussi(await genre.choisir(6, "femme", DEBUT), "genre").genre.choix, "femme");
egal(await genre.choisir(6, "homme", plus(JOUR)), { ok: false, erreur: "genre-trop-tot", jusqua: new Date("2026-11-14T10:00:00.000Z") });
vrai(!String((await q(`SELECT genre_chiffre FROM profils_communaute WHERE compte_id = 6`))[0]!.genre_chiffre).includes("femme"), "genre chiffré");
const reservee = reussi(await sorties.creer(6, nouvelle({ public: { type: "genre", genre: "femme" }, recurrente: false }), randomUUID(), DEBUT), "réservée");
egal(await sorties.lire(7, Number(reservee.sortie.id), DEBUT), null, "invisible hors de son public");

reussi(await quiEstLa.montrer(7, DEBUT), "7 se montre");
reussi(await quiEstLa.montrer(8, DEBUT), "8 se montre");
egal((await quiEstLa.lire(8, DEBUT)).presents.map((p) => p.personne.pseudo), ["miami.7"]);
egal(reussi(await quiEstLa.faireCoucou(7, 8, DEBUT), "coucou").coucou, "envoye");
egal(reussi(await quiEstLa.faireCoucou(8, 7, DEBUT), "coucou retour").coucou, "reciproque");
egal((await quiEstLa.lire(8, plus(4 * H))).jusqua, null, "présence finie");

const idee = reussi(await idees.proposer(4, { titre: "Un filtre pour les petits budgets", detail: "" }, randomUUID(), DEBUT), "idée");
egal((await idees.proposer(5, { titre: "un filtre pour les petits budgets !", detail: "" }, randomUUID(), DEBUT)), { ok: false, erreur: "idee-proche" });
const ideeId = Number(idee.idee.id);
egal((reussi(await changerStatutIdee(ideeId, "proposee", DEBUT, base), "publiée")).notifications.map((n) => n.type), ["idee-publiee"]);
egal(reussi(await idees.voter(5, ideeId, true, DEBUT), "vote").idee.votes, 1);
const commentaire = reussi(await idees.commenter(5, ideeId, "Oui !", null, DEBUT), "commentaire").commentaire;
egal(reussi(await idees.aimerCommentaire(4, Number(commentaire.id), true, DEBUT), "j'aime").commentaire.jaime, 1);
egal((reussi(await repondreIdee(ideeId, "On adore.", DEBUT, base), "réponse")).notifications.map((n) => n.type), ["reponse-brigade"]);
reussi(await choisirIdeeDuMois(ideeId, "2026-10", DEBUT, base), "idée du mois");
egal((await idees.lister(6)).map((i) => [i.titre, i.ideeDuMois, i.reponseBrigade?.texte]), [["Un filtre pour les petits budgets", "2026-10", "On adore."]]);
egal((await listerIdeesGestion({}, base)).length, 1);
vrai((await fil.lire(6, DEBUT)).some((e) => e.type === "reponse-brigade"), "le fil voit la réponse de la Brigade");

const chiffrement = creerChiffrementSocial(chiffrementDonnees)!;
await q(`UPDATE comptes SET email_verifie_le = $1, cree_le = $1 WHERE id = 6`, [plus(-10 * JOUR)]);
const signalements = creerSignalementsSociaux({ relations, chiffrement, voitLaSortieMiamis: async (c, s, m) => (await sorties.lire(c, s, m)) !== null }, base);
const signale = await signalements.signaler(6, { cible: "comment-idee", cibleId: commentaire.id, raison: "choquant", precision: null, explication: "" }, DEBUT);
egal([signale.ok, signale.ok && signale.masquePourTous], [true, true], "commentaire masqué au premier choquant");
egal((await idees.lire(4, ideeId))?.commentaires.length, 0);
egal((await creerDecisionsModerationApp({ contesterSignalement: async () => true }, base).listerDecisions(5, DEBUT)).map((d) => [d.cible, d.statut]), [["comment-idee", "masque"]]);
await base.$transaction((tx) => appliquerDecisionCommunaute(tx, { cible: "comment-idee", cibleId: commentaire.id }, "rejete", false, DEBUT, medias));
egal((await idees.lire(4, ideeId))?.commentaires.length, 1, "rejeté : remis en ligne");
const surSortie = await signalements.signaler(6, { cible: "miamis", cibleId: String(id), raison: "choquant", precision: null, explication: "" }, DEBUT);
egal([surSortie.ok, surSortie.ok && surSortie.masquePourTous], [true, false], "une sortie visible se signale, sans masquage d'office");
const cachee = await signalements.signaler(7, { cible: "miamis", cibleId: reservee.sortie.id, raison: "danger", precision: null, explication: "" }, DEBUT);
egal(cachee, { ok: false, erreur: "contenu-inconnu" }, "une sortie réservée à un autre public ne se signale pas");

egal((await listerEtiquettesLibres({}, base)).filter((e) => e.sortieId === id).map((e) => e.nom), ["Fans de ramen"]);
reussi(await retirerEtiquetteLibre(id, "Fans de ramen", DEBUT, base), "étiquette retirée");
egal((await sorties.lire(1, id, DEBUT))?.etiquettes.map((e) => e.nom), ["Végétarien"]);
const retiree = reussi(await retirerSortieMiamis(prochaine, DEBUT, medias, base), "sortie retirée");
vrai(retiree.notifications.every((n) => n.type === "sortie-miamis-annulee"));
egal(await sorties.lire(1, prochaine, DEBUT), null, "retirée : plus visible");

reussi(await sorties.annuler(6, Number(reservee.sortie.id), DEBUT), "annulée");
egal(await nombre(`SELECT count(*) FROM conversations WHERE id = $1`, [Number(reservee.sortie.conversationId)]), 0, "discussion effacée");

const menage = await faireLeMenageCommunaute({ chiffrement: chiffrementDonnees, maintenant: plus(400 * JOUR) }, base);
vrai(menage.sorties >= 2 && menage.presences === 2, `ménage : ${JSON.stringify(menage)}`);
await q(`DELETE FROM comptes WHERE id = 4`);
egal(await nombre(`SELECT count(*) FROM idees_communaute WHERE auteur_id IS NULL`), 1, "l'idée reste sans auteur");
await terminerEssai(import.meta.url, essai, verifications.nombre);
