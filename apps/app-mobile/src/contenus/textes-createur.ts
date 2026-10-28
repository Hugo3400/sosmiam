import { LIBELLES_AVANTAGE } from "@sos-miam/commun/contenus/libelles-reglement";
import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_CREATEUR_ANGLAIS } from "~/contenus/anglais/textes-createur";

const MENTION = LIBELLES_AVANTAGE.partenariat;

export const TEXTES_CREATEUR = {
  introuvableTitre: "Ce créateur s'est éclipsé",
  introuvable: (pseudo: string | null) => `On ne trouve personne${pseudo ? ` qui s'appelle @${pseudo}` : ""} : le pseudo a peut-être changé, ou le lien s'est emmêlé les pinceaux.`,
  retour: "Retour",
  accroche: "Raconte ses bonnes adresses en vidéo",
  chiffresLu: (publications: number, jaimes: number) => `${publications} publication${publications > 1 ? "s" : ""}, ${jaimes} J'aime`,
  chiffres: (publications: number, jaimes: number, jaimesCourt: string) => `${publications} publication${publications > 1 ? "s" : ""} · ${jaimesCourt} J'aime`,
  partenariatsLu: (n: number) => `Partenariats déclarés, ${n}`,
  partenariats: (n: number) => `🤝 Partenariats déclarés (${n})`,
  aidePartenariats: `Quand un lieu offre ou paie quelque chose, c'est écrit noir sur blanc : « ${MENTION} ».`,
  aucunPartenariat: "Aucune collaboration commerciale déclarée sur ses publications.",
  partenariatLu: (partenariat: string, lieu: string) => `${MENTION} : ${partenariat}, avec ${lieu}`,
  partenariat: (partenariat: string) => `${MENTION} · ${partenariat}`,
  publicationsLu: (n: number) => `Ses publications, ${n}`,
  publications: (n: number) => `🎬 Ses publications (${n})`,
  aucunePublication: "Rien à te montrer ici pour l'instant : ses prochaines pépites arrivent !",
  vignette: (nom: string, lieu: string, quartier: string) => `Publication de ${nom} sur ${lieu}, ${quartier}`,
};

export const TEXTES_CREATEUR_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_CREATEUR>> = { fr: TEXTES_CREATEUR, en: TEXTES_CREATEUR_ANGLAIS };
