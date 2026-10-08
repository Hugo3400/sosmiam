// Forme des questions de la FAQ.
import type { BlocTexte } from "~/contenus/type-bloc-texte";

export type QuestionFaq = {
  /** Sert de lien direct vers la question : /faq#faq-prix */
  id: string;
  question: string;
  reponse: BlocTexte[];
  /** Mots en plus pour la recherche, non affichés (ex. « prix » pour « Combien ça coûte ? ») */
  motsCles?: string[];
};

export type OngletFaq = {
  cle: string;
  emoji: string;
  titre: string;
  /** Titre affiché au-dessus des résultats pendant une recherche */
  titreGroupe: string;
  /** Onglet en rouge (BIG SOS) */
  alerte?: boolean;
  questions: QuestionFaq[];
};
