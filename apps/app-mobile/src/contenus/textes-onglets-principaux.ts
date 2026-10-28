import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_ONGLETS_PRINCIPAUX_ANGLAIS } from "~/contenus/anglais/textes-onglets-principaux";

export const TEXTES_ONGLETS_PRINCIPAUX = {
  barre: {
    titres: { index: "Pour toi", explorer: "Explorer", scan: "Scan", potes: "Communauté", profil: "Profil" },
    avisADonner: (n: number) => `${n} avis à donner`,
    additionEnAttente: "une addition en attente",
    lu: (titre: string, position: number, total: number, info: string | null) => `${titre}, onglet ${position} sur ${total}${info ? `, ${info}` : ""}`,
  },
  explorer: {
    lieux: (n: number) => `${n} lieu${n > 1 ? "x" : ""}`,
    aucunSansDepart: "Aucun lieu : on ne sait pas où tu es",
    aucunRecherche: "Aucun lieu pour cette recherche",
    aucunFiltres: "Aucun lieu avec ces filtres",
    aucunIci: "Aucun lieu par ici pour l'instant",
    positionAJour: "Ta position est à jour 📍",
    autourArreteRepli: (repli: string) => `Autour de moi arrêté : ${repli}`,
    autourArrete: "Autour de moi arrêté : ta position est oubliée",
    plusProches: "les plus proches d'abord",
    selonEnvies: "selon tes envies",
    origine: (depuis: string) => `distances à partir ${depuis}`,
  },
  communaute: {
    titre: "Ta bande t'attend",
    texte: "Ici, on s'organise entre potes : où on mange, qui vient, et qui n'a toujours pas répondu au groupe.",
    avantages: [
      "Ta bande, et qui a sauvé le plus de lieux ce mois-ci",
      "Des sorties où tout le monde vote pour le lieu (fini les débats sans fin)",
      "Un chat entre potes pour caler l'heure du rendez-vous",
      "Des listes partagées de bonnes adresses",
      "Les Miamis : des sorties ouvertes à ta ville",
    ],
  },
  profil: {
    titre: "Et toi, t'es qui ?",
    texte: "Ici s'affiche tout ce que tu fais pour les lieux du coin. Ta mamie serait fière.",
    avantages: [
      "Tes points et ton palier, de Curieux à Ambassadeur de quartier",
      "Tes badges et des défis à relever",
      "Tes lieux gardés pour plus tard",
      "Tes paramètres (avatar, envies, notifications)",
    ],
    pagesLegales: [
      { titre: "Conditions d'utilisation", adresse: "https://sosmiam.fr/cgu" },
      { titre: "Confidentialité", adresse: "https://sosmiam.fr/confidentialite" },
      { titre: "Mentions légales", adresse: "https://sosmiam.fr/mentions-legales" },
    ],
    lienRateTitre: "Oups, ça ne veut pas s'ouvrir",
    lienRate: (adresse: string) => `Ton téléphone n'a pas réussi à ouvrir ce lien. Tu peux le retrouver sur ${adresse}.`,
    horsLigne: "Tes points, ton palier et tes badges arrivent dès que le réseau revient. Ils t'attendent bien au chaud !",
    connecteToi: "Connecte-toi à ton compte pour retrouver tes points, ton palier et tes badges.",
  },
};

export const TEXTES_ONGLETS_PRINCIPAUX_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_ONGLETS_PRINCIPAUX>> = { fr: TEXTES_ONGLETS_PRINCIPAUX, en: TEXTES_ONGLETS_PRINCIPAUX_ANGLAIS };
