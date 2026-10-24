export type EtatPoint = "ok" | "ko";
export type SanteComplete = { ok: boolean; base: EtatPoint; disque: EtatPoint; sauvegarde: EtatPoint };

export type DependancesSante = {
  verifierBase: () => Promise<unknown>;
  lireDisqueLibre: () => Promise<number>;
  lireDerniereSauvegarde: () => Promise<number | null>;
  horloge?: () => number;
};

export const CACHE_SANTE_MS = 15_000;
export const DELAI_BASE_MS = 3_000;
export const DISQUE_LIBRE_MIN = 0.05;
export const SAUVEGARDE_MAX_MS = 26 * 3600_000;

function avant<T>(promesse: Promise<T>, delai: number): Promise<T> {
  let minuteur: NodeJS.Timeout | undefined;
  const limite = new Promise<never>((_, rejeter) => (minuteur = setTimeout(() => rejeter(new Error("trop long")), delai)));
  return Promise.race([promesse, limite]).finally(() => clearTimeout(minuteur));
}

const point = (vrai: boolean): EtatPoint => (vrai ? "ok" : "ko");

export function creerSanteComplete({ verifierBase, lireDisqueLibre, lireDerniereSauvegarde, horloge = Date.now }: DependancesSante) {
  let derniere: { le: number; etat: Promise<SanteComplete> } | null = null;

  async function mesurer(maintenant: number): Promise<SanteComplete> {
    const [base, disque, sauvegarde] = await Promise.all([
      avant(Promise.resolve().then(verifierBase), DELAI_BASE_MS).then(() => true, () => false),
      Promise.resolve().then(lireDisqueLibre).then((libre) => libre >= DISQUE_LIBRE_MIN, () => false),
      Promise.resolve().then(lireDerniereSauvegarde).then((le) => le !== null && maintenant - le < SAUVEGARDE_MAX_MS, () => false),
    ]);
    return { ok: base && disque && sauvegarde, base: point(base), disque: point(disque), sauvegarde: point(sauvegarde) };
  }

  return function lireSanteComplete(): Promise<SanteComplete> {
    const maintenant = horloge();
    if (derniere && maintenant - derniere.le < CACHE_SANTE_MS) return derniere.etat;
    derniere = { le: maintenant, etat: mesurer(maintenant) };
    return derniere.etat;
  };
}
