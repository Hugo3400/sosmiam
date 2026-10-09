// Proposer une modification d'une fiche de lieu (un client depuis l'app, plus tard le lieu lui-même). L'équipe la relit
// dans le logiciel de gestion (avant, maintenant, proposé), accepte tout ou partie, ou refuse avec une réponse par mail.
// Mêmes noms que le modèle Lieu de l'API (nom, adresse, horaires, texte, telephone, siteWeb, instagram) ; les infos
// pratiques en plus (animaux, accessible…) gardent les noms de InfosPratiques. Seulement les champs qui changent.

import type { InfosPratiques } from "./infos-pratiques.ts";

export type PropositionLieu = Partial<{
  nom: string;
  adresse: string;
  horaires: string;
  texte: string;
}> &
  InfosPratiques;

export type NouvelleSuggestionLieu = {
  proposition: PropositionLieu;
  /** Le « Pourquoi ? », facultatif (1 000 caractères au plus) */
  message: string | null;
};
