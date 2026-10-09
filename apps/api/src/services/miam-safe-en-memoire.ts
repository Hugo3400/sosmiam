// Miam Safe en mémoire, pour les tests (mêmes règles que miam-safe.ts, sans base).
import {
  calculerRepereSentiBien, calculerStatutAlerte, DUREE_GARDE_ALERTES_MS, FENETRE_ALERTES_COMPTOIR_MS,
  type EndroitAlerte, type RaisonSignalementMiamSafe, type ServicesMiamSafe,
} from "./miam-safe-regles.ts";

type Alerte = { id: number; lieuId: number; compteId: number; prenom: string; endroit: EndroitAlerte; detail: string; creeLe: Date; repondueLe: Date | null };
type Charte = { signeeLe: Date; retireeLe: Date | null; motifRetrait: string | null };

/** `estPublie` : le lieu existe et est publié (lu dans les lieux en mémoire du banc d'essai) */
export function creerMiamSafeEnMemoire(estPublie: (lieuId: number) => boolean) {
  const chartes = new Map<number, Charte>();
  const alertes: Alerte[] = [];
  const signalements: { lieuId: number; compteId: number; raison: RaisonSignalementMiamSafe; explication: string }[] = [];
  const reponses = new Map<string, boolean>();
  let prochaineAlerte = 0;
  const recente = (a: Alerte, maintenant: Date) => maintenant.getTime() - a.creeLe.getTime() <= FENETRE_ALERTES_COMPTOIR_MS;

  const services: ServicesMiamSafe = {
    async lireLieu(lieuId) {
      if (!estPublie(lieuId)) return null;
      const reponsesLieu = [...reponses].filter(([cle]) => cle.startsWith(`${lieuId}:`));
      const oui = reponsesLieu.filter(([, valeur]) => valeur).length;
      const charte = chartes.get(lieuId);
      return { engage: charte !== undefined && charte.retireeLe === null, repere: calculerRepereSentiBien(oui, reponsesLieu.length) };
    },
    async creerAlerte(alerte, maintenant) {
      if (!estPublie(alerte.lieuId)) return { ok: false, erreur: "lieu-inconnu" };
      const charte = chartes.get(alerte.lieuId);
      if (!charte || charte.retireeLe) return { ok: false, erreur: "pas-miam-safe" };
      for (let i = alertes.length - 1; i >= 0; i--) if (maintenant.getTime() - alertes[i].creeLe.getTime() > DUREE_GARDE_ALERTES_MS) alertes.splice(i, 1);
      const id = ++prochaineAlerte;
      alertes.push({ ...alerte, id, creeLe: maintenant, repondueLe: null });
      return { ok: true, id };
    },
    async lireAlerte(id, compteId, maintenant) {
      const a = alertes.find((x) => x.id === id && x.compteId === compteId);
      if (!a) return null;
      return { id, statut: calculerStatutAlerte(a.creeLe, a.repondueLe, maintenant), creeLe: a.creeLe.toISOString(), repondueLe: a.repondueLe?.toISOString() ?? null };
    },
    async enregistrerSignalement(s) {
      if (!estPublie(s.lieuId)) return false;
      signalements.push(s);
      return true;
    },
    async repondreSentiBien({ lieuId, compteId, oui }) {
      if (!estPublie(lieuId)) return false;
      reponses.set(`${lieuId}:${compteId}`, oui);
      return true;
    },
    async listerAlertesLieu(lieuId, maintenant) {
      return alertes
        .filter((a) => a.lieuId === lieuId && recente(a, maintenant))
        .sort((a, b) => b.creeLe.getTime() - a.creeLe.getTime())
        .map((a) => ({ id: a.id, prenom: a.prenom, endroit: a.endroit, detail: a.detail, statut: calculerStatutAlerte(a.creeLe, a.repondueLe, maintenant), creeLe: a.creeLe.toISOString() }));
    },
    async repondreAlerte(lieuId, alerteId, _compteId, maintenant) {
      const a = alertes.find((x) => x.id === alerteId && x.lieuId === lieuId && recente(x, maintenant));
      if (!a) return false;
      a.repondueLe ??= maintenant;
      return true;
    },
    async lireCharte(lieuId) {
      const c = chartes.get(lieuId);
      if (!c) return { signee: false, signeeLe: null, retireeParEquipe: false };
      return { signee: c.retireeLe === null, signeeLe: c.retireeLe === null ? c.signeeLe.toISOString() : null, retireeParEquipe: c.retireeLe !== null && c.motifRetrait !== null };
    },
    async signerCharte(lieuId, _compteId, maintenant) {
      const c = chartes.get(lieuId);
      if (c?.retireeLe && c.motifRetrait !== null) return { ok: false, erreur: "charte-retiree" };
      if (c && c.retireeLe === null) return { ok: true };
      chartes.set(lieuId, { signeeLe: maintenant, retireeLe: null, motifRetrait: null });
      return { ok: true };
    },
    async quitterCharte(lieuId, maintenant) {
      const c = chartes.get(lieuId);
      if (c && c.retireeLe === null) c.retireeLe = maintenant;
    },
  };

  /** Pour les tests : ce que l'équipe SOS Miam ferait dans le logiciel de gestion */
  function retirerParEquipe(lieuId: number, motif: string, maintenant: Date) {
    const c = chartes.get(lieuId);
    if (c) Object.assign(c, { retireeLe: maintenant, motifRetrait: motif });
  }

  return { services, alertes, signalements, retirerParEquipe };
}
