import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_MON_PROFIL_ANGLAIS, TEXTES_PARAMETRES_ANGLAIS } from "~/contenus/anglais/textes-parametres";

export const TEXTES_PARAMETRES = {
  titre: "Paramètres",
  sousTitre: "Ton compte, tes alertes et tes données : ici, c'est toi qui décides.",
  retour: "Retour au profil",
  compte: {
    titre: "Ton compte et tes alertes",
    resume: "Ton e-mail, ton mot de passe et tes notifications",
    resumeSansCompte: "Tes notifications",
  },
  apparence: {
    titre: "Apparence",
    choix: {
      automatique: { emoji: "🌗", titre: "Automatique", detail: "Comme ton téléphone, de jour comme de soir" },
      clair: { emoji: "☀️", titre: "Clair", detail: "Toujours le fond crème" },
      sombre: { emoji: "🌙", titre: "Sombre", detail: "Toujours le fond nuit, doux pour les yeux le soir" },
    },
    resume: {
      automatique: "Automatique, comme ton téléphone",
      clair: "Toujours clair",
      sombre: "Toujours sombre",
    },
  },
  securite: {
    titre: "Confidentialité et sécurité",
    comptePrive: "Compte privé",
    comptePublic: "Compte public",
    compteEnLecture: "Compte privé ou public",
    bloques: (n: number) => (n === 0 ? "personne de bloqué" : `${n} personne${n > 1 ? "s" : ""} bloquée${n > 1 ? "s" : ""}`),
    bloquesEnLecture: "personnes bloquées",
  },
  vie: {
    titre: "La vie de SOS Miam",
    resume: "Nouveautés, Boîte à idées, On recrute, Chasse aux bugs et Nous écrire",
    nouveautes: "Les nouveautés",
    nouveautesDetail: "Ce qui change dans l'app, version après version",
    boiteIdees: "Boîte à idées",
    boiteIdeesDetail: "Propose, vote et commente : la Brigade lit tout et te répond",
    onRecrute: "On recrute",
    onRecruteDetail: "Envie de rejoindre la Brigade ? Bénévolat ou mission, les offres du moment",
    chasseAuxBugs: "Chasse aux bugs",
    chasseAuxBugsDetail: "Tu as trouvé une faille de sécurité ? Dis-le-nous, il y a un badge à la clé",
  },
  aide: {
    titre: "Aide et infos légales",
    resume: "Santé, confidentialité, conditions, mentions légales",
  },
  donnees: {
    titre: "Tes données",
    resume: "Les télécharger, ou tout effacer de ce téléphone",
    resumeSansExport: "Savoir où elles sont, ou tout effacer de ce téléphone",
  },
} as const;

export const TEXTES_MON_PROFIL = {
  titre: "Mon profil",
  sousTitre: "Ta tête, tes infos et tes envies : tout se change ici, juste à côté de ton profil.",
  retour: "Retour au profil",
  sectionProfil: "Ton profil",
  sectionPreferences: "Tes préférences",
} as const;

export const TEXTES_PARAMETRES_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_PARAMETRES>> = { fr: TEXTES_PARAMETRES, en: TEXTES_PARAMETRES_ANGLAIS };
export const TEXTES_MON_PROFIL_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_MON_PROFIL>> = { fr: TEXTES_MON_PROFIL, en: TEXTES_MON_PROFIL_ANGLAIS };
