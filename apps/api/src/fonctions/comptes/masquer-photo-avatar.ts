import { lireAvatarPhoto } from "../../../../../packages/commun/src/validation/lire-avatar-photo.ts";
import type { PersonneResume } from "../../../../../packages/commun/src/types/social.ts";

export function masquerPhotoAvatar(personne: PersonneResume): PersonneResume {
  return lireAvatarPhoto(personne.avatar) === null ? personne : { ...personne, avatar: null };
}
