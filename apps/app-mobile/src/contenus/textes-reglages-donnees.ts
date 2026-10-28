import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_REGLAGES_DONNEES_ANGLAIS } from "~/contenus/anglais/textes-reglages-donnees";

export const TEXTES_REGLAGES_DONNEES = {
  exportPret: "📦 Tes données sont prêtes. Garde ce fichier rien que pour toi !",
  exportIndisponible: "📱 Pas moyen d'enregistrer un fichier ici : télécharge tes données depuis l'app, sur ton téléphone.",
  exportBientot: "🍳 Bientôt dispo : le téléchargement de tes données mijote encore en cuisine.",
  exportTropDeDemandes: "🐢 Deux téléchargements par jour au plus : réessaie un peu plus tard.",
  exportHorsLigne: "📶 Pas de réseau : rien n'est parti. Réessaie dans un instant.",
  exportErreur: (emoji: string, titre: string, texte: string) => `${emoji} ${titre} : ${texte}`,
  telecharger: "Télécharger mes données sociales",
  telechargerEnCours: "On rassemble tout ça…",
  telechargerDetail: "Tes potes, tes listes, tes sorties et tes messages, rien que pour toi. Deux fois par jour au plus.",
  ouSontElles:
    "Ton compte et ton profil sont gardés sur notre serveur (ton nom et ta date de naissance y sont chiffrés), ta photo de profil aussi quand tu la montres. Ton régime particulier reste sur ce téléphone. Effacer ici ne touche que ce téléphone : pour supprimer ton compte, passe par « Mon compte ».",
  ouSontEllesSansCompte:
    "Tout reste sur ce téléphone : ton profil dans son coffre-fort chiffré, ton activité, ton avatar et tes préférences dans l'app. Rien n'est envoyé à notre serveur pour l'instant. Et quand ton compte arrivera, ta photo et ton régime particulier ne partiront pas sans ton accord.",
  effacer: "Effacer mes données et recommencer",
  effacerDetail: "Profil, avatar, rescousses, lieux gardés… tout repart à zéro",
} as const;

export const TEXTES_REGLAGES_DONNEES_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_REGLAGES_DONNEES>> = { fr: TEXTES_REGLAGES_DONNEES, en: TEXTES_REGLAGES_DONNEES_ANGLAIS };
