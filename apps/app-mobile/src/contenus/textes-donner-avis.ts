import type { NoteAvis } from "@sos-miam/commun/types/avis";

export const NOTES_AVIS: readonly NoteAvis[] = [1, 2, 3, 4, 5];

export const LIBELLES_NOTES_AVIS: Readonly<Record<NoteAvis, string>> = {
  1: "Raté cette fois",
  2: "Bof, peut mieux faire",
  3: "Sympa, sans plus",
  4: "Très bon moment",
  5: "Coup de cœur !",
};

export const TEXTES_DONNER_AVIS = {
  titre: "Alors, c'était comment ?",
  sousTitre: "Ton avis aide les Miamis à choisir, et le lieu à s'améliorer. Critique, c'est permis !",
  noteTitre: "Ta note",
  noteVide: "Touche une étoile",
  texteTitre: "Raconte-nous",
  textePlaceholder: "Ce que tu as goûté, l'accueil, l'ambiance…",
  texteAideCritique: "Critique, c'est permis, insulte non.",
  photoTitre: "Une photo ?",
  photoMention: "facultatif",
  photoAjouter: "Ajouter une photo",
  photoRetirer: "Retirer la photo",
  photoPoints: "Ton assiette en photo : +{points} points pour toi.",
  photoPointsAEnvoi: "+{points} points à l'envoi",
  photoPointsRepasOffert: "Repas offert : pas de points pour la photo cette fois, mais elle aide les Miamis à choisir.",
  photoSansPoints: "Elle aide les Miamis à choisir.",
  photoVisages: "Pas de visages d'inconnus sur ta photo : merci pour eux !",
  signature: "Signé « {signature} », daté au mois. Jamais ton nom complet ni ton âge.",
  repasOffert: "Ton avis sera marqué « Repas offert », pour que tout reste clair entre Miamis.",
  avecReduction: "Ton avis sera marqué « Avec réduction », pour la transparence.",
  publier: "Publier mon avis",
  publierIndiceIncomplet: "Choisis une note et écris au moins 10 caractères",
  merciTitre: "Merci, {prenom} !",
  merciTexte: "Ton avis est en ligne {chezLieu}. Grâce à toi, les Miamis choisissent mieux.",
  merciPointsPhoto: "pour ta photo",
  merciRepasOffert: "Repas offert : pas de points pour la photo cette fois. Merci quand même pour le coup d'œil !",
  merciApercu: "Voilà ce que les Miamis verront",
  merciReponse: "{lieu} pourra te répondre, en public, juste sous ton avis.",
  merciRelecture: "Comme chaque avis, le tien peut être relu par un ambassadeur. Il reste en ligne pendant ce temps.",
  merciTermine: "Terminé",
  merciMesVisites: "Voir mes visites",
  retourVisite: "Retour à ma visite",
} as const;
