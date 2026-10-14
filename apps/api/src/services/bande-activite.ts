// « Quoi de neuf » et le classement du mois de la bande, dans la base (contrat dans bande-regles.ts ; appelé par bande.ts).
// Une seule requête pour chacun. Seulement les potes qui partagent leur activité (« Montrer mon activité à ma bande »), et
// jamais une personne avec qui il y a un blocage, dans un sens ou dans l'autre. Le mois est celui de Paris
// (calculerDebutMoisParis de commun) : points nets du journal (gagnés moins retirés), puis rescousses du mois.
import { calculerDebutMoisParis } from "../../../../packages/commun/src/fonctions/temps/calculer-debut-mois-paris.ts";
import type { ActiviteBandeApi, ClassementApi } from "../../../../packages/commun/src/types/bande.ts";
import { Prisma } from "../base-de-donnees/client-genere/client.ts";
import { construireClassement, debutActivite, MAX_ACTIVITES, presenterActivites, type LigneActivite } from "./bande-regles.ts";
import type { RelationsSociales } from "./relations-sociales-regles.ts";

type BaseBrute = { $queryRaw: <T>(requete: Prisma.Sql) => Promise<T> };

/** Mes potes qui partagent leur activité, avec un pseudo, sans blocage entre nous (dans un sens ou dans l'autre) */
const potesQuiPartagent = (compteId: number) => Prisma.sql`
  SELECT b.pote_id AS id, p.id_public, b.cree_le
  FROM membres_bandes b
  JOIN profils_sociaux p ON p.compte_id = b.pote_id
  JOIN comptes c ON c.id = b.pote_id
  WHERE b.compte_id = ${compteId} AND p.activite_partagee AND c.pseudo IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM blocages x
      WHERE (x.bloqueur_id = ${compteId} AND x.bloque_id = b.pote_id) OR (x.bloqueur_id = b.pote_id AND x.bloque_id = ${compteId})
    )`;

/**
 * « Quoi de neuf » (B.2) : rescousses et lieux gardés (lieux encore publiés), badges et nouvelles listes (ni suspendues, ni
 * retirées, ni signalées par moi) des potes qui partagent leur activité, depuis `depuis`, sans les lignes que j'ai retirées
 * de ma vue (masque « activite », par l'identifiant de la ligne). Les identifiants des lignes ne portent jamais l'id d'un
 * compte : l'identifiant public pour un lieu gardé.
 */
export function construireRequeteActivite(compteId: number, depuis: Date): Prisma.Sql {
  return Prisma.sql`
    WITH potes AS (${potesQuiPartagent(compteId)}),
    lignes AS (
      SELECT 'rescousse'::text AS type, r.compte_id AS "compteId", 'rescousse:' || r.id AS id, r.lieu_id AS "lieuId",
        NULL::text AS detail, NULL::int AS "listeId", r.cree_le AS date
      FROM rescousses r JOIN potes ON potes.id = r.compte_id JOIN lieux l ON l.id = r.lieu_id
      WHERE r.cree_le >= ${depuis}::timestamptz AND l.statut = 'publie'
      UNION ALL
      SELECT 'garde', g.compte_id, 'garde:' || potes.id_public || ':' || g.lieu_id, g.lieu_id, NULL, NULL, g.cree_le
      FROM lieux_gardes g JOIN potes ON potes.id = g.compte_id JOIN lieux l ON l.id = g.lieu_id
      WHERE g.cree_le >= ${depuis}::timestamptz AND l.statut = 'publie'
      UNION ALL
      SELECT 'badge', bc.compte_id, 'badge:' || bc.id, NULL, bc.badge, NULL, bc.obtenu_le
      FROM badges_comptes bc JOIN potes ON potes.id = bc.compte_id
      WHERE bc.obtenu_le >= ${depuis}::timestamptz
      UNION ALL
      SELECT 'liste', li.auteur_id, 'liste:' || li.id, NULL, li.titre, li.id, li.cree_le
      FROM listes_lieux li JOIN potes ON potes.id = li.auteur_id
      WHERE li.cree_le >= ${depuis}::timestamptz AND li.suspendue_le IS NULL AND li.retiree_le IS NULL
        AND NOT EXISTS (
          SELECT 1 FROM signalements s WHERE s.signale_par_id = ${compteId} AND s.cible = 'liste' AND s.cible_id = li.id::text
        )
    )
    SELECT type, "compteId", id, "lieuId", detail, "listeId", date FROM lignes
    WHERE NOT EXISTS (
      SELECT 1 FROM elements_masques m WHERE m.compte_id = ${compteId} AND m.cible = 'activite' AND m.cible_id = lignes.id
    )
    ORDER BY date DESC, id DESC
    LIMIT ${MAX_ACTIVITES}`;
}

/**
 * Le classement du mois (B.2) : moi d'abord, puis mes potes qui partagent leur activité (du plus récent au plus ancien, pour
 * départager une égalité parfaite) ; points nets du journal depuis `debutMois`, et rescousses du mois.
 */
export function construireRequeteClassement(compteId: number, debutMois: Date): Prisma.Sql {
  return Prisma.sql`
    WITH membres AS (
      SELECT ${compteId}::int AS id, 0 AS ordre, NULL::timestamptz AS depuis
      UNION ALL
      SELECT potes.id, 1, potes.cree_le FROM (${potesQuiPartagent(compteId)}) AS potes
    )
    SELECT m.id AS "compteId",
      COALESCE((SELECT SUM(j.points) FROM journal_points j WHERE j.compte_id = m.id AND j.cree_le >= ${debutMois}::timestamptz), 0)::int AS "pointsDuMois",
      (SELECT COUNT(*) FROM rescousses r WHERE r.compte_id = m.id AND r.cree_le >= ${debutMois}::timestamptz)::int AS "rescoussesDuMois"
    FROM membres m
    ORDER BY m.ordre, m.depuis DESC NULLS FIRST, m.id DESC`;
}

export async function lireActiviteBande(base: BaseBrute, relations: RelationsSociales, compteId: number, maintenant: Date): Promise<ActiviteBandeApi[]> {
  const lignes = await base.$queryRaw<LigneActivite[]>(construireRequeteActivite(compteId, debutActivite(maintenant)));
  const personnes = await relations.presenter(lignes.map((l) => l.compteId));
  return presenterActivites(lignes.map((l) => ({ ...l, date: new Date(l.date) })), personnes);
}

export async function lireClassementBande(base: BaseBrute, relations: RelationsSociales, compteId: number, maintenant: Date): Promise<ClassementApi> {
  const debutMois = new Date(calculerDebutMoisParis(maintenant.getTime()));
  const totaux = await base.$queryRaw<{ compteId: number; pointsDuMois: number; rescoussesDuMois: number }[]>(construireRequeteClassement(compteId, debutMois));
  const personnes = await relations.presenter(totaux.map((t) => t.compteId));
  return construireClassement(totaux, personnes, compteId, maintenant);
}
