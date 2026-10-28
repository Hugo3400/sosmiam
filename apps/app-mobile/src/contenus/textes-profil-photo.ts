import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_ENCART_PHOTO_LOCALE_ANGLAIS, TEXTES_MENTION_PHOTO_PROFIL_ANGLAIS } from "~/contenus/anglais/textes-profil-photo";

export const TEXTES_ENCART_PHOTO_LOCALE = {
  titre: "📸 Ta photo est restée sur ce téléphone",
  texte: "Ta photo n'est visible que sur ce téléphone. La montrer à ta bande et aux Miamis ? Elle apparaîtra partout où ton avatar apparaît, et tu la retires quand tu veux.",
  preparation: "Ta photo se prépare",
  montrer: "La montrer",
  indiceMontrer: "Ta photo part sur SOS Miam, visible par les autres",
  laisser: "Laisser comme ça",
  indiceLaisser: "Ta photo reste sur ce téléphone",
} as const;

export const TEXTES_MENTION_PHOTO_PROFIL = {
  sansCompte: "🔒 Sans compte, ta photo reste sur ton téléphone.",
  photoLocale: "🔒 Ta photo actuelle n'est visible que sur ce téléphone.",
  visibilite:
    "📸 Une photo est visible par les autres Miamis partout où ton avatar apparaît (ta bande, tes commentaires, la messagerie), même si ton compte est privé. Tu la changes ou la retires quand tu veux. Une photo de toi ou de ton plat fétiche, pas celle de quelqu'un d'autre, et rien d'explicite.",
  regles: "Les règles de la photo de profil",
  lienRegles: "https://sosmiam.fr/cgu#photo-profil",
} as const;

export const TEXTES_ENCART_PHOTO_LOCALE_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_ENCART_PHOTO_LOCALE>> = { fr: TEXTES_ENCART_PHOTO_LOCALE, en: TEXTES_ENCART_PHOTO_LOCALE_ANGLAIS };
export const TEXTES_MENTION_PHOTO_PROFIL_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_MENTION_PHOTO_PROFIL>> = { fr: TEXTES_MENTION_PHOTO_PROFIL, en: TEXTES_MENTION_PHOTO_PROFIL_ANGLAIS };
