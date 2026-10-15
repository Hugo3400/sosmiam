import { PART_LIBRE_MIN_DISQUE } from "../../../../packages/commun/src/regles/chat.ts";
import { deciderSortPhotoAvis } from "../fonctions/avis/decider-sort-photo-avis.ts";
import { estPhotoAvisPublique } from "../fonctions/avis/est-photo-avis-publique.ts";
import { preparerPhotoAvis } from "../fonctions/avis/preparer-photo-avis.ts";
import {
  calculerSeuilsMenagePhotosAvis, DELAI_UTILISATION_PHOTO_AVIS_MS, PHOTOS_AVIS_PAR_PASSAGE_DE_MENAGE,
  type CitationsPhotosAvis, type RefusPhotoAvis,
} from "./photos-avis-regles.ts";
import { FORME_PHOTO_AVIS, type PhotoAvisRangee, type StockagePhotosAvis } from "./stockage-photos-avis.ts";

export type DependancesPhotosAvis = {
  stockage: StockagePhotosAvis;
  citations: CitationsPhotosAvis;
  horloge?: () => number;
};

export type PhotoAvisDeposee = { ok: true; photo: string };

export type PhotosAvis = ReturnType<typeof creerPhotosAvis>;

export function creerPhotosAvis({ stockage, citations, horloge = Date.now }: DependancesPhotosAvis) {
  async function estEncoreLibre(photo: string): Promise<boolean> {
    return (await citations.lister([photo])).length === 0;
  }

  async function trierPaquet(paquet: readonly PhotoAvisRangee[], maintenant: Date): Promise<string[]> {
    const citees = await citations.lister(paquet.map((p) => p.photo));
    const masques = citees.filter((c) => c.statut === "masque").map((c) => c.avisId);
    const decisions = masques.length > 0 ? await citations.listerDecisions(masques) : [];
    const seuils = calculerSeuilsMenagePhotosAvis(maintenant);
    return paquet
      .filter((p) => deciderSortPhotoAvis({ deposeLe: p.deposeLe, citations: citees.filter((c) => c.photo === p.photo), decisions }, seuils) === "effacer")
      .map((p) => p.photo);
  }

  return {
    async deposer(compteId: number, octets: Uint8Array): Promise<PhotoAvisDeposee | RefusPhotoAvis> {
      const preparee = preparerPhotoAvis(octets);
      if (!preparee.ok) return preparee;
      if (!((await stockage.lirePartLibre()) >= PART_LIBRE_MIN_DISQUE)) return { ok: false, erreur: "stockage-plein" };
      const photo = stockage.tirerNom();
      await stockage.ecrire(photo, preparee.octets, { compteId, deposeLe: new Date(horloge()) });
      return { ok: true, photo };
    },

    async verifier(photo: string, compteId: number): Promise<boolean> {
      if (!FORME_PHOTO_AVIS.test(photo)) return false;
      const fiche = await stockage.lireFiche(photo);
      if (!fiche || fiche.compteId !== compteId) return false;
      if (horloge() - fiche.deposeLe.getTime() >= DELAI_UTILISATION_PHOTO_AVIS_MS) return false;
      return (await stockage.existe(photo)) && (await estEncoreLibre(photo));
    },

    async lirePublique(photo: string): Promise<Buffer | null> {
      if (!FORME_PHOTO_AVIS.test(photo)) return null;
      if (!estPhotoAvisPublique(await citations.lister([photo]))) return null;
      return stockage.lire(photo);
    },

    async menager(maintenant = new Date(horloge())): Promise<number> {
      let effacees = 0;
      let apres: string | null = null;
      for (;;) {
        const paquet = await stockage.lister(apres, PHOTOS_AVIS_PAR_PASSAGE_DE_MENAGE);
        if (paquet.length === 0) return effacees;
        effacees += await stockage.supprimer(await trierPaquet(paquet, maintenant));
        apres = paquet[paquet.length - 1]!.photo;
      }
    },
  };
}
