import { LIBELLES_AVANTAGE } from "@sos-miam/commun/contenus/libelles-reglement";
import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { TEXTES_CREATEUR } from "~/contenus/textes-createur";

const MENTION = LIBELLES_AVANTAGE.partenariat;

export const TEXTES_CREATEUR_ANGLAIS: Traduction<typeof TEXTES_CREATEUR> = {
  introuvableTitre: "This creator has slipped away",
  introuvable: (pseudo: string | null) => `We can't find anyone${pseudo ? ` called @${pseudo}` : ""}. The username may have changed, or the link got its wires crossed.`,
  retour: "Back",
  accroche: "Shares great places on video",
  chiffresLu: (publications: number, jaimes: number) => `${publications} post${publications === 1 ? "" : "s"}, ${jaimes} like${jaimes === 1 ? "" : "s"}`,
  chiffres: (publications: number, jaimes: number, jaimesCourt: string) => `${publications} post${publications === 1 ? "" : "s"} · ${jaimesCourt} like${jaimes === 1 ? "" : "s"}`,
  partenariatsLu: (n: number) => `Declared partnerships, ${n}`,
  partenariats: (n: number) => `🤝 Declared partnerships (${n})`,
  aidePartenariats: `When a place gives or pays for something, it's there in black and white: “${MENTION}” (a paid or gifted partnership).`,
  aucunPartenariat: "No paid or gifted partnerships declared on their posts.",
  partenariatLu: (partenariat: string, lieu: string) => `${MENTION}: a paid or gifted partnership, ${partenariat}, with ${lieu}`,
  partenariat: (partenariat: string) => `${MENTION} · paid or gifted partnership · ${partenariat}`,
  publicationsLu: (n: number) => `Their posts, ${n}`,
  publications: (n: number) => `🎬 Their posts (${n})`,
  aucunePublication: "Nothing to show you here yet – their next gems are on the way!",
  vignette: (nom: string, lieu: string, quartier: string) => `${nom}'s post about ${lieu}, ${quartier}`,
};
