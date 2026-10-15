// Doublure de stockage/avatar-local.ts : l'avatar gardé dans globalThis.__avatarDisque, chaque écriture et chaque photo
// supprimée notées dans globalThis.__journalAvatar. globalThis.__delaiAvatar : délai de chaque écriture (ms) ;
// globalThis.__avatarEchec : l'écriture échoue (disque plein).
import { EMOJI_AVATAR_PAR_DEFAUT } from "@sos-miam/commun/regles/avatar-par-defaut";

export const AVATAR_PAR_DEFAUT = { type: "emoji", emoji: EMOJI_AVATAR_PAR_DEFAUT };

const journal = () => (globalThis.__journalAvatar ??= []);

export async function enregistrerAvatarLocal(avatar) {
  const delai = globalThis.__delaiAvatar ?? 0;
  if (delai) await new Promise((r) => setTimeout(r, delai));
  if (globalThis.__avatarEchec) throw new Error("disque plein");
  journal().push("avatar:" + JSON.stringify(avatar));
  globalThis.__avatarDisque = avatar;
}

export function supprimerPhotoAvatar(uri) {
  journal().push("photo-supprimee:" + uri);
}

export async function lireAvatarLocal() {
  return globalThis.__avatarDisque ?? AVATAR_PAR_DEFAUT;
}

export async function effacerAvatarLocal() {
  globalThis.__avatarDisque = null;
}

export async function garderPhotoAvatar(uri) {
  return uri;
}

export async function lireOctetsPhotoAvatar(uri) {
  if (globalThis.__photosIllisibles?.has(uri)) throw new Error("photo-absente");
  journal().push("photo-lue:" + uri);
  return new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);
}
