// Programme Ambassadeurs (voir docs/decisions.md).

// Dans l'ordre : la position du palier donne le niveau de son badge (1 à 4).
export const paliersAmbassadeurs = [
  { titre: "Curieux", texte: "Tes premières visites et tes premiers avis.", sombre: false },
  { titre: "Dénicheur", texte: "Tu proposes des lieux et tu tiens les fiches à jour.", sombre: false },
  { titre: "Ambassadeur de quartier", texte: "Tu valides les lieux et tu crées des sélections.", sombre: false },
  { titre: "Ambassadeur de ville", texte: "Sur candidature ou invitation. Places limitées.", sombre: true },
];

export const missionsAmbassadeurs = [
  { fort: "Ajouter et valider", suite: "des lieux indépendants." },
  { fort: "Vérifier sur place", suite: "les demandes de BIG SOS de ton quartier." },
  { fort: "Créer des sélections", suite: "comme « Meilleurs cafés de l'Écusson »." },
  { fort: "Faire connaître SOS Miam", suite: "aux commerçants du coin." },
];

export const avantagesAmbassadeurs = [
  { fort: "Ton badge", suite: "et « Déniché par toi » sur tes lieux." },
  { fort: "Des avantages", suite: "chez les commerçants partenaires." },
  { fort: "L'avant-première", suite: "et le groupe des ambassadeurs." },
  { fort: "Des événements :", suite: "tournées découverte, soirées." },
];
