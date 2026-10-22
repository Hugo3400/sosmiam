// Double en mémoire du socle des relations (contrat dans relations-sociales-regles.ts), posé sur les tables partagées.
import { presenterPersonne } from "../fonctions/social/presenter-personne.ts";
import { AUCUN_LIEN, type LienEntre, type RelationsSociales } from "./relations-sociales-regles.ts";
import { bloquesEnMemoire, listerCachesEnMemoire, type TablesSociales } from "./tables-sociales-en-memoire.ts";

export function creerRelationsSocialesEnMemoire(tables: TablesSociales): RelationsSociales {
  /** Le compte d'un profil social, s'il a un pseudo */
  const compteDuProfil = (idPublic: string) => {
    for (const profil of tables.profils.values()) {
      if (profil.idPublic === idPublic) return tables.comptes.get(profil.compteId)?.pseudo ? profil.compteId : null;
    }
    return null;
  };
  const aBloque = (bloqueurId: number, bloqueId: number) => tables.blocages.some((l) => l.bloqueurId === bloqueurId && l.bloqueId === bloqueId);

  const relations: RelationsSociales = {
    async trouverCompte(idPublic, pour) {
      const compteId = compteDuProfil(idPublic);
      if (compteId === null) return null;
      return pour !== undefined && pour !== compteId && aBloque(compteId, pour) ? null : compteId;
    },

    async trouverComptes(idsPublics, pour) {
      const carte = new Map<string, number>();
      for (const idPublic of new Set(idsPublics)) {
        const compteId = await relations.trouverCompte(idPublic, pour);
        if (compteId !== null) carte.set(idPublic, compteId);
      }
      return carte;
    },

    async presenter(compteIds) {
      const carte = new Map<number, ReturnType<typeof presenterPersonne>>();
      for (const id of new Set(compteIds)) {
        const profil = tables.profils.get(id);
        const compte = tables.comptes.get(id);
        if (profil && compte?.pseudo) carte.set(id, presenterPersonne({ idPublic: profil.idPublic, pseudo: compte.pseudo, prenom: compte.prenom, avatar: compte.avatar }));
      }
      return carte;
    },

    async lireLiens(moi, autres) {
      const liens = new Map<number, LienEntre>();
      for (const autre of new Set(autres)) {
        if (autre === moi) continue;
        const monSuivi = tables.suivis.find((s) => s.suiveurId === moi && s.suiviId === autre);
        const sonSuivi = tables.suivis.find((s) => s.suiveurId === autre && s.suiviId === moi);
        const envoyee = tables.demandes.some((d) => d.deId === moi && d.aId === autre);
        const recue = tables.demandes.some((d) => d.deId === autre && d.aId === moi && d.refuseeLe === null);
        liens.set(autre, {
          ...AUCUN_LIEN,
          pote: tables.bande.some((b) => b.compteId === moi && b.poteId === autre),
          bloqueParMoi: aBloque(moi, autre),
          mABloque: aBloque(autre, moi),
          jeSuis: !monSuivi ? "aucun" : monSuivi.statut === "accepte" ? "suivi" : "demande",
          meSuit: sonSuivi?.statut === "accepte",
          meDemande: sonSuivi?.statut === "demande",
          demandeBande: envoyee ? "envoyee" : recue ? "recue" : null,
        });
      }
      return liens;
    },

    async listerPotes(moi) {
      return tables.bande
        .filter((b) => b.compteId === moi)
        .sort((a, b) => b.creeLe.getTime() - a.creeLe.getTime() || b.poteId - a.poteId)
        .map((b) => b.poteId);
    },

    async listerBlocages(moi) {
      const lignes = [...tables.blocages].sort((a, b) => b.creeLe.getTime() - a.creeLe.getTime());
      return {
        parMoi: lignes.filter((l) => l.bloqueurId === moi).map((l) => l.bloqueId),
        contreMoi: lignes.filter((l) => l.bloqueId === moi).map((l) => l.bloqueurId),
        caches: listerCachesEnMemoire(tables, moi),
      };
    },

    async bloqueEntre(a, b) {
      return a !== b && bloquesEnMemoire(tables, a, b);
    },

    async lirePushSocial(compteIds) {
      return new Set(compteIds.filter((id) => tables.profils.get(id)?.pushSocial === true));
    },

    async lireApercuMessages(compteIds) {
      return new Set(compteIds.filter((id) => tables.profils.get(id)?.apercuMessages === true));
    },

    // Rien à verrouiller : une seule demande avance à la fois entre deux await
    async verrouillerComptes() {},

    async lireIdempotence(compteId, cle, ressource) {
      const ligne = tables.idempotence.find((l) => l.compteId === compteId && l.cle === cle);
      return ligne && ligne.ressource === ressource ? ligne.ressourceId : null;
    },

    async noterIdempotence(compteId, cle, ressource, ressourceId, maintenant) {
      if (tables.idempotence.some((l) => l.compteId === compteId && l.cle === cle)) return false;
      tables.idempotence.push({ compteId, cle, ressource, ressourceId, creeLe: maintenant });
      return true;
    },
  };
  return relations;
}
