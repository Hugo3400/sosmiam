// Programme Ambassadeurs (voir docs/decisions.md). On n'annonce que ce qui est décidé : badges, « Déniché par toi », points,
// et pour les 10 fondateurs la carte numérotée, l'autocollant à leur prénom et l'avant-première (onglet « Recrutement
// ambassadeurs » du document de Hugo du 7 octobre 2026).

// Dans l'ordre : la position du palier donne le niveau de son badge (1 à 4).
export const paliersAmbassadeurs = [
  { titre: "Curieux", texte: "Tes premières visites et tes premiers avis.", sombre: false },
  { titre: "Dénicheur", texte: "Tu proposes des lieux et tu tiens les fiches à jour.", sombre: false },
  { titre: "Ambassadeur de quartier", texte: "Tu valides les lieux et tu crées des sélections.", sombre: false },
  { titre: "Ambassadeur de ville", texte: "Sur candidature ou invitation.", sombre: true },
];

export const missionsAmbassadeurs = [
  { fort: "Ajouter et valider", suite: "des lieux indépendants." },
  { fort: "Vérifier sur place", suite: "les demandes de BIG SOS de ton quartier." },
  { fort: "Créer des sélections", suite: "comme « Meilleurs cafés du quartier »." },
  { fort: "Faire connaître", suite: "les pépites autour de toi et en ligne." },
];

export const avantagesAmbassadeurs = [
  { fort: "Ton badge", suite: "et « Déniché par toi » sur tes lieux." },
  { fort: "Des points", suite: "à chaque visite, avis ou lieu proposé." },
  { fort: "Pour les 10 fondateurs :", suite: "une carte numérotée et ton prénom en vitrine." },
  { fort: "L'app en avant-première", suite: "pour les fondateurs, en lien direct avec l'équipe." },
];
