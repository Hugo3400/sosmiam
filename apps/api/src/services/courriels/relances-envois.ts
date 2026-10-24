import { classerErreurEnvoi } from "../../fonctions/courriels/classer-erreur-envoi.ts";

export const DELAIS_RELANCE_MS = [30_000, 2 * 60_000, 10 * 60_000, 30 * 60_000] as const;

type Tache = { annuler: () => void };
export type Planifier = (action: () => void, delai: number) => Tache;
export type EtatRelance = { envoye: boolean; essais: number; erreur: string | null };
export type Relance = { cle: string; id: number | null; essai: number; tenter: () => Promise<void> };

export type DependancesRelances = {
  noter: (id: number, etat: EtatRelance) => Promise<void>;
  decrire: (erreur: unknown) => string;
  planifier?: Planifier;
  horloge?: () => number;
};

const HEURE_PARIS = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });

const planifierMinuteur: Planifier = (action, delai) => {
  const minuteur = setTimeout(action, delai);
  minuteur.unref();
  return { annuler: () => clearTimeout(minuteur) };
};

export function prochaineRelance(essai: number, maintenant: number): number | null {
  const delai = DELAIS_RELANCE_MS[essai - 1];
  return delai === undefined ? null : maintenant + delai;
}

export function annoncerRelance(message: string, prochainLe: number | null): string {
  return prochainLe === null ? message.slice(0, 300) : `${message.slice(0, 240)} · nouvel essai à ${HEURE_PARIS.format(prochainLe)}`;
}

export function creerRelancesEnvois({ noter, decrire, planifier = planifierMinuteur, horloge = Date.now }: DependancesRelances) {
  const enCours = new Map<string, { jeton: symbol; tache: Tache }>();

  function annuler(cle: string) {
    enCours.get(cle)?.tache.annuler();
    enCours.delete(cle);
  }

  async function noterSansBloquer(id: number | null, etat: EtatRelance) {
    if (id === null) return;
    await noter(id, etat).catch((erreur: unknown) => console.error("Nouvel essai d'un mail : journal impossible :", decrire(erreur)));
  }

  async function relancer(relance: Relance, jeton: symbol) {
    const essais = relance.essai + 1;
    try {
      await relance.tenter();
      await noterSansBloquer(relance.id, { envoye: true, essais, erreur: null });
      if (enCours.get(relance.cle)?.jeton === jeton) enCours.delete(relance.cle);
    } catch (erreur) {
      const toujoursLa = enCours.get(relance.cle)?.jeton === jeton;
      const prochainLe = toujoursLa && classerErreurEnvoi(erreur as { code?: string }) === "reessayer" ? prochaineRelance(essais, horloge()) : null;
      await noterSansBloquer(relance.id, { envoye: false, essais, erreur: annoncerRelance(decrire(erreur), prochainLe) });
      if (prochainLe !== null && enCours.get(relance.cle)?.jeton === jeton) programmer({ ...relance, essai: essais });
      else if (enCours.get(relance.cle)?.jeton === jeton) enCours.delete(relance.cle);
    }
  }

  function programmer(relance: Relance): boolean {
    const delai = DELAIS_RELANCE_MS[relance.essai - 1];
    if (delai === undefined) return false;
    annuler(relance.cle);
    const jeton = Symbol(relance.cle);
    enCours.set(relance.cle, { jeton, tache: planifier(() => void relancer(relance, jeton), delai) });
    return true;
  }

  return { programmer, annuler, compter: () => enCours.size };
}
