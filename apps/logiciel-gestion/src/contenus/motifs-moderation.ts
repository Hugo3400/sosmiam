// Les règles de la communauté, telles que les CGU les écrivent (apps/site-web/src/contenus/legal/cgu.ts, « Les règles de
// la communauté ») : le motif d'un contenu retiré, cité mot pour mot dans le message à l'auteur.
export const MOTIFS_MODERATION: Record<string, { libelle: string; regle: string }> = {
  "fausse-info": { libelle: "Fausses infos", regle: "pas de fausses infos : un lieu inventé ou fermé, un faux SOS, des prix ou des horaires trompeurs, un avis sans visite, payé ou écrit pour nuire à un concurrent" },
  "pub-cachee": { libelle: "Pub cachée ou spam", regle: "pas de pub cachée ni de spam" },
  arnaque: { libelle: "Arnaque", regle: "pas d'arnaques : demande d'argent ou de coordonnées bancaires, faux jeu concours, lien douteux" },
  haine: { libelle: "Haine ou harcèlement", regle: "pas de haine ni de harcèlement : insultes, moqueries, discrimination, menaces" },
  violence: { libelle: "Violence, nudité ou contenu sexuel", regle: "pas de violence, de nudité ni de contenu sexuel" },
  danger: { libelle: "Mise en danger", regle: "rien qui mette en danger : drogue, alcool proposé à des mineurs, défi dangereux, arme" },
  "vie-privee": { libelle: "Vie privée", regle: "rien qui porte atteinte à la vie privée : filmer ou montrer quelqu'un sans son accord, publier ses infos personnelles" },
  droits: { libelle: "Contenu des autres", regle: "pas de contenu des autres (vidéo, photo, musique, texte) sans leur accord" },
  triche: { libelle: "Triche ou faux signalements", regle: "pas de triche, ni de signalements exprès de publications qui respectent les règles" },
  usurpation: { libelle: "Usurpation", regle: "ne pas se faire passer pour quelqu'un d'autre, ou pour un lieu qu'on ne représente pas" },
  illegal: { libelle: "Contenu illégal", regle: "rien d'illégal" },
};
