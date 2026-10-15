// Essai sur base (PGlite, toutes les migrations du dépôt) du ménage social de la nuit (lot L7, spécification E.1) : chaque
// requête SQL des étapes 1 à 8, les verrous (un message, un membre ou un signalement arrivés pendant l'effacement ; sorties
// puis conversations), un paquet qui échoue (noté, le suivant passe), la garde des fichiers signalés (décision de Hugo du
// 15/10/2026 : ouvert, ou jugé depuis moins de 183 jours, même retenu ; étapes 1, 2, 3, 7, 8 et 9), et le rechiffrement de
// l'étape 9 (changement de clé : l'ancien fichier gardé jusqu'à l'étape 8 de la nuit suivante, la course avec un signalement
// qui garde l'ancien nom, le disque presque plein et sa ligne au journal du logiciel, la règle de fin : restants =
// illisibles deux nuits de suite). Le VRAI client Prisma passe par l'adaptateur pg, branché sur PGlite (socle/). Aucune
// vraie base ; les fichiers sont dans le stockage EN MÉMOIRE.
import "../socle/garde-fou.ts";
import { randomBytes, randomUUID } from "node:crypto";
import { calculerSeuilsMenageSocial } from "../../src/fonctions/social/calculer-seuils-menage-social.ts";
import { decrireBilanMenageSocial } from "../../src/fonctions/social/decrire-bilan-menage-social.ts";
import { creerChiffrementDonnees } from "../../src/services/chiffrement-donnees.ts";
import { creerChiffrementSocial } from "../../src/services/chiffrement-social.ts";
import { faireLeMenageSocial } from "../../src/services/menage-social.ts";
import * as etapes from "../../src/services/menage-social-etapes.ts";
import { creerStockageMediasChatEnMemoire } from "../../src/services/stockage-medias-chat.ts";
import { creerBaseEnMemoire } from "../socle/base-en-memoire.ts";
import { creerVerifications, terminerEssai } from "../socle/verifications.ts";

const essai = await creerBaseEnMemoire();
const { base } = essai;
const verifications = creerVerifications();
const { egal } = verifications;
const q = essai.sql;
const ids = async (sql: string, p: unknown[] = []) => (await q(sql, p)).map((l) => Number(Object.values(l)[0]));

const T = new Date("2027-03-01T03:30:00Z");
const JOUR = 86_400_000;
const il = (jours: number) => new Date(T.getTime() - jours * JOUR).toISOString();
const medias = creerStockageMediasChatEnMemoire({ horloge: () => T.getTime() });
/** Un fichier de média « écrit » il y a `jours` jours */
const fichier = async (jours = 100) => {
  const nom = medias.tirerNom();
  await medias.ecrire(nom, Buffer.from("chiffre"));
  medias.fichiers.get(nom)!.modifieLe = new Date(il(jours));
  return nom;
};

for (let id = 1; id <= 6; id++) {
  await q(`INSERT INTO comptes (id, email, mot_de_passe, prenom, cgu_version, pseudo) VALUES ($1, $2, 'x', $3, '2026-10-08', $4)`, [id, `c${id}@exemple.fr`, `P${id}`, `pseudo.${id}`]);
  await q(`INSERT INTO profils_sociaux (compte_id, id_public) VALUES ($1, $2)`, [id, `idpublic${"abcdef"[id - 1]}k`]);
}
const conv = async (id: number, type: string, joursDernier: number) => q(`INSERT INTO conversations (id, type, dernier_message_le) VALUES ($1, $2, $3)`, [id, type, il(joursDernier)]);
const membre = async (c: number, compte: number) => q(`INSERT INTO membres_conversations (conversation_id, compte_id) VALUES ($1, $2)`, [c, compte]);
const msg = async (id: number, c: number, o: { type?: string; fichier?: string | null; expire?: number; retire?: number; texte?: string | null } = {}) =>
  q(`INSERT INTO messages_conversations (id, conversation_id, auteur_id, type, id_client, texte_chiffre, fichier, type_mime, taille, media_expire_le, retire_le)
     VALUES ($1, $2, 1, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [id, c, o.type ?? (o.fichier ? "photo" : "texte"), randomUUID(), o.texte === undefined ? (o.fichier ? null : "v1:x:y:z") : o.texte, o.fichier ?? null,
      o.fichier ? "image/jpeg" : null, o.fichier ? 1000 : null, o.expire === undefined ? null : il(o.expire), o.retire === undefined ? null : il(o.retire)]);
/** Un signalement : « ouvert » (a-traiter), « conteste » (retenu, contesté, pas réexaminé), « juge » (rejeté) ; jugé il y a
 *  `o.juge` jours (30 par défaut), contesté il y a `o.conteste` jours, réexaminé il y a `o.reexamine` jours */
const sig = async (id: number, cible: string, cibleId: number, etat: "ouvert" | "conteste" | "juge", fichierMedia: string | null = null,
  o: { statut?: "retenu" | "rejete"; juge?: number; conteste?: number; reexamine?: number } = {}) =>
  q(`INSERT INTO signalements (id, cible, cible_id, raison, source, statut, traite_le, conteste_le, reexamine_le, fichier_media) VALUES ($1, $2, $3, 'haine', 'app', $4, $5, $6, $7, $8)`,
    [id, cible, String(cibleId), etat === "ouvert" ? "a-traiter" : o.statut ?? (etat === "conteste" ? "retenu" : "rejete"), etat === "ouvert" ? null : il(o.juge ?? 30),
      etat === "conteste" ? il(o.conteste ?? 2) : o.conteste === undefined ? null : il(o.conteste), o.reexamine === undefined ? null : il(o.reexamine), fichierMedia]);
/** Les cas de la décision du 15/10/2026, pour un fichier cité par un signalement de message (`cibleId`) */
const retenuIlYa10 = (id: number, cibleId: number, f: string) => sig(id, "message", cibleId, "juge", f, { statut: "retenu", juge: 10 });
const jugeIlYa200 = (id: number, cibleId: number, f: string) => sig(id, "message", cibleId, "juge", f, { statut: "retenu", juge: 200 });
const contestePasReexamine = (id: number, cibleId: number, f: string) => sig(id, "message", cibleId, "conteste", f, { juge: 200, conteste: 20 });
const reexamineIlYa10 = (id: number, cibleId: number, f: string) => sig(id, "message", cibleId, "juge", f, { statut: "retenu", juge: 300, conteste: 100, reexamine: 10 });
const seuils = calculerSeuilsMenageSocial(T);

// ---------- Étape 1 : médias de plus de 90 jours, signalés ou non (le fichier d'un signalement qui le garde reste sur le disque)
await conv(1, "groupe", 10);
await membre(1, 1);
const [f1, f2, f3, f4, f5] = [await fichier(), await fichier(), await fichier(), await fichier(), await fichier()];
const [fRetenu, fJuge200, fReexamine] = [await fichier(), await fichier(), await fichier()];
await msg(101, 1, { fichier: f1, expire: 1 });
await msg(102, 1, { fichier: f2, expire: 1 });
await msg(103, 1, { fichier: f3, expire: 1 });
await msg(104, 1, { fichier: f4, expire: 1 });
await msg(105, 1, { fichier: f5, expire: -5 });
await msg(106, 1, { fichier: fRetenu, expire: 1 });
await msg(107, 1, { fichier: fJuge200, expire: 1 });
await msg(108, 1, { fichier: fReexamine, expire: 1 });
await sig(1, "message", 102, "ouvert", f2);
await sig(2, "message", 103, "conteste", f3);
await sig(3, "message", 104, "juge");
await retenuIlYa10(101, 106, fRetenu);
await jugeIlYa200(102, 107, fJuge200);
await reexamineIlYa10(103, 108, fReexamine);
egal(await etapes.effacerMediasExpires(base, seuils, medias), 7, "tous les médias expirés quittent la conversation, signalés compris");
egal(await ids(`SELECT id FROM messages_conversations WHERE conversation_id = 1 AND fichier IS NULL ORDER BY id`), [101, 102, 103, 104, 106, 107, 108]);
egal([f1, f2, f3, f4, f5, fRetenu, fJuge200, fReexamine].map((f) => medias.fichiers.has(f)), [false, true, true, false, true, true, false, true],
  "fichier gardé : ouvert, contesté pas réexaminé, retenu il y a 10 jours, réexaminé il y a 10 jours, pas encore expiré ; parti : sans signalement, signalement sans copie (104), jugé il y a 200 jours");
egal((await q(`SELECT type_mime, taille, media_expire_le IS NOT NULL AS e FROM messages_conversations WHERE id = 101`))[0], { type_mime: "image/jpeg", taille: "1000", e: "t" },
  "« Ce média a expiré » : type, taille et date restent");

// ---------- Étape 2 : conversations d'un an sans message
await conv(2, "groupe", 400); await membre(2, 1); await msg(201, 2); await sig(4, "message", 201, "juge");
const f6 = await fichier();
await msg(202, 2, { fichier: f6, expire: -10 });
const [f6Retenu, f6Juge200, f6Conteste] = [await fichier(), await fichier(), await fichier()];
await msg(203, 2, { fichier: f6Retenu, expire: -10 }); await retenuIlYa10(104, 203, f6Retenu);
await msg(204, 2, { fichier: f6Juge200, expire: -10 }); await jugeIlYa200(105, 204, f6Juge200);
await msg(205, 2, { fichier: f6Conteste, expire: -10 }); await reexamineIlYa10(106, 205, f6Conteste);
await conv(3, "groupe", 400); await membre(3, 1); await msg(301, 3); await sig(5, "message", 301, "ouvert");
await conv(4, "groupe", 100); await membre(4, 1);
await conv(5, "sortie", 400); await membre(5, 1);
await q(`INSERT INTO sorties (id, conversation_id, organisateur_id, titre, emoji, quand, fin_vote) VALUES (50, 5, 1, 'Resto', '🍝', $1, $1)`, [il(200)]);
await conv(6, "sortie", 400); await membre(6, 1);
await q(`INSERT INTO sorties (id, conversation_id, organisateur_id, titre, emoji, quand, fin_vote) VALUES (60, 6, 1, 'Bar', '🍻', $1, $1)`, [il(380)]);
await q(`INSERT INTO invitations_sorties (sortie_id, compte_id, statut) VALUES (60, 2, 'accepte')`);
await conv(7, "groupe", 400); await membre(7, 1); await msg(701, 7); await sig(6, "message", 701, "conteste");
const r2 = await etapes.effacerConversationsAnciennes(base, seuils, medias);
egal(r2, { conversations: 2, sorties: 1 }, "2 (groupe ancien) et 6 (sortie passée depuis 380 jours)");
egal(await ids(`SELECT id FROM conversations WHERE id BETWEEN 2 AND 7 ORDER BY id`), [3, 4, 5, 7],
  "3 et 7 : un message attend la modération (ouvert, contesté) ; 4 : récente ; 5 : sortie d'il y a 200 jours");
egal(await ids(`SELECT id FROM messages_conversations WHERE conversation_id IN (2, 6)`), [], "messages effacés en cascade");
egal(await ids(`SELECT id FROM sorties ORDER BY id`), [50], "la sortie part avec sa discussion");
egal(await ids(`SELECT sortie_id FROM invitations_sorties`), [], "et ses invitations");
egal(await ids(`SELECT id FROM signalements WHERE id = 4`), [4], "le signalement (et son instantané) reste : la preuve ne disparaît pas");
egal(medias.fichiers.has(f6), false, "le média de la conversation effacée part du disque après la transaction");
egal([f6Retenu, f6Juge200, f6Conteste].map((f) => medias.fichiers.has(f)), [true, false, true],
  "sauf celui d'un signalement retenu il y a 10 jours ou réexaminé il y a 10 jours ; jugé il y a 200 jours : parti");
// La nuit qui suit la décision, la conversation 3 part
await q(`UPDATE signalements SET statut = 'rejete', traite_le = $1 WHERE id = 5`, [il(0)]);
egal(await etapes.effacerConversationsAnciennes(base, seuils, medias), { conversations: 1, sorties: 0 });

// Verrou : un message (ou un signalement) arrive entre la lecture des candidates et le verrou. La base espion lance
// l'arrivée juste avant la transaction du ménage (PGlite n'a qu'une connexion : c'est l'ordre « validé avant le verrou »)
const espion = (avant: () => Promise<unknown>) => {
  let fait = false;
  return new Proxy(base, {
  get(cible, nom) {
    const valeur = Reflect.get(cible, nom, cible);
    if (nom === "$transaction") {
      return async (...args: unknown[]) => {
        if (!fait) {
          fait = true;
          await avant();
        }
        return (valeur as (...a: unknown[]) => unknown).apply(cible, args);
      };
    }
    return typeof valeur === "function" ? valeur.bind(cible) : valeur;
  },
  });
};
await conv(8, "groupe", 400); await membre(8, 1);
await conv(9, "groupe", 400); await membre(9, 1); await msg(901, 9);
const arrivee = espion(async () => {
  // Comme la messagerie : verrou de la conversation, message, dernier_message_le avancé (messagerie-tables.ts)
  await q(`INSERT INTO messages_conversations (id, conversation_id, auteur_id, type, id_client, texte_chiffre) VALUES (801, 8, 1, 'texte', $1, 'v1:a:b:c')`, [randomUUID()]);
  await q(`UPDATE conversations SET dernier_message_le = $1, version = version + 1 WHERE id = 8`, [T.toISOString()]);
  await sig(7, "message", 901, "ouvert");
});
egal(await etapes.effacerConversationsAnciennes(arrivee, seuils, medias), { conversations: 0, sorties: 0 },
  "relue après le verrou : la 8 a un message neuf, la 9 un signalement ouvert");
egal(await ids(`SELECT id FROM conversations WHERE id IN (8, 9) ORDER BY id`), [8, 9]);
egal(await ids(`SELECT id FROM messages_conversations WHERE id = 801`), [801], "le message arrivé reste");

// ---------- Étape 3 : conversations vides, même clause et même verrou
await conv(10, "groupe", 5);
await q(`INSERT INTO invitations_groupes (conversation_id, compte_id, statut) VALUES (10, 2, 'invite')`);
const f10 = await fichier();
await msg(1001, 10, { fichier: f10, expire: -10 }); await reexamineIlYa10(107, 1001, f10);
await conv(11, "groupe", 5); await msg(1101, 11); await sig(8, "message", 1101, "ouvert");
await conv(12, "prive", 5); await membre(12, 1); await membre(12, 2);
await conv(13, "groupe", 5);
const entree = espion(async () => membre(13, 3));
egal(await etapes.effacerConversationsVides(entree, seuils, medias), 1, "la 10 (vide, son invitation part avec elle)");
egal(await ids(`SELECT id FROM conversations WHERE id BETWEEN 10 AND 13 ORDER BY id`), [11, 12, 13],
  "11 : message au signalement ouvert ; 12 : deux membres ; 13 : un membre est entré pendant l'effacement");
egal(await ids(`SELECT conversation_id FROM invitations_groupes`), []);
egal(medias.fichiers.has(f10), true, "conversation vide effacée : le fichier d'un signalement réexaminé il y a 10 jours reste");

// ---------- Étape 4 : demandes, refus et invitations
await q(`INSERT INTO demandes_bandes (de_id, a_id, cree_le, refusee_le) VALUES (1, 2, $1, NULL), (1, 3, $1, $2), (1, 4, $2, NULL)`, [il(31), il(29)]);
await q(`INSERT INTO suivis_personnes (suiveur_id, suivi_id, statut, cree_le) VALUES (1, 2, 'demande', $1), (1, 3, 'refuse', $1), (1, 4, 'accepte', $2), (1, 5, 'demande', $3)`, [il(31), il(400), il(10)]);
await q(`INSERT INTO listes_lieux (id, auteur_id, titre, emoji) VALUES (1, 1, 'Ma liste', '📋')`);
await q(`INSERT INTO co_auteurs_listes (liste_id, compte_id, statut, cree_le) VALUES (1, 2, 'invite', $1), (1, 3, 'refuse', $1), (1, 4, 'accepte', $2), (1, 5, 'invite', $3)`, [il(31), il(400), il(10)]);
await conv(14, "groupe", 5); await membre(14, 1);
await q(`INSERT INTO invitations_groupes (conversation_id, compte_id, statut, cree_le) VALUES (14, 2, 'invite', $1), (14, 3, 'refuse', $1), (14, 4, 'invite', $2)`, [il(31), il(10)]);
await conv(15, "sortie", 5); await membre(15, 1);
await q(`INSERT INTO sorties (id, conversation_id, organisateur_id, titre, emoji, quand, fin_vote) VALUES (150, 15, 1, 'Passée', '🍕', $1, $1)`, [il(2)]);
await conv(16, "sortie", 5); await membre(16, 1);
await q(`INSERT INTO sorties (id, conversation_id, organisateur_id, titre, emoji, quand, fin_vote) VALUES (160, 16, 1, 'À venir', '🍣', $1, $1)`, [il(-3)]);
await q(`INSERT INTO invitations_sorties (sortie_id, compte_id, statut) VALUES (150, 1, 'accepte'), (150, 2, 'invite'), (150, 3, 'refuse'), (160, 2, 'invite'), (160, 3, 'refuse')`);
await q(`INSERT INTO departs_groupes (conversation_id, compte_id, parti_le) VALUES (14, 2, $1), (14, 3, $2)`, [il(31), il(10)]);
await q(`INSERT INTO cles_idempotence (compte_id, cle, ressource, ressource_id, cree_le) VALUES (1, 'a', 'groupe', 14, $1), (1, 'b', 'groupe', 14, $2)`, [il(1.05), il(0.04)]);
egal(await etapes.effacerDemandesExpirees(base, seuils), {
  demandesBande: 2, demandesSuivi: 2, invitationsSorties: 2, invitationsGroupes: 2, invitationsCoAuteurs: 2, departsGroupes: 1, clesIdempotence: 1,
});
egal(await ids(`SELECT a_id FROM demandes_bandes`), [4], "29 jours : gardée");
egal(await ids(`SELECT suivi_id FROM suivis_personnes ORDER BY suivi_id`), [4, 5], "suivi accepté gardé, demande récente gardée");
egal(await ids(`SELECT compte_id FROM co_auteurs_listes ORDER BY compte_id`), [4, 5]);
egal(await ids(`SELECT compte_id FROM invitations_groupes`), [4], "invitation au groupe de 10 jours gardée");
egal((await q(`SELECT sortie_id, compte_id FROM invitations_sorties ORDER BY sortie_id, compte_id`)).map((l) => `${l.sortie_id}:${l.compte_id}`), ["150:1", "160:2", "160:3"],
  "sortie passée : le participant reste ; sortie à venir : tout reste");
egal(await ids(`SELECT compte_id FROM departs_groupes`), [3]);
egal((await q(`SELECT cle FROM cles_idempotence`)).map((l) => l.cle), ["b"]);

// ---------- Étape 5 : cloche (90 jours, 200 par compte ; la modération 6 mois, hors limite)
await q(`INSERT INTO notifications_cloche (compte_id, type, cree_le) VALUES (1, 'mention', $1), (1, 'mention', $2), (1, 'contenu-retire', $3), (1, 'signalement-decide', $4)`, [il(91), il(89), il(100), il(190)]);
await q(`INSERT INTO notifications_cloche (compte_id, type, cree_le) SELECT 3, 'nouvel-abonne', $1::timestamptz + (g || ' seconds')::interval FROM generate_series(1, 205) g`, [il(5)]);
await q(`INSERT INTO notifications_cloche (compte_id, type, cree_le) SELECT 3, 'contenu-masque', $1 FROM generate_series(1, 10)`, [il(5)]);
const premiere = Number((await q(`SELECT min(id) AS m FROM notifications_cloche WHERE compte_id = 3`))[0].m);
egal(await etapes.effacerClocheAncienne(base, seuils), 2 + 5);
egal((await q(`SELECT type FROM notifications_cloche WHERE compte_id = 1 ORDER BY id`)).map((l) => l.type), ["mention", "contenu-retire"], "89 jours et la modération de 100 jours gardées");
egal(Number((await q(`SELECT count(*) AS n FROM notifications_cloche WHERE compte_id = 3 AND type = 'nouvel-abonne'`))[0].n), 200, "les 200 plus récentes");
egal(Number((await q(`SELECT min(id) AS m FROM notifications_cloche WHERE compte_id = 3 AND type = 'nouvel-abonne'`))[0].m), premiere + 5, "les 5 plus anciennes parties");
egal(Number((await q(`SELECT count(*) AS n FROM notifications_cloche WHERE compte_id = 3 AND type = 'contenu-masque'`))[0].n), 10, "la modération reste hors de la limite");

// ---------- Étape 6 : éléments masqués de plus de 13 mois
await q(`INSERT INTO elements_masques (compte_id, cible, cible_id, cree_le) VALUES (1, 'sortie', '1', $1), (1, 'sortie', '2', $2)`, [il(400), il(300)]);
egal(await etapes.effacerMasquesAnciens(base, seuils), 1);
egal((await q(`SELECT cible_id FROM elements_masques`)).map((l) => l.cible_id), ["2"]);

// ---------- Étape 7 : contenus retirés depuis plus d'un an, commentaires supprimés
const f7 = await fichier();
await msg(1401, 14, { retire: 400, texte: "v1:a:b:c" });
await msg(1402, 14, { retire: 400, texte: "v1:a:b:c" }); await sig(9, "message", 1402, "conteste");
await msg(1403, 14, { retire: 100, texte: "v1:a:b:c" });
await msg(1404, 14, { retire: 400, fichier: f7, expire: -1 });
const [f7Reexamine, f7Juge200] = [await fichier(), await fichier()];
await msg(1405, 14, { retire: 400, fichier: f7Reexamine, expire: -1 }); await reexamineIlYa10(108, 1405, f7Reexamine);
await msg(1406, 14, { retire: 400, fichier: f7Juge200, expire: -1 }); await sig(109, "message", 1406, "juge", f7Juge200, { statut: "retenu", juge: 400 });
await base.lieu.create({ data: {
  id: 7, nom: "Chez Léa", type: "resto", emoji: "🍝", info: "i", texte: "t", quartier: "q", ville: "Nantes", prix: "€", couleurs: [], horaires: "h", plat: "p", tags: [], envies: [], statut: "publie",
} as never });
await base.publication.create({ data: { id: 1, lieuId: 7, auteurType: "createur", auteurPseudo: "lea.mange", legende: "Pâtes", statut: "publiee" } as never });
const com = async (id: number, o: { retire?: number; supprime?: number; reponseA?: number } = {}) =>
  q(`INSERT INTO commentaires_publications (id, publication_id, auteur_id, texte, mentions, reponse_a_id, retire_le, supprime_le) VALUES ($1, 1, 2, 'Texte', '[{"p":"x","id":"y"}]', $2, $3, $4)`,
    [id, o.reponseA ?? null, o.retire === undefined ? null : il(o.retire), o.supprime === undefined ? null : il(o.supprime)]);
await com(1, { retire: 400 });
await com(2, { retire: 400 }); await com(3, { reponseA: 2 });
await com(4, { retire: 400 }); await sig(10, "commentaire", 4, "ouvert");
await com(5, { retire: 100 });
await com(6, { supprime: 1 });
await com(7, { supprime: 1 }); await com(8, { reponseA: 7 });
await com(9, { supprime: 1 }); await sig(11, "commentaire", 9, "conteste");
await q(`INSERT INTO listes_lieux (id, auteur_id, titre, emoji, retiree_le) VALUES (2, 1, 'Retirée', '❌', $1), (3, 1, 'Contestée', '❌', $1), (4, 1, 'Récente', '❌', $2)`, [il(400), il(100)]);
await sig(12, "liste", 3, "conteste");
await q(`INSERT INTO lieux_listes (liste_id, lieu_id) VALUES (2, 7)`);
egal(await etapes.effacerContenusRetires(base, seuils, medias, T), { contenusRetires: 4 + 1 + 1 + 1, commentairesSupprimes: 1 },
  "messages 1401, 1404, 1405 et 1406, commentaire 1 effacé, commentaire 2 vidé, liste 2 ; supprimé 6 effacé");
egal((await q(`SELECT id, texte_chiffre IS NULL AS vide, fichier IS NULL AS sans FROM messages_conversations WHERE id BETWEEN 1401 AND 1406 ORDER BY id`)).map((l) => `${l.id}:${l.vide}${l.sans}`),
  ["1401:tt", "1402:ft", "1403:ft", "1404:tt", "1405:tt", "1406:tt"], "1402 (décision contestée) et 1403 (100 jours) gardés");
egal([f7, f7Reexamine, f7Juge200].map((f) => medias.fichiers.has(f)), [false, true, false],
  "le fichier d'un message retiré part, sauf si un signalement le garde (réexaminé il y a 10 jours) ; jugé il y a 400 jours : parti");
egal(await ids(`SELECT id FROM commentaires_publications ORDER BY id`), [2, 3, 4, 5, 7, 8, 9]);
egal((await q(`SELECT texte, mentions::text AS m, supprime_le IS NOT NULL AS s FROM commentaires_publications WHERE id = 2`))[0], { texte: "", m: "[]", s: "t" },
  "retiré avec une réponse : « Commentaire supprimé »");
egal((await q(`SELECT texte FROM commentaires_publications WHERE id = 4`))[0].texte, "Texte", "signalement ouvert : gardé tel quel");
egal(await ids(`SELECT id FROM listes_lieux ORDER BY id`), [1, 3, 4]);
egal(await ids(`SELECT liste_id FROM lieux_listes`), [], "les lieux de la liste partent avec elle");
// La réponse 8 part : la nuit suivante, le 7 « supprimé » n'a plus de réponse
await q(`DELETE FROM commentaires_publications WHERE id = 8`);
egal((await etapes.effacerContenusRetires(base, seuils, medias, T)).commentairesSupprimes, 1);
egal(await ids(`SELECT id FROM commentaires_publications ORDER BY id`), [2, 3, 4, 5, 9]);

// ---------- Étape 8 : fichiers orphelins
const orphelinVieux = await fichier(2);
const orphelinJeune = await fichier(0.5);
const gardeOuvert = await fichier(2);
await sig(13, "message", 99999, "ouvert", gardeOuvert);
const gardeRetenu = await fichier(2);
await retenuIlYa10(14, 99998, gardeRetenu);
const [jugeVieux, gardeConteste, gardeReexamine] = [await fichier(2), await fichier(2), await fichier(2)];
await jugeIlYa200(15, 99997, jugeVieux);
await contestePasReexamine(16, 99996, gardeConteste);
await reexamineIlYa10(17, 99995, gardeReexamine);
const avantOrphelins = [...medias.fichiers.keys()].length;
egal(await etapes.effacerFichiersOrphelins(base, seuils, medias), 2, "l'orphelin de 2 jours et celui d'un signalement jugé il y a 200 jours");
egal([orphelinVieux, orphelinJeune, gardeOuvert, gardeRetenu, jugeVieux, gardeConteste, gardeReexamine].map((f) => medias.fichiers.has(f)),
  [false, true, true, true, false, true, true],
  "24 h de grâce ; le fichier_media d'un signalement ouvert, retenu il y a 10 jours, contesté pas réexaminé, réexaminé il y a 10 jours est gardé");
egal(medias.fichiers.size, avantOrphelins - 2, "les fichiers des messages et ceux que gardent les signalements restent");
egal([f2, f3, f5, fRetenu, fReexamine, f6Retenu, f6Conteste, f10, f7Reexamine].every((f) => medias.fichiers.has(f)), true,
  "f5 (son message) ; les autres, que plus aucun message ne cite, par leur signalement");

// ---------- faireLeMenageSocial tout entier, puis rien la nuit suivante
await conv(17, "groupe", 400); await membre(17, 2);
await q(`INSERT INTO demandes_bandes (de_id, a_id, cree_le) VALUES (5, 6, $1)`, [il(40)]);
const bilan = await faireLeMenageSocial({ medias, chiffrement: creerChiffrementDonnees(randomBytes(32)), maintenant: T, base });
egal([bilan.conversations, bilan.demandesBande, bilan.rechiffrement, bilan.etapesRatees], [1, 1, null, []], "sans ancienne clé : pas de rechiffrement");
egal(decrireBilanMenageSocial(bilan), [[1, "Conversations effacées (1 an sans message)"], [1, "Demandes de bande expirées (30 jours)"]]);
const encore = await faireLeMenageSocial({ medias, chiffrement: null, maintenant: T, base });
egal(decrireBilanMenageSocial(encore), [], "la nuit suivante : plus rien");

// ---------- Étape 9 : rechiffrement pendant un changement de clé
// Les faux chiffrés des étapes d'avant (« v1:x:y:z », fichiers « chiffre ») seraient des illisibles : on part propre
await q(`UPDATE messages_conversations SET texte_chiffre = NULL, fichier = NULL`);
await q(`UPDATE signalements SET fichier_media = NULL`);
medias.fichiers.clear();
const cle1 = randomBytes(32);
const cle2 = randomBytes(32);
const v1 = creerChiffrementDonnees(cle1);
const s1 = creerChiffrementSocial(v1)!;
const v2 = creerChiffrementDonnees(cle2, { version: 2, anciennes: [{ version: 1, cle: cle1 }] });
const s2 = creerChiffrementSocial(v2)!;
await q(`UPDATE profils_sociaux SET code_invitation_chiffre = $1 WHERE compte_id = 2`, [s1.chiffrerCode("CODESECRET23", 2)]);
await q(`UPDATE profils_sociaux SET code_invitation_chiffre = $1 WHERE compte_id = 3`, [s2.chiffrerCode("CODENEUF2345", 3)]);
await conv(20, "groupe", 1); await membre(20, 1);
await q(`UPDATE conversations SET titre_chiffre = $1 WHERE id = 20`, [s1.chiffrerTitre("Les Miamis", 20)]);
const idTexte = randomUUID();
const idLieu = randomUUID();
const idCasse = randomUUID();
await q(`INSERT INTO messages_conversations (id, conversation_id, auteur_id, type, id_client, texte_chiffre) VALUES (2001, 20, 1, 'texte', $1, $2), (2002, 20, 1, 'lieu', $3, $4), (2003, 20, 1, 'texte', $5, $6)`,
  [idTexte, s1.chiffrerMessage("Coucou la Brigade", 20, idTexte), idLieu, s1.chiffrerMessage(JSON.stringify({ l: 7, m: "Trop bon" }), 20, idLieu), idCasse, "v1:abc:def:ghi"]);
await q(`UPDATE signalements SET instantane_chiffre = $1 WHERE id = 1`, [s1.chiffrerInstantane(JSON.stringify({ type: "photo" }), 1)]);
// Un média ancien rattaché à un message ET à son signalement ouvert, un autre au seul message ; tous deux « vieux »
const ecrireAncien = async (clair: string, jours: number) => {
  const nom = medias.tirerNom();
  await medias.ecrire(nom, s1.chiffrerOctets(Buffer.from(clair), nom));
  medias.fichiers.get(nom)!.modifieLe = new Date(il(jours));
  return nom;
};
const photo = await ecrireAncien("photo-claire", 10);
const vocal = await ecrireAncien("vocal-clair", 9);
await q(`UPDATE messages_conversations SET fichier = $1, media_expire_le = $2 WHERE id = 102`, [photo, il(-30)]);
await q(`UPDATE signalements SET fichier_media = $1 WHERE id = 1`, [photo]);
await q(`UPDATE messages_conversations SET fichier = $1 WHERE id = 105`, [vocal]);
// La copie d'un signalement retenu il y a 10 jours (signalement 14), que plus aucun message ne cite
const preuve = await ecrireAncien("preuve-claire", 11);
await q(`UPDATE signalements SET fichier_media = $1 WHERE id = 14`, [preuve]);
const rotation = await faireLeMenageSocial({ medias, chiffrement: v2, maintenant: T, base });
egal(rotation.rechiffrement, { rechiffres: 1 + 1 + 2 + 1 + 3, illisibles: 1, restants: 1, enAttenteDePlace: 0 }, "code, titre, 2 messages, instantané, 3 fichiers ; le message cassé reste");
const lire = async (sql: string) => (await q(sql))[0]!;
egal(s2.dechiffrerCode(String((await lire(`SELECT code_invitation_chiffre AS c FROM profils_sociaux WHERE compte_id = 2`)).c), 2), "CODESECRET23");
egal(String((await lire(`SELECT code_invitation_chiffre AS c FROM profils_sociaux WHERE compte_id = 2`)).c).startsWith("v2:"), true);
egal(s2.dechiffrerTitre(String((await lire(`SELECT titre_chiffre AS c FROM conversations WHERE id = 20`)).c), 20), "Les Miamis");
egal(s2.dechiffrerMessage(String((await lire(`SELECT texte_chiffre AS c FROM messages_conversations WHERE id = 2001`)).c), 20, idTexte), "Coucou la Brigade");
egal(JSON.parse(s2.dechiffrerMessage(String((await lire(`SELECT texte_chiffre AS c FROM messages_conversations WHERE id = 2002`)).c), 20, idLieu)), { l: 7, m: "Trop bon" });
egal(String((await lire(`SELECT texte_chiffre AS c FROM messages_conversations WHERE id = 2003`)).c), "v1:abc:def:ghi", "illisible : laissé tel quel");
egal(JSON.parse(s2.dechiffrerInstantane(String((await lire(`SELECT instantane_chiffre AS c FROM signalements WHERE id = 1`)).c), 1)), { type: "photo" });
const [nouvellePhoto, nouveauSig] = [String((await lire(`SELECT fichier AS f FROM messages_conversations WHERE id = 102`)).f), String((await lire(`SELECT fichier_media AS f FROM signalements WHERE id = 1`)).f)];
egal([nouvellePhoto === photo, nouvellePhoto === nouveauSig, medias.fichiers.has(photo), medias.fichiers.has(vocal)], [false, true, true, true],
  "nouveau nom, en base des deux côtés ; les anciens fichiers restent jusqu'à l'étape 8 de la nuit suivante");
egal(s2.dechiffrerOctets((await medias.lire(nouvellePhoto))!, nouvellePhoto).toString(), "photo-claire");
egal(s2.estAncienOctets((await medias.lire(nouvellePhoto))!), false);
const nouvellePreuve = String((await lire(`SELECT fichier_media AS f FROM signalements WHERE id = 14`)).f);
egal([nouvellePreuve === preuve, s2.dechiffrerOctets((await medias.lire(nouvellePreuve))!, nouvellePreuve).toString()], [false, "preuve-claire"],
  "le signalement retenu suit le nouveau nom : la preuve reste lisible avec la nouvelle clé seule");
egal(decrireBilanMenageSocial(rotation).at(-1), [8, "Rechiffrement social : 1 illisible(s), 1 restant(s)"]);
// La nuit suivante : plus rien à réécrire, restants = illisibles une 2e nuit de suite (règle de fin), puis le message cassé effacé
const nuit2 = await faireLeMenageSocial({ medias, chiffrement: v2, maintenant: T, base });
egal(nuit2.rechiffrement, { rechiffres: 0, illisibles: 1, restants: 1, enAttenteDePlace: 0 });
egal([nuit2.fichiersOrphelins, medias.fichiers.has(photo), medias.fichiers.has(vocal), medias.fichiers.has(preuve), medias.fichiers.has(nouvellePhoto), medias.fichiers.has(nouvellePreuve)],
  [3, false, false, false, true, true], "la nuit suivante, l'étape 8 retire les trois anciens fichiers (plus cités) ; les rechiffrés restent");
await q(`UPDATE messages_conversations SET texte_chiffre = NULL WHERE id = 2003`);
egal((await faireLeMenageSocial({ medias, chiffrement: v2, maintenant: T, base })).rechiffrement, { rechiffres: 0, illisibles: 0, restants: 0, enAttenteDePlace: 0 });

// Plafond des fichiers : 1 par nuit ; les 2 autres anciens comptés par dichotomie
const anciens = [await ecrireAncien("a", 8), await ecrireAncien("b", 7), await ecrireAncien("c", 6)];
for (const [i, nom] of anciens.entries()) {
  await q(`INSERT INTO messages_conversations (id, conversation_id, auteur_id, type, id_client, fichier, type_mime, taille, media_expire_le) VALUES ($1, 20, 1, 'photo', $2, $3, 'image/jpeg', 1, $4)`,
    [2101 + i, randomUUID(), nom, il(-60)]);
}
// Disque presque plein (16 % libre, sous 15 % + 2 points) : aucun fichier réécrit cette nuit, les 3 anciens comptés
medias.reglerPartLibre(0.16);
const consoleDisque = console.error;
console.error = () => undefined;
const plein = await faireLeMenageSocial({ medias, chiffrement: v2, maintenant: T, base }).finally(() => (console.error = consoleDisque));
medias.reglerPartLibre(1);
egal([plein.rechiffrement, anciens.every((f) => medias.fichiers.has(f)), plein.etapesRatees], [{ rechiffres: 0, illisibles: 0, restants: 3, enAttenteDePlace: 3 }, true, []],
  "rien n'est écrit, tout est compté, et ce n'est pas une étape ratée");
egal(decrireBilanMenageSocial(plein), [[0, "Rechiffrement social : 0 illisible(s), 3 restant(s)"], [3, "Fichiers à rechiffrer en pause : disque presque plein"]],
  "le journal du logiciel dit pourquoi les restants ne baissent pas (60 caractères au plus par ligne)");
const plafond = await faireLeMenageSocial({ medias, chiffrement: v2, maintenant: T, base, rechiffrement: { fichiersParNuit: 1 } });
egal(plafond.rechiffrement, { rechiffres: 1, illisibles: 0, restants: 2, enAttenteDePlace: 0 }, "le plafond de la nuit n'est pas une pause du disque");
egal(decrireBilanMenageSocial(plafond), [[1, "Rechiffrement social : 0 illisible(s), 2 restant(s)"]]);
egal(medias.fichiers.has(anciens[0]!), true, "rechiffré cette nuit : l'ancien reste, sans être compté dans les restants");
const fin = await faireLeMenageSocial({ medias, chiffrement: v2, maintenant: T, base });
egal([fin.fichiersOrphelins, fin.rechiffrement], [1, { rechiffres: 2, illisibles: 0, restants: 0, enAttenteDePlace: 0 }], "l'ancien de la nuit d'avant part (étape 8), puis les 2 derniers");
egal((await q(`SELECT fichier FROM messages_conversations WHERE id IN (2101, 2102, 2103) ORDER BY id`)).every((l) => s2.estAncienOctets(medias.fichiers.get(String(l.fichier))!.octets) === false), true);
// La course : un signalement (ouvert) avait lu le message 2102 AVANT la transaction du rechiffrement, et l'écrit APRÈS, avec
// l'ancien nom. Ce fichier-là reste (étape 8, signalement ouvert), puis la nuit suivante le reprend et le signalement suit.
await q(`UPDATE signalements SET fichier_media = $1 WHERE id = 13`, [anciens[1]]);
const course = await faireLeMenageSocial({ medias, chiffrement: v2, maintenant: T, base });
egal([course.fichiersOrphelins, medias.fichiers.has(anciens[1]!), medias.fichiers.has(anciens[2]!)], [1, true, false],
  "l'ancien cité par un signalement ouvert est gardé ; l'autre part");
egal(course.rechiffrement, { rechiffres: 1, illisibles: 0, restants: 0, enAttenteDePlace: 0 }, "restants = illisibles, mais la nuit suivante doit le redire (règle de fin)");
const pourLeSignalement = String((await lire(`SELECT fichier_media AS f FROM signalements WHERE id = 13`)).f);
egal([pourLeSignalement === anciens[1], s2.dechiffrerOctets((await medias.lire(pourLeSignalement))!, pourLeSignalement).toString()], [false, "b"],
  "le signalement cite le rechiffré, lisible avec la nouvelle clé seule");
const apresCourse = await faireLeMenageSocial({ medias, chiffrement: v2, maintenant: T, base });
egal([apresCourse.fichiersOrphelins, medias.fichiers.has(anciens[1]!), apresCourse.rechiffrement], [1, false, { rechiffres: 0, illisibles: 0, restants: 0, enAttenteDePlace: 0 }],
  "deux nuits de suite à restants = illisibles, sans étape ratée : l'ancienne clé peut partir");

// ---------- Un paquet qui échoue (étape 2) : noté, le paquet suivant passe, le bilan garde ce qui est fait
await q(`INSERT INTO conversations (id, type, dernier_message_le) SELECT g, 'groupe', $1 FROM generate_series(30001, 30501) g`, [il(400)]);
await q(`INSERT INTO membres_conversations (conversation_id, compte_id) SELECT g, 1 FROM generate_series(30001, 30501) g`);
let transactionsEssayees = 0;
const premiereEnEchec = new Proxy(base, {
  get(cible, nom) {
    const valeur = Reflect.get(cible, nom, cible);
    if (nom === "$transaction") {
      return async (...args: unknown[]) => {
        if (++transactionsEssayees === 1) throw Object.assign(new Error("interblocage 'Coucou la Brigade'"), { name: "ErreurDeBase", code: "40P01" });
        return (valeur as (...a: unknown[]) => unknown).apply(cible, args);
      };
    }
    return typeof valeur === "function" ? valeur.bind(cible) : valeur;
  },
});
const journal: string[] = [];
const consoleAvant = console.error;
console.error = (...m: unknown[]) => void journal.push(m.map(String).join(" "));
const enEchec = await faireLeMenageSocial({ medias, chiffrement: null, maintenant: T, base: premiereEnEchec }).finally(() => (console.error = consoleAvant));
egal([enEchec.conversations, enEchec.etapesRatees], [1, ["conversations"]], "le premier paquet (500) a échoué, le second (1) est fait et compté");
egal(journal.length === 1 && journal[0]!.includes("ErreurDeBase 40P01") && !journal[0]!.includes("Coucou"), true, "le nom et le code, jamais le message");
egal(Number((await q(`SELECT count(*) AS n FROM conversations WHERE id BETWEEN 30001 AND 30501`))[0]!.n), 500);
egal((await faireLeMenageSocial({ medias, chiffrement: null, maintenant: T, base })).conversations, 500, "la nuit suivante, le paquet raté passe");

await terminerEssai(import.meta.url, essai, verifications.nombre);
