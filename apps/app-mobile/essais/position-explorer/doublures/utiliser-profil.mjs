import { changerProfil, monde } from "./monde.mjs";

export function utiliserProfil() {
  return {
    profil: monde.profil,
    effacer: async () => {
      monde.effacements.push("profil");
      changerProfil(null);
    },
  };
}
