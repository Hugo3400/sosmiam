import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_REGLAGES_CONNEXIONS_ANGLAIS } from "~/contenus/anglais/textes-reglages-connexions";

export const TEXTES_REGLAGES_CONNEXIONS = {
  titre: "Tes clés pour entrer",
  toucherPourReessayer: "Touche pour réessayer",
  ajoutSansEmail: "On t'envoie un lien pour le choisir (valable 24 heures).",
  relie: (nom: string) => `${nom} : relié ✅`,
  unInstant: "Un instant…",
  delierDetail: (nom: string) => `Touche pour délier ${nom}`,
  relierMonCompte: (nom: string) => `Relier mon compte ${nom}`,
  changerMotDePasse: "Changer mon mot de passe",
  changerMotDePasseDetail: "Tes autres appareils seront déconnectés",
  lienEnvoye: "Lien envoyé !",
  ajouterMotDePasse: "Ajouter un mot de passe",
  gesteApple: "Entre d'un coup de Face ID, en plus de tes autres clés",
  gesteGoogle: "Entre en un geste avec ton compte Google",
  tonMotDePasse: "Ton mot de passe",
  confirmerAvec: (autre: string) => `Confirmer avec ${autre}`,
  finalementNon: "Finalement non",
  relier: {
    titre: (nom: string) => `Relier ${nom}`,
    sousTitre: (nom: string) => `Une clé de plus à ton trousseau : tu pourras entrer avec ${nom}. Ton adresse e-mail SOS Miam, elle, ne bouge pas.`,
    avecMotDePasse: (nom: string) => `Avant d'ajouter une clé, on vérifie que c'est bien toi : ton mot de passe, puis ${nom} s'ouvre.`,
    sansMotDePasse: (nom: string, autre: string) => `Tu n'as pas de mot de passe : confirme d'abord avec ${autre}, ta clé actuelle. Juste après, ${nom} s'ouvre pour le relier.`,
  },
  delier: {
    titre: (nom: string) => `Délier ${nom}`,
    sousTitre: (nom: string) => `${nom} ne t'ouvrira plus la porte de SOS Miam. Tes autres clés, elles, marchent toujours.`,
    avecMotDePasse: "Pour confirmer que c'est bien toi, ton mot de passe :",
    sansMotDePasse: (autre: string) => `Tu n'as pas de mot de passe : confirme avec ${autre}, c'est la clé qui te restera.`,
  },
} as const;

export const TEXTES_REGLAGES_CONNEXIONS_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_REGLAGES_CONNEXIONS>> = {
  fr: TEXTES_REGLAGES_CONNEXIONS,
  en: TEXTES_REGLAGES_CONNEXIONS_ANGLAIS,
};
