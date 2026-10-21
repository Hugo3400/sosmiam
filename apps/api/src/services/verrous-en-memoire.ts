export type PrendreVerrou = (cle: string) => Promise<void>;

export function creerVerrousEnMemoire() {
  const files = new Map<string, Promise<void>>();
  return {
    async dans<T>(fn: (prendre: PrendreVerrou) => Promise<T>): Promise<T> {
      const tenus = new Map<string, () => void>();
      const prendre: PrendreVerrou = async (cle) => {
        if (tenus.has(cle)) return;
        let liberer!: () => void;
        const libere = new Promise<void>((fini) => (liberer = fini));
        const avant = files.get(cle) ?? Promise.resolve();
        const suite = avant.then(() => libere);
        files.set(cle, suite);
        tenus.set(cle, () => {
          liberer();
          if (files.get(cle) === suite) files.delete(cle);
        });
        await avant;
      };
      try {
        return await fn(prendre);
      } finally {
        for (const rendre of tenus.values()) rendre();
      }
    },
  };
}
