import { lireAvatarPhoto } from "@sos-miam/commun/validation/lire-avatar-photo";
import type { BlocagesPhotos } from "~/hooks/utiliser-blocages-photos";

export function peutMontrerPhotoPersonne(valeur: string | null, personneId: string | undefined, blocages: BlocagesPhotos): boolean {
  if (valeur === null || lireAvatarPhoto(valeur) === null || !blocages.pret) return false;
  if (personneId !== undefined && blocages.ids.has(personneId)) return false;
  return !blocages.photos.has(valeur);
}
