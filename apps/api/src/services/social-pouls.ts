// Le pouls de la partie sociale (GET /app/social/pouls, spécification sociale C.2) : de petits compteurs et des signatures,
// relus toutes les 30 s par l'app ouverte, qui lui disent quoi relire. UNE seule requête (environ 300 octets en réponse),
// chaque compteur sur un index. Blocages dans les deux sens : les messages et la cloche d'une personne avec qui il y a un
// blocage ne comptent pas. Sans profil social (Potes jamais ouvert) : tout à zéro, signatures vides, sauf la signature de la
// cloche (les décisions de la modération y arrivent aussi) ; son compteur « nonVues » vaut 0, car le « vu jusqu'à » est gardé
// dans le profil social, que rien ne crée ici : l'app garde alors ce « vu » sur le téléphone et allume la pastille d'après
// GET /app/cloche (choix provisoire, à confirmer par Hugo). Le pouls ne crée jamais le profil. Une signature ne se compare
// que par l'égalité : elle change quand il faut relire.
import { Prisma } from "../base-de-donnees/client-genere/client.ts";
import type { PoulsSocial } from "../../../../packages/commun/src/types/social.ts";
import type { AppCliente } from "./messagerie-regles.ts";
import { MAX_COMPTEUR_POULS } from "./social-regles.ts";

/** Une ligne de la requête du pouls (les dates sont celles de PostgreSQL, null quand il n'y a rien) */
export type LignePouls = {
  aProfil: boolean;
  messagesNonLus: number;
  sortiesNonLus: number;
  conversations: number;
  conversationsLe: Date | string | null;
  discussionsSortiesLe: Date | string | null;
  invitationsGroupes: number;
  invitationsGroupesLe: Date | string | null;
  sorties: number;
  invitationsSorties: number;
  sortiesLe: Date | string | null;
  clocheNonVues: number;
  clocheMaxId: number | null;
  clocheNombre: number;
  clocheLe: Date | string | null;
  demandesBande: number;
  demandesBandeLe: Date | string | null;
  demandesSuivis: number;
  demandesSuivisLe: Date | string | null;
  potes: number;
  potesLe: Date | string | null;
};

/**
 * La requête du pouls. Non-lus d'une conversation : les messages d'un autre que moi, plus récents que luJusqua et
 * visibleApres, ni supprimés, ni masqués ou retirés par la modération, ni d'une personne avec qui il y a un blocage ; 99 au
 * plus par conversation. Privés et groupes dans « messages », discussions des sorties dans « sorties ».
 */
export function construireRequetePouls(compteId: number, maintenant: Date, ancienneApp = false): Prisma.Sql {
  return Prisma.sql`
    WITH caches AS (
      SELECT bloque_id AS id FROM blocages WHERE bloqueur_id = ${compteId}
      UNION SELECT bloqueur_id FROM blocages WHERE bloque_id = ${compteId}
    ),
    profil AS (SELECT cloche_vue_le FROM profils_sociaux WHERE compte_id = ${compteId}),
    conv AS (
      SELECT c.id, c.type, c.modifie_le, GREATEST(mc.lu_jusqua, mc.visible_apres) AS depuis
      FROM membres_conversations mc JOIN conversations c ON c.id = mc.conversation_id
      WHERE mc.compte_id = ${compteId}
    ),
    non_lus AS (
      SELECT conv.type, (
        SELECT COUNT(*) FROM (
          SELECT 1 FROM messages_conversations m
          WHERE m.conversation_id = conv.id AND m.id > conv.depuis
            AND m.auteur_id IS DISTINCT FROM ${compteId}
            AND m.supprime_le IS NULL AND m.suspendu_le IS NULL AND m.retire_le IS NULL
            AND (m.auteur_id IS NULL OR m.auteur_id NOT IN (SELECT id FROM caches))${ancienneApp ? Prisma.sql` AND m.systeme IS NULL` : Prisma.empty}
          LIMIT ${MAX_COMPTEUR_POULS}
        ) AS visibles
      ) AS n
      FROM conv
    ),
    cloche AS (
      SELECT
        COUNT(*) FILTER (WHERE (SELECT cloche_vue_le FROM profil) IS NULL OR n.cree_le > (SELECT cloche_vue_le FROM profil)) AS non_vues,
        MAX(n.id) AS max_id, COUNT(*) AS nombre, MAX(n.cree_le) AS max_le
      FROM notifications_cloche n
      WHERE n.compte_id = ${compteId} AND (n.acteur_id IS NULL OR n.acteur_id NOT IN (SELECT id FROM caches))${
        ancienneApp ? Prisma.sql` AND NOT (n.type = 'mention' AND COALESCE(n.cible, '') = 'conversation')` : Prisma.empty}
    )
    SELECT
      EXISTS (SELECT 1 FROM profil) AS "aProfil",
      (SELECT COALESCE(SUM(n), 0) FROM non_lus WHERE type <> 'sortie')::int AS "messagesNonLus",
      (SELECT COALESCE(SUM(n), 0) FROM non_lus WHERE type = 'sortie')::int AS "sortiesNonLus",
      (SELECT COUNT(*) FROM conv WHERE type <> 'sortie')::int AS "conversations",
      (SELECT MAX(modifie_le) FROM conv WHERE type <> 'sortie') AS "conversationsLe",
      (SELECT MAX(modifie_le) FROM conv WHERE type = 'sortie') AS "discussionsSortiesLe",
      (SELECT COUNT(*) FROM invitations_groupes WHERE compte_id = ${compteId} AND statut = 'invite')::int AS "invitationsGroupes",
      (SELECT MAX(cree_le) FROM invitations_groupes WHERE compte_id = ${compteId} AND statut = 'invite') AS "invitationsGroupesLe",
      (SELECT COUNT(*) FROM invitations_sorties WHERE compte_id = ${compteId} AND statut = 'accepte')::int AS "sorties",
      (SELECT COUNT(*) FROM invitations_sorties i JOIN sorties s ON s.id = i.sortie_id
        WHERE i.compte_id = ${compteId} AND i.statut = 'invite' AND s.quand > ${maintenant}::timestamptz)::int AS "invitationsSorties",
      (SELECT MAX(s.modifie_le) FROM invitations_sorties i JOIN sorties s ON s.id = i.sortie_id
        WHERE i.compte_id = ${compteId} AND i.statut IN ('invite', 'accepte')) AS "sortiesLe",
      (SELECT LEAST(non_vues, ${MAX_COMPTEUR_POULS}) FROM cloche)::int AS "clocheNonVues",
      (SELECT max_id FROM cloche) AS "clocheMaxId",
      (SELECT nombre FROM cloche)::int AS "clocheNombre",
      (SELECT max_le FROM cloche) AS "clocheLe",
      (SELECT COUNT(*) FROM demandes_bandes WHERE a_id = ${compteId} AND refusee_le IS NULL)::int AS "demandesBande",
      (SELECT MAX(cree_le) FROM demandes_bandes WHERE a_id = ${compteId} AND refusee_le IS NULL) AS "demandesBandeLe",
      (SELECT COUNT(*) FROM suivis_personnes WHERE suivi_id = ${compteId} AND statut = 'demande')::int AS "demandesSuivis",
      (SELECT MAX(cree_le) FROM suivis_personnes WHERE suivi_id = ${compteId} AND statut = 'demande') AS "demandesSuivisLe",
      (SELECT COUNT(*) FROM membres_bandes WHERE compte_id = ${compteId})::int AS "potes",
      (SELECT MAX(cree_le) FROM membres_bandes WHERE compte_id = ${compteId}) AS "potesLe"`;
}

/** Une date de la base en texte ISO, ou "" quand il n'y en a pas */
const enTexte = (date: Date | string | null | undefined) => (date ? new Date(date).toISOString() : "");
/** La plus tardive de deux dates, ou null */
const plusTard = (a: Date | string | null, b: Date | string | null) => {
  if (!a || !b) return a ?? b;
  return new Date(a).getTime() >= new Date(b).getTime() ? a : b;
};

/** Le pouls tel que l'API le rend, à partir de la ligne de la requête (le double en mémoire calcule la même ligne) */
export function presenterPouls(l: LignePouls): PoulsSocial {
  const cloche = { nonVues: l.clocheNonVues, signature: `${l.clocheMaxId ?? 0}:${l.clocheNombre}:${enTexte(l.clocheLe)}` };
  if (!l.aProfil) {
    return {
      messages: { nonLus: 0, invitations: 0, signature: "" },
      sorties: { invitations: 0, nonLus: 0, signature: "" },
      // Rien ne garde son « vu » sur le serveur : un compteur qui ne retomberait jamais à 0 ; la signature dit quand relire
      cloche: { nonVues: 0, signature: cloche.signature },
      demandes: { bande: 0, suivis: 0, signature: "" },
      bande: { signature: "" },
    };
  }
  return {
    messages: {
      nonLus: l.messagesNonLus,
      invitations: l.invitationsGroupes,
      signature: `${l.conversations}:${enTexte(l.conversationsLe)}:${l.invitationsGroupes}:${enTexte(l.invitationsGroupesLe)}`,
    },
    sorties: {
      invitations: l.invitationsSorties,
      nonLus: l.sortiesNonLus,
      signature: `${l.sorties}:${l.invitationsSorties}:${enTexte(l.sortiesLe)}:${enTexte(l.discussionsSortiesLe)}`,
    },
    cloche,
    demandes: {
      bande: l.demandesBande,
      suivis: l.demandesSuivis,
      signature: `${l.demandesBande}:${l.demandesSuivis}:${enTexte(plusTard(l.demandesBandeLe, l.demandesSuivisLe))}`,
    },
    bande: { signature: `${l.potes}:${enTexte(l.potesLe)}` },
  };
}

/** Le pouls d'un compte, dans la base (`base` : baseDeDonnees, passée par social.ts) */
export async function lirePoulsSocial(
  base: { $queryRaw: <T>(requete: Prisma.Sql) => Promise<T> }, compteId: number, maintenant: Date, app: AppCliente = {},
): Promise<PoulsSocial> {
  const [ligne] = await base.$queryRaw<LignePouls[]>(construireRequetePouls(compteId, maintenant, app.ancienneApp === true));
  if (!ligne) throw new Error("Pouls illisible");
  return presenterPouls(ligne);
}
