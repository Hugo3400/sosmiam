// Les contenus que la modération juge, en clair (mêmes clés que l'API : services/gestion/cibles-moderation.ts).

export const CIBLES_MODERATION: Record<string, { libelle: string; le: string; emoji: string; aLaMain?: boolean }> = {
  publication: { libelle: "Publications", le: "la publication", emoji: "🎬" },
  commentaire: { libelle: "Commentaires", le: "le commentaire", emoji: "💬" },
  message: { libelle: "Messages", le: "le message", emoji: "✉️" },
  liste: { libelle: "Listes", le: "la liste", emoji: "📋" },
  // Profil, sortie, groupe : la décision ne change rien toute seule, l'équipe corrige à la main
  profil: { libelle: "Profils", le: "le profil", emoji: "👤", aLaMain: true },
  sortie: { libelle: "Sorties", le: "la sortie", emoji: "🎉", aLaMain: true },
  groupe: { libelle: "Groupes", le: "le groupe", emoji: "👥", aLaMain: true },
};
