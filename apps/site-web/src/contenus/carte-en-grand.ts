export const TEXTES_CARTE_EN_GRAND = {
  meta: {
    titre: (nom: string, ville: string) => `La carte de ${nom} à ${ville}`,
    description: (nom: string, rubriques: string) => `La carte de ${nom} sur SOS Miam : ${rubriques}.`,
    introuvable: "Carte introuvable — SOS Miam",
  },
  filAriane: {
    accueil: "Accueil",
    carte: "La carte",
  },
  titre: { carte: "La carte", formules: "Les formules" },
  sousTitre: (nom: string, date: string | null) => (date ? `${nom} · mise à jour par le lieu le ${date}` : nom),
  imprimer: "Imprimer",
  fermer: "Fermer",
  retourFiche: (nom: string) => ` la carte et revenir à la fiche de ${nom}`,
  rubriques: "Rubriques de la carte",
  recherche: {
    etiquette: "Chercher dans la carte",
    indication: "Chercher un plat, une boisson…",
  },
  filtres: {
    etiquette: "Filtrer la carte",
    sansAlcool: "Sans alcool",
    toutAfficher: "Tout afficher",
  },
  resultats: (nombre: number) =>
    nombre === 0 ? "Rien à l'écran pour ces choix." : `${nombre} ${nombre > 1 ? "plats et boissons à l'écran" : "plat ou boisson à l'écran"}`,
  aucunResultat: "Rien ne correspond. Essaie un autre mot ou retire un filtre : la carte a plein d'autres pépites.",
  piedDePage: "Les prix, les plats et les boissons sont ceux que le lieu a mis sur SOS Miam. Allergènes : demande sur place.",
} as const;
