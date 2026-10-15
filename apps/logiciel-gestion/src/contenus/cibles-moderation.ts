// Les contenus que la modération juge, en clair (mêmes clés que l'API : services/gestion/cibles-moderation.ts).

export const CIBLES_MODERATION: Record<string, { libelle: string; le: string; emoji: string; remise?: string }> = {
  publication: { libelle: "Publications", le: "la publication", emoji: "🎬" },
  commentaire: { libelle: "Commentaires", le: "le commentaire", emoji: "💬" },
  message: { libelle: "Messages", le: "le message", emoji: "✉️" },
  liste: { libelle: "Listes", le: "la liste", emoji: "📋" },
  // Profil, sortie, groupe : retenus, ils ne sont pas retirés mais remis par défaut (l'API le fait dans la décision)
  profil: { libelle: "Profils", le: "le profil", emoji: "👤", remise: "son avatar est effacé. Le prénom se corrige depuis la fiche du compte ; le pseudo, pas encore" },
  sortie: { libelle: "Sorties", le: "la sortie", emoji: "🎉", remise: "son titre redevient « Sortie », pour tous ceux qui y sont invités" },
  groupe: { libelle: "Groupes", le: "le groupe", emoji: "👥", remise: "son nom est effacé : il s'affiche « Groupe » chez tous ses membres" },
};
