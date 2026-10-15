// Double en mémoire du SOS du soir et du message du moment, pour les tests (aucune base de données).
import type { CreneauOuverture } from "../../../../packages/commun/src/types/lieu.ts";
import type { ServicesMomentLieu, SosLigne } from "./moment-lieu-regles.ts";

export type LieuMomentEnMemoire = { ouverture: CreneauOuverture[]; alerte: string | null; alerteJusqua: Date | null };

export function creerMomentLieuEnMemoire(prenoms: (compteId: number) => string | null = () => null) {
  const lieux = new Map<number, LieuMomentEnMemoire>();
  // compteId : qui l'a lancé (comme la colonne compte_id ; null : compte supprimé depuis)
  const sos: (SosLigne & { lieuId: number; compteId: number | null })[] = [];

  const services: ServicesMomentLieu = {
    async lireLieu(lieuId) {
      const lieu = lieux.get(lieuId);
      return lieu ? { ...lieu, ouverture: lieu.ouverture.map((c) => ({ ...c })) } : null;
    },
    async lireSosDepuis(lieuId, depuis) {
      const trouve = sos.filter((s) => s.lieuId === lieuId && s.creeLe >= depuis).at(-1);
      if (!trouve) return null;
      const { lieuId: _lieu, compteId: _compte, ...ligne } = trouve;
      return { ...ligne };
    },
    async lancerSos(lieuId, compteId, nouveau, maintenant, depuis) {
      if (sos.some((s) => s.lieuId === lieuId && s.creeLe >= depuis)) return "deja";
      sos.push({ lieuId, compteId, ...nouveau, creeLe: maintenant, arreteLe: null, lancePar: prenoms(compteId) });
      return "ok";
    },
    async lireAuteursSosEnCours(lieuId, maintenant) {
      return sos.filter((s) => s.lieuId === lieuId && !s.arreteLe && s.jusqua > maintenant).map((s) => s.compteId);
    },
    async arreterSos(lieuId, maintenant) {
      for (const s of sos) if (s.lieuId === lieuId && !s.arreteLe && s.jusqua > maintenant) s.arreteLe = maintenant;
    },
    async reglerMessage(lieuId, message) {
      const lieu = lieux.get(lieuId);
      if (lieu) Object.assign(lieu, { alerte: message?.texte ?? null, alerteJusqua: message?.jusqua ?? null });
    },
  };
  return { services, lieux, sos };
}
