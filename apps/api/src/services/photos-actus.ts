import { PART_LIBRE_MIN_DISQUE } from "../../../../packages/commun/src/regles/chat.ts";
import { baseDeDonnees } from "../base-de-donnees/connexion.ts";
import { preparerPhotoAvis } from "../fonctions/avis/preparer-photo-avis.ts";
import { DELAI_MENAGE_PHOTO_ACTUS_MS, DELAI_UTILISATION_PHOTO_ACTUS_MS, PHOTOS_ACTUS_PAR_PASSAGE_DE_MENAGE } from "./actus-regles.ts";
import type { RefusPhotoAvis } from "./photos-avis-regles.ts";
import { FORME_PHOTO_AVIS, type StockagePhotosAvis } from "./stockage-photos-avis.ts";

type BasePhotosActus = Pick<typeof baseDeDonnees, "articleActus">;

export type PhotosActus = ReturnType<typeof creerPhotosActus>;

export function creerPhotosActus(stockage: StockagePhotosAvis, base: BasePhotosActus = baseDeDonnees, horloge: () => number = Date.now) {
  const citer = (nom: string) => ({ OR: [{ couverture: nom }, { photos: { has: nom } }] });

  return {
    async deposer(compteId: number, octets: Uint8Array): Promise<{ ok: true; photo: string } | RefusPhotoAvis> {
      const preparee = await preparerPhotoAvis(octets);
      if (!preparee.ok) return preparee;
      if (!((await stockage.lirePartLibre()) >= PART_LIBRE_MIN_DISQUE)) return { ok: false, erreur: "stockage-plein" };
      const photo = stockage.tirerNom();
      await stockage.ecrire(photo, preparee.octets, { compteId, deposeLe: new Date(horloge()) });
      return { ok: true, photo };
    },

    async verifier(noms: readonly string[], compteId: number, articleId: number | null): Promise<boolean> {
      for (const nom of noms) {
        if (!FORME_PHOTO_AVIS.test(nom)) return false;
        const fiche = await stockage.lireFiche(nom);
        if (!fiche || fiche.compteId !== compteId || !(await stockage.existe(nom))) return false;
        const citations = await base.articleActus.findMany({ where: citer(nom), select: { id: true } });
        if (citations.some((c) => c.id !== articleId)) return false;
        const dejaDansLArticle = articleId !== null && citations.length > 0;
        if (!dejaDansLArticle && horloge() - fiche.deposeLe.getTime() >= DELAI_UTILISATION_PHOTO_ACTUS_MS) return false;
      }
      return true;
    },

    async lirePublique(nom: string): Promise<Buffer | null> {
      if (!FORME_PHOTO_AVIS.test(nom)) return null;
      const publie = await base.articleActus.count({ where: { statut: "publie", ...citer(nom) } });
      return publie > 0 ? stockage.lire(nom) : null;
    },

    async lireDuCompte(nom: string, compteId: number): Promise<Buffer | null> {
      if (!FORME_PHOTO_AVIS.test(nom)) return null;
      const fiche = await stockage.lireFiche(nom);
      return fiche?.compteId === compteId ? stockage.lire(nom) : null;
    },

    async menager(maintenant = new Date(horloge())): Promise<number> {
      let effacees = 0;
      let apres: string | null = null;
      for (;;) {
        const paquet = await stockage.lister(apres, PHOTOS_ACTUS_PAR_PASSAGE_DE_MENAGE);
        if (paquet.length === 0) return effacees;
        const anciennes = paquet.filter((p) => maintenant.getTime() - p.deposeLe.getTime() >= DELAI_MENAGE_PHOTO_ACTUS_MS).map((p) => p.photo);
        const citees = anciennes.length === 0
          ? []
          : await base.articleActus.findMany({ where: { OR: [{ couverture: { in: anciennes } }, { photos: { hasSome: anciennes } }] }, select: { couverture: true, photos: true } });
        const gardees = new Set(citees.flatMap((c) => [c.couverture, ...c.photos]));
        effacees += await stockage.supprimer(anciennes.filter((nom) => !gardees.has(nom)));
        apres = paquet[paquet.length - 1]!.photo;
      }
    },

    async lireGestion(nom: string): Promise<Buffer | null> {
      if (!FORME_PHOTO_AVIS.test(nom)) return null;
      const cite = await base.articleActus.count({ where: citer(nom) });
      return cite > 0 ? stockage.lire(nom) : null;
    },
  };
}
