export type AnnonceApp = {
  id: number;
  titre: string;
  texte: string;
  emoji: string | null;
  bouton: { libelle: string; lien: string } | null;
  fin: string | null;
};
