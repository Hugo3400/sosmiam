import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { TEXTES_MON_PROFIL, TEXTES_PARAMETRES } from "~/contenus/textes-parametres";

export const TEXTES_PARAMETRES_ANGLAIS: Traduction<typeof TEXTES_PARAMETRES> = {
  titre: "Settings",
  sousTitre: "Your account, your alerts and your data – you're the one in charge here.",
  retour: "Back to profile",
  compte: {
    titre: "Your account and alerts",
    resume: "Your email, your password and your notifications",
    resumeSansCompte: "Your notifications",
  },
  apparence: {
    titre: "Appearance",
    choix: {
      automatique: { emoji: "🌗", titre: "Automatic", detail: "Just like your phone, day or night" },
      clair: { emoji: "☀️", titre: "Light", detail: "Always the cream background" },
      sombre: { emoji: "🌙", titre: "Dark", detail: "Always the night background, easy on the eyes in the evening" },
    },
    resume: {
      automatique: "Automatic, like your phone",
      clair: "Always light",
      sombre: "Always dark",
    },
  },
  securite: {
    titre: "Privacy and security",
    comptePrive: "Private account",
    comptePublic: "Public account",
    compteEnLecture: "Private or public account",
    bloques: (n: number) => (n === 0 ? "no one blocked" : `${n} ${n === 1 ? "person" : "people"} blocked`),
    bloquesEnLecture: "blocked people",
  },
  vie: {
    titre: "Inside SOS Miam",
    resume: "What's new, Suggestion box, Get involved, Bug hunt and Drop us a line",
    nouveautes: "What's new",
    nouveautesDetail: "What's changing in the app, version after version",
    boiteIdees: "Suggestion box",
    boiteIdeesDetail: "Suggest, vote and comment – the Brigade reads everything and gets back to you",
    onRecrute: "Get involved",
    onRecruteDetail: "Fancy joining the Brigade? Volunteering or project work: see what's open",
    chasseAuxBugs: "Bug hunt",
    chasseAuxBugsDetail: "Found a security flaw? Tell us – there's a badge in it for you",
  },
  aide: {
    titre: "Help and legal info",
    resume: "Health, privacy, terms, legal notice",
  },
  donnees: {
    titre: "Your data",
    resume: "Download it, or clear everything from this phone",
    resumeSansExport: "Find out where it is, or clear everything from this phone",
  },
};

export const TEXTES_MON_PROFIL_ANGLAIS: Traduction<typeof TEXTES_MON_PROFIL> = {
  titre: "My profile",
  sousTitre: "Your face, your details and what you're into – change it all here, right next to your profile.",
  retour: "Back to profile",
  sectionProfil: "Your profile",
  sectionPreferences: "Your preferences",
};
