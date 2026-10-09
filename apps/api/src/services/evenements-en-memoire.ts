// Double en mémoire des événements des lieux, pour les tests (aucune base de données) : mêmes filtres que evenements.ts.
import { compterEvenementsAVenir } from "../fonctions/evenements/compter-evenements-a-venir.ts";
import {
  calculerBornePeutFinir, EVENEMENTS_EQUIPE_LUS_MAX, EVENEMENTS_LUS_MAX, INTERETS_LUS_MAX, type EvenementAvecLieu, type EvenementEquipe,
  type LieuEvenement, type LigneEvenement, type ServicesEvenements,
} from "./evenements-regles.ts";

export type LieuEvenementEnMemoire = LieuEvenement & { latitude: number | null; longitude: number | null };
export type CompteEvenementEnMemoire = { prenom: string; dateNaissanceChiffree: string | null };
type InteretEnMemoire = { compteId: number; evenementId: number; rappel: boolean; creeLe: number };

export function creerEvenementsEnMemoire() {
  const lieux = new Map<number, LieuEvenementEnMemoire>();
  const comptes = new Map<number, CompteEvenementEnMemoire>();
  const evenements: LigneEvenement[] = [];
  const interets: InteretEnMemoire[] = [];
  let suivant = 1;
  let ordre = 0;

  const peutFinirApres = (e: LigneEvenement, depuis: Date) => (e.hebdoJusqua ?? e.debut) >= calculerBornePeutFinir(depuis);
  const parDebut = (a: LigneEvenement, b: LigneEvenement) => a.debut.getTime() - b.debut.getTime() || a.id - b.id;
  const lieuDe = (lieuId: number): LieuEvenement => {
    const { latitude: _la, longitude: _lo, ...lieu } = lieux.get(lieuId) ?? { id: lieuId, nom: "?", emoji: "📍", type: "resto", ville: "", publie: false, latitude: null, longitude: null };
    return { ...lieu };
  };
  const copier = (e: LigneEvenement): LigneEvenement => ({ ...e });
  const pourEquipe = (e: LigneEvenement): EvenementEquipe => ({
    ...copier(e),
    publiePar: e.compteId === null ? null : (comptes.get(e.compteId)?.prenom ?? null),
    interesses: interets.filter((i) => i.evenementId === e.id).length,
  });
  const avecLieu = (e: LigneEvenement): EvenementAvecLieu => ({ ...copier(e), lieu: lieuDe(e.lieuId) });

  const services: ServicesEvenements = {
    async lireLieu(lieuId) {
      return lieux.has(lieuId) ? lieuDe(lieuId) : null;
    },
    async listerPourEquipe(lieuId, depuis) {
      return evenements.filter((e) => e.lieuId === lieuId && peutFinirApres(e, depuis)).sort(parDebut).slice(0, EVENEMENTS_EQUIPE_LUS_MAX).map(pourEquipe);
    },
    async lirePourEquipe(evenementId) {
      const e = evenements.find((x) => x.id === evenementId);
      return e ? pourEquipe(e) : null;
    },
    async creer(lieuId, compteId, champs, maintenant, maximum) {
      const existants = evenements.filter((e) => e.lieuId === lieuId && e.annuleLe === null);
      if (compterEvenementsAVenir(existants, maintenant) >= maximum) return { ok: false, erreur: "trop-d-evenements" };
      const id = suivant++;
      evenements.push({ id, lieuId, compteId, ...champs, photo: null, creeLe: maintenant, modifieLe: maintenant, annuleLe: null, suspendu: false });
      return { ok: true, id };
    },
    async modifier(evenementId, champs) {
      const e = evenements.find((x) => x.id === evenementId);
      if (e) Object.assign(e, champs);
    },
    async annuler(evenementId, maintenant) {
      const e = evenements.find((x) => x.id === evenementId);
      if (e && e.annuleLe === null) e.annuleLe = maintenant;
    },
    async listerVisibles({ zone, lieuId, du, au }) {
      return evenements
        .filter((e) => {
          const lieu = lieux.get(e.lieuId);
          if (!lieu?.publie || e.suspendu || e.annuleLe !== null || e.debut >= au || !peutFinirApres(e, du)) return false;
          if (lieuId !== null && e.lieuId !== lieuId) return false;
          if (!zone) return true;
          return lieu.latitude !== null && lieu.longitude !== null && lieu.latitude >= zone.sud && lieu.latitude <= zone.nord && lieu.longitude >= zone.ouest && lieu.longitude <= zone.est;
        })
        .sort(parDebut)
        .slice(0, EVENEMENTS_LUS_MAX)
        .map(avecLieu);
    },
    async lireAvecLieu(evenementId) {
      const e = evenements.find((x) => x.id === evenementId);
      return e ? avecLieu(e) : null;
    },
    async listerInterets(compteId, depuis) {
      return interets
        .filter((i) => i.compteId === compteId)
        .sort((a, b) => b.creeLe - a.creeLe)
        .flatMap((i) => {
          const e = evenements.find((x) => x.id === i.evenementId);
          return e && peutFinirApres(e, depuis) ? [{ rappel: i.rappel, evenement: avecLieu(e) }] : [];
        })
        .slice(0, INTERETS_LUS_MAX);
    },
    async poserInteret(compteId, evenementId, rappel) {
      const deja = interets.find((i) => i.compteId === compteId && i.evenementId === evenementId);
      if (deja) deja.rappel = rappel;
      else interets.push({ compteId, evenementId, rappel, creeLe: ordre++ });
    },
    async retirerInteret(compteId, evenementId) {
      const index = interets.findIndex((i) => i.compteId === compteId && i.evenementId === evenementId);
      if (index >= 0) interets.splice(index, 1);
    },
    async lireNaissanceChiffree(compteId) {
      const compte = comptes.get(compteId);
      return compte ? compte.dateNaissanceChiffree : undefined;
    },
  };

  /** Remet tout à zéro entre deux tests */
  function vider() {
    lieux.clear();
    comptes.clear();
    evenements.length = 0;
    interets.length = 0;
    suivant = 1;
  }

  return { services, lieux, comptes, evenements, interets, vider };
}
