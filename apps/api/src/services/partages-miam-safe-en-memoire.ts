// « Prévenir un pote » en mémoire, pour les tests (mêmes règles que partages-miam-safe.ts, sans base ni chiffrement).
import { DUREE_PARTAGE_MS, estPartageActif, type LignePartage, type ServicesPartagesMiamSafe } from "./partages-miam-safe-regles.ts";

/** `lireLieu` : le nom d'un lieu publié (null sinon), lu dans les lieux en mémoire du banc d'essai */
export function creerPartagesMiamSafeEnMemoire(lireLieu: (lieuId: number) => string | null) {
  const lignes: LignePartage[] = [];
  let prochain = 0;
  /** Comme la base : un partage fini n'a plus de position */
  const effacerPositionsFinies = (maintenant: Date) => {
    for (const l of lignes) if (!estPartageActif(l, maintenant)) l.position = null;
  };
  const copier = (l: LignePartage): LignePartage => ({ ...l, lieu: l.lieu && { ...l.lieu }, position: l.position && { ...l.position } });

  const services: ServicesPartagesMiamSafe = {
    async creer({ compteId, poteId, lieuId, avecPosition, position }, maintenant) {
      const nom = lireLieu(lieuId);
      if (nom === null) return { ok: false, erreur: "lieu-inconnu" };
      for (const l of lignes) {
        if (l.compteId === compteId && l.poteId === poteId && estPartageActif(l, maintenant)) l.arreteLe = maintenant;
      }
      effacerPositionsFinies(maintenant);
      const ligne: LignePartage = {
        id: ++prochain, compteId, poteId, lieu: { id: lieuId, nom }, avecPosition,
        position: avecPosition && position ? { ...position, le: maintenant } : null,
        creeLe: maintenant, expireLe: new Date(maintenant.getTime() + DUREE_PARTAGE_MS), arreteLe: null,
      };
      lignes.push(ligne);
      return { ok: true, partage: copier(ligne) };
    },
    async envoyerPosition(id, compteId, position, maintenant) {
      const l = lignes.find((x) => x.id === id && x.compteId === compteId);
      if (!l) return "inconnu";
      if (!l.avecPosition) return "sans-position";
      if (!estPartageActif(l, maintenant)) {
        l.position = null;
        return "termine";
      }
      l.position = { ...position, le: maintenant };
      return "ok";
    },
    async arreter(id, compteId, maintenant) {
      const l = lignes.find((x) => x.id === id && x.compteId === compteId);
      if (!l) return false;
      if (l.arreteLe === null) l.arreteLe = maintenant;
      l.position = null;
      return true;
    },
    async lire(id, maintenant) {
      effacerPositionsFinies(maintenant);
      const l = lignes.find((x) => x.id === id);
      return l ? copier(l) : null;
    },
    async listerActifs(compteId, maintenant) {
      effacerPositionsFinies(maintenant);
      return lignes
        .filter((l) => (l.compteId === compteId || l.poteId === compteId) && estPartageActif(l, maintenant))
        .sort((a, b) => b.creeLe.getTime() - a.creeLe.getTime() || b.id - a.id)
        .map(copier);
    },
  };
  return { services, lignes };
}
