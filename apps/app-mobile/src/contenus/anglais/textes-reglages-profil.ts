import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { TEXTES_REGLAGES_PROFIL } from "~/contenus/textes-reglages-profil";

export const TEXTES_REGLAGES_PROFIL_ANGLAIS: Traduction<typeof TEXTES_REGLAGES_PROFIL> = {
  enviesAucune: "Nothing ticked yet",
  envies: (n: number) => `${n} ticked`,
  avatarPhoto: "Your photo for now, or one of the Miamis",
  avatarAutre: (nom: string) => `You're ${nom} for now – or use a photo`,
  avatar: "Your avatar",
  mesInfos: "My details",
  mesEnvies: "What I'm into",
  enviesOups: "Oops, we hit a snag",
  enviesRatees: "Your choices couldn't be saved. Try again in a moment.",
  enviesSousTitre: "Tick everything you fancy – we use it to show you places that are your kind of thing.",
  enregistrer: "Save changes",
  enviesIndice: "Saves your choices and goes back to My profile",
  choisis: (n: number) => `${n} picked`,
};
