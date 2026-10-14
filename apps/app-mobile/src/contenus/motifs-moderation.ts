// Les règles de la communauté (CGU, « Les règles de la communauté ») telles que la cloche les nomme quand un contenu est
// retiré : les codes viennent du logiciel de gestion (apps/api/src/services/gestion/motifs-moderation.ts). Un code inconnu
// de cette version de l'app est simplement tu.
export const LIBELLES_MOTIFS_MODERATION: Readonly<Record<string, string>> = {
  "fausse-info": "fausse information",
  "pub-cachee": "pub cachée",
  arnaque: "arnaque",
  haine: "propos haineux",
  violence: "violence",
  danger: "mise en danger",
  "vie-privee": "atteinte à la vie privée",
  droits: "droits d'auteur",
  triche: "triche",
  usurpation: "usurpation d'identité",
  illegal: "contenu illégal",
};
