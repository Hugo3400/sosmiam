import type { Signalement } from "../base-de-donnees/client-genere/client.ts";
import { estFichierGardeParSignalement } from "../fonctions/social/est-fichier-garde-par-signalement.ts";
import type { DepotPhotosProfil, TransactionPhotosProfil } from "./photos-profil-regles.ts";

export type ComptePhotoEnMemoire = { avatar: string | null; photoProfil?: string | null };

export type SignalementPhotoEnMemoire = Pick<Signalement, "id" | "cible" | "auteurContenuId" | "fichierMedia" | "creeLe" | "statut" | "contesteLe" | "reexamineLe" | "traiteLe">;

export type OptionsDepotPhotosProfilEnMemoire = {
  comptes?: Map<number, ComptePhotoEnMemoire>;
  estLimite?: (compteId: number, maintenant: Date) => boolean | Promise<boolean>;
};

export function creerDepotPhotosProfilEnMemoire(o: OptionsDepotPhotosProfilEnMemoire = {}) {
  const comptes = o.comptes ?? new Map<number, ComptePhotoEnMemoire>();
  const signalements: SignalementPhotoEnMemoire[] = [];
  const blocages = new Set<string>();
  let file: Promise<unknown> = Promise.resolve();

  const transaction: TransactionPhotosProfil = {
    async verrouillerCompte(compteId) {
      const compte = comptes.get(compteId);
      return compte ? { photo: compte.photoProfil ?? null, avatar: compte.avatar } : null;
    },
    async ecrirePhoto(compteId, photo) {
      const compte = comptes.get(compteId);
      if (compte) compte.photoProfil = photo;
    },
    async listerSignalementsAGarder(compteId, depuis, seuil) {
      return signalements
        .filter((s) => s.cible === "profil" && s.auteurContenuId === compteId && s.fichierMedia === null && s.creeLe.getTime() >= depuis.getTime())
        .filter((s) => estFichierGardeParSignalement(s, seuil))
        .map((s) => s.id);
    },
    async citerPreuve(signalementIds, fichier) {
      const cites = signalements.filter((s) => signalementIds.includes(s.id) && s.fichierMedia === null);
      for (const s of cites) s.fichierMedia = fichier;
      return cites.length;
    },
  };

  const depot: DepotPhotosProfil = {
    ecrire<T>(faire: (t: TransactionPhotosProfil) => Promise<T>): Promise<T> {
      const tour = file.then(() => faire(transaction));
      file = tour.catch(() => undefined);
      return tour;
    },
    async lireTitulaire(photo, maintenant) {
      const trouve = [...comptes].find(([, c]) => c.photoProfil === photo);
      if (!trouve) return null;
      return { compteId: trouve[0], limite: (await o.estLimite?.(trouve[0], maintenant)) ?? false };
    },
    async bloqueEntre(a, b) {
      return blocages.has(`${a}:${b}`) || blocages.has(`${b}:${a}`);
    },
    async listerPhotosCitees(photos) {
      const citees = new Set([...comptes.values()].flatMap((c) => (c.photoProfil ? [c.photoProfil] : [])));
      return new Set(photos.filter((p) => citees.has(p)));
    },
    async lirePhoto(compteId) {
      return comptes.get(compteId)?.photoProfil ?? null;
    },
    async lireSignalementDeProfil(signalementId) {
      const s = signalements.find((x) => x.id === signalementId && x.cible === "profil");
      return s ? { auteurContenuId: s.auteurContenuId, fichierMedia: s.fichierMedia, creeLe: s.creeLe } : null;
    },
  };

  return {
    depot,
    comptes,
    signalements,
    bloquer: (bloqueur: number, bloque: number) => void blocages.add(`${bloqueur}:${bloque}`),
  };
}
