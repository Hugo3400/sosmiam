// Espace ambassadeur INVENTÉ pour la démo (en développement seulement) : 3 avis à relire, 2 missions, 2 messages de
// l'équipe. Les avis à relire ne portent jamais leur auteur ni son âge (jamais l'avis d'un 15-17 ans). Les dates sont
// relatives au départ de la démo ; creerMagasinInitial y ajoute les lieux.
import type { NoteAvis, RaisonRelecture } from "@sos-miam/commun/types/avis";
import type { TypeMission } from "@sos-miam/commun/types/espace-ambassadeur";
import type { ModeValidation } from "@sos-miam/commun/types/visite";

export type AvisARelireExemple = {
  lieuId: number;
  note: NoteAvis;
  texte: string;
  preuve: ModeValidation;
  ilYaJours: number;
  raison: RaisonRelecture;
};

export const avisARelireExemples: readonly AvisARelireExemple[] = [
  {
    lieuId: 3,
    note: 2,
    texte: "Les baos étaient bons mais tièdes, et la sauce manquait de peps. Le service était adorable, on retentera un soir plus calme.",
    preuve: "addition",
    ilYaJours: 2,
    raison: "tirage",
  },
  {
    lieuId: 4,
    note: 1,
    texte: "Impossible de se garer dans ce quartier, la mairie devrait faire quelque chose. Une étoile pour le parking.",
    preuve: "comptoir",
    ilYaJours: 3,
    raison: "rafale-notes",
  },
  {
    lieuId: 9,
    note: 5,
    texte: "MEILLEUR RESTO DU MONDE !!! Allez-y les yeux fermés, tout est parfait, le meilleur de toute la France, 5 étoiles obligé !!!",
    preuve: "comptoir",
    ilYaJours: 1,
    raison: "compte-neuf",
  },
];

export type MissionExemple = {
  lieuId: number;
  type: TypeMission;
  titre: string;
  detail: string;
  creeIlYaJours: number;
  echeanceDansJours: number | null;
};

export const missionsExemples: readonly MissionExemple[] = [
  {
    lieuId: 16,
    type: "verifier-big-sos",
    titre: "Vérifier le BIG SOS des Toqués de la Lergue",
    detail:
      "Le jeune couple qui tient Les Toqués de la Lergue a demandé un BIG SOS. Passe les voir, écoute leur histoire et dis-nous si leur demande colle à ce que tu vois. Une visite bienveillante, pas une inspection.",
    creeIlYaJours: 2,
    echeanceDansJours: 6,
  },
  {
    lieuId: 2,
    type: "verifier-lieu",
    titre: "Vérifier la fiche de La Figue Pressée",
    detail:
      "Horaires, prix des cocktails, quiz du jeudi : vérifie que la fiche dit vrai. Note dans ton compte rendu tout ce qui a changé, même un détail.",
    creeIlYaJours: 4,
    echeanceDansJours: 12,
  },
];

export type MessageExemple = { titre: string; texte: string; ilYaJours: number };

export const messagesAmbassadeurExemples: readonly MessageExemple[] = [
  {
    titre: "Bienvenue chez les ambassadeurs !",
    texte:
      "Merci de donner un peu de ton temps aux lieux du coin. Tes missions arrivent ici : prends-les à ton rythme, et si l'une d'elles ne te va pas, dis-le-nous sans gêne.",
    ilYaJours: 9,
  },
  {
    titre: "Les relectures d'avis sont ouvertes",
    texte:
      "Tu peux maintenant relire des avis repérés par nos garde-fous. Rappel : un avis critique mais honnête, c'est OK. Tu ne vois jamais l'auteur, et l'équipe a toujours le dernier mot.",
    ilYaJours: 1,
  },
];
