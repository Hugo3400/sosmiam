import { lireAvatarPhoto } from "@sos-miam/commun/validation/lire-avatar-photo";
import { BLOCAGES_INCONNUS, type BlocagesPhotos } from "~/hooks/utiliser-blocages-photos";

export function lireBlocagesPhotos(empreinte: string): BlocagesPhotos {
  try {
    const { pret, bloques } = JSON.parse(empreinte) as { pret: boolean; bloques: [string, string | null][] };
    return {
      pret,
      ids: new Set(bloques.map(([id]) => id)),
      photos: new Set(bloques.map(([, avatar]) => avatar).filter((avatar): avatar is string => lireAvatarPhoto(avatar) !== null)),
    };
  } catch {
    return BLOCAGES_INCONNUS;
  }
}
