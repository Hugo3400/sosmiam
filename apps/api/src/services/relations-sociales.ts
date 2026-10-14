// Le socle des relations entre personnes, dans la base (contrat dans relations-sociales-regles.ts). Les comptes sont
// toujours désignés par leur identifiant public de l'extérieur ; l'id d'un compte ne sort jamais d'ici.
import { Prisma } from "../base-de-donnees/client-genere/client.ts";
import { baseDeDonnees } from "../base-de-donnees/connexion.ts";
import { presenterPersonne } from "../fonctions/social/presenter-personne.ts";
import { AUCUN_LIEN, type LienEntre, type RelationsSociales } from "./relations-sociales-regles.ts";

const uniques = (ids: readonly number[]) => [...new Set(ids)].filter((id) => Number.isSafeInteger(id) && id > 0);

export function creerRelationsSociales(base = baseDeDonnees): RelationsSociales {
  /** Les comptes de `candidats` qui ont bloqué `pour` */
  async function lireBloqueurs(candidats: readonly number[], pour: number): Promise<Set<number>> {
    if (candidats.length === 0) return new Set();
    const lignes = await base.blocage.findMany({ where: { bloqueId: pour, bloqueurId: { in: [...candidats] } }, select: { bloqueurId: true } });
    return new Set(lignes.map((l) => l.bloqueurId));
  }

  const relations: RelationsSociales = {
    async trouverCompte(idPublic, pour) {
      const trouves = await relations.trouverComptes([idPublic], pour);
      return trouves.get(idPublic) ?? null;
    },

    async trouverComptes(idsPublics, pour) {
      const ids = [...new Set(idsPublics)].slice(0, 200);
      if (ids.length === 0) return new Map();
      const profils = await base.profilSocial.findMany({
        where: { idPublic: { in: ids }, compte: { pseudo: { not: null } } },
        select: { idPublic: true, compteId: true },
      });
      const bloqueurs = pour === undefined ? new Set<number>() : await lireBloqueurs(profils.map((p) => p.compteId).filter((id) => id !== pour), pour);
      return new Map(profils.filter((p) => !bloqueurs.has(p.compteId)).map((p) => [p.idPublic, p.compteId]));
    },

    async presenter(compteIds) {
      const ids = uniques(compteIds);
      if (ids.length === 0) return new Map();
      const profils = await base.profilSocial.findMany({
        where: { compteId: { in: ids } },
        select: { compteId: true, idPublic: true, compte: { select: { pseudo: true, prenom: true, avatar: true } } },
      });
      const carte = new Map<number, ReturnType<typeof presenterPersonne>>();
      for (const p of profils) {
        if (p.compte.pseudo) carte.set(p.compteId, presenterPersonne({ idPublic: p.idPublic, pseudo: p.compte.pseudo, prenom: p.compte.prenom, avatar: p.compte.avatar }));
      }
      return carte;
    },

    async lireLiens(moi, autres) {
      const ids = uniques(autres).filter((id) => id !== moi);
      const liens = new Map<number, LienEntre>(ids.map((id) => [id, { ...AUCUN_LIEN }]));
      if (ids.length === 0) return liens;
      const [bande, blocages, suivis, demandes] = await Promise.all([
        base.membreBande.findMany({ where: { compteId: moi, poteId: { in: ids } }, select: { poteId: true } }),
        base.blocage.findMany({
          where: { OR: [{ bloqueurId: moi, bloqueId: { in: ids } }, { bloqueId: moi, bloqueurId: { in: ids } }] },
          select: { bloqueurId: true, bloqueId: true },
        }),
        base.suiviPersonne.findMany({
          where: { OR: [{ suiveurId: moi, suiviId: { in: ids } }, { suiviId: moi, suiveurId: { in: ids } }] },
          select: { suiveurId: true, suiviId: true, statut: true },
        }),
        base.demandeBande.findMany({
          where: { OR: [{ deId: moi, aId: { in: ids } }, { aId: moi, deId: { in: ids } }] },
          select: { deId: true, aId: true, refuseeLe: true },
        }),
      ]);
      for (const { poteId } of bande) liens.get(poteId)!.pote = true;
      for (const b of blocages) {
        if (b.bloqueurId === moi) liens.get(b.bloqueId)!.bloqueParMoi = true;
        else liens.get(b.bloqueurId)!.mABloque = true;
      }
      for (const s of suivis) {
        if (s.suiveurId === moi) liens.get(s.suiviId)!.jeSuis = s.statut === "accepte" ? "suivi" : "demande";
        else if (s.statut === "accepte") liens.get(s.suiveurId)!.meSuit = true;
        else if (s.statut === "demande") liens.get(s.suiveurId)!.meDemande = true;
      }
      // Ma demande (même refusée en silence) passe avant la sienne, quel que soit l'ordre des lignes : la même règle que le
      // double en mémoire
      const envoyees = new Set(demandes.filter((d) => d.deId === moi).map((d) => d.aId));
      const recues = new Set(demandes.filter((d) => d.aId === moi && d.refuseeLe === null).map((d) => d.deId));
      for (const [autre, lien] of liens) lien.demandeBande = envoyees.has(autre) ? "envoyee" : recues.has(autre) ? "recue" : null;
      return liens;
    },

    async listerPotes(moi) {
      const lignes = await base.membreBande.findMany({ where: { compteId: moi }, select: { poteId: true }, orderBy: [{ creeLe: "desc" }, { poteId: "desc" }] });
      return lignes.map((l) => l.poteId);
    },

    async listerBlocages(moi) {
      const lignes = await base.blocage.findMany({
        where: { OR: [{ bloqueurId: moi }, { bloqueId: moi }] },
        select: { bloqueurId: true, bloqueId: true },
        orderBy: { creeLe: "desc" },
      });
      const parMoi = lignes.filter((l) => l.bloqueurId === moi).map((l) => l.bloqueId);
      const contreMoi = lignes.filter((l) => l.bloqueId === moi).map((l) => l.bloqueurId);
      return { parMoi, contreMoi, caches: new Set([...parMoi, ...contreMoi]) };
    },

    async bloqueEntre(a, b, tx) {
      if (a === b) return false;
      const nombre = await (tx ?? base).blocage.count({ where: { OR: [{ bloqueurId: a, bloqueId: b }, { bloqueurId: b, bloqueId: a }] } });
      return nombre > 0;
    },

    async lirePushSocial(compteIds) {
      const ids = uniques(compteIds);
      if (ids.length === 0) return new Set();
      const lignes = await base.profilSocial.findMany({ where: { compteId: { in: ids }, pushSocial: true }, select: { compteId: true } });
      return new Set(lignes.map((l) => l.compteId));
    },

    async verrouillerComptes(tx, compteIds) {
      const ids = uniques(compteIds).sort((a, b) => a - b);
      if (ids.length === 0) return;
      // Toujours dans l'ordre des id : deux gestes croisés (a avec b, b avec a) ne s'attendent jamais l'un l'autre
      await tx.$queryRaw`SELECT id FROM comptes WHERE id IN (${Prisma.join(ids)}) ORDER BY id FOR UPDATE`;
    },

    async lireIdempotence(compteId, cle, ressource, tx) {
      const ligne = await (tx ?? base).cleIdempotence.findUnique({
        where: { compteId_cle: { compteId, cle } },
        select: { ressource: true, ressourceId: true },
      });
      // Une clé déjà prise pour autre chose (un groupe, puis une liste) ne rend rien : voir noterIdempotence
      return ligne && ligne.ressource === ressource ? ligne.ressourceId : null;
    },

    async noterIdempotence(compteId, cle, ressource, ressourceId, maintenant, tx) {
      const { count } = await (tx ?? base).cleIdempotence.createMany({
        data: [{ compteId, cle, ressource, ressourceId, creeLe: maintenant }],
        skipDuplicates: true,
      });
      return count === 1;
    },
  };
  return relations;
}
