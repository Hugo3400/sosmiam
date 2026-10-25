import type { ImageLieu } from "../../../../packages/commun/src/regles/images-lieu.ts";
import type { DepotImagesLieu, ImagesDuLieu } from "./images-lieu-regles.ts";

export type LieuImagesEnMemoire = ImagesDuLieu & { statut: "brouillon" | "publie" | "masque"; imagesMajLe: Date | null };

export function creerDepotImagesLieuEnMemoire() {
  const lieux = new Map<number, LieuImagesEnMemoire>();
  let file: Promise<unknown> = Promise.resolve();
  const depot: DepotImagesLieu = {
    ecrire(faire) {
      const suite = file.then(() => {
        const copie = new Map([...lieux].map(([id, l]) => [id, { ...l }]));
        return faire({
          async verrouillerLieu(lieuId) {
            const l = copie.get(lieuId);
            return l ? { banniere: l.banniere, logo: l.logo } : null;
          },
          async ecrireImage(lieuId: number, quelle: ImageLieu, nom: string | null, quand: Date) {
            const l = copie.get(lieuId);
            if (l) copie.set(lieuId, { ...l, [quelle]: nom, imagesMajLe: quand });
          },
        }).then((resultat) => {
          lieux.clear();
          for (const [id, l] of copie) lieux.set(id, l);
          return resultat;
        });
      });
      file = suite.catch(() => undefined);
      return suite;
    },
    async lireLieuDeLImage(nom) {
      for (const [lieuId, l] of lieux) if (l.banniere === nom || l.logo === nom) return { lieuId, publie: l.statut === "publie" };
      return null;
    },
    async listerImagesCitees(noms) {
      const citees = new Set<string>();
      for (const l of lieux.values()) for (const nom of [l.banniere, l.logo]) if (nom && noms.includes(nom)) citees.add(nom);
      return citees;
    },
  };
  return { depot, lieux };
}
