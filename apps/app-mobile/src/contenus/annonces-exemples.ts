import type { AnnonceApp } from "@sos-miam/commun/types/annonce-app";

export const ANNONCES_EXEMPLES: readonly AnnonceApp[] = [
  {
    id: 2,
    titre: "Nouvelle mission pour la Brigade !",
    texte:
      "Des lieux près de chez toi t'ont gardé une place au chaud : un plat du jour qui s'ennuie, une part de tarte orpheline, une table qui rêve de compagnie. Va voir qui a besoin d'un coup de fourchette ! Signé : la Brigade",
    emoji: "🛟",
    bouton: { libelle: "Je file explorer", lien: "/explorer" },
    fin: null,
  },
  {
    id: 1,
    titre: "Le Capitaine fait la sieste",
    texte: "Bouiboui s'est assoupi sur sa bouée : cette annonce-là est terminée, elle ne s'affiche plus. Chut, on le laisse rêver de crêpes.",
    emoji: "😴",
    bouton: null,
    fin: "2026-09-30T22:00:00.000Z",
  },
];
