import type { RaisonSignalement } from "@sos-miam/commun/types/signalement";

/** Une raison de signaler, telle qu'on la montre dans l'app. */
export type ChoixRaisonSignalement = {
  cle: RaisonSignalement;
  emoji: string;
  titre: string;
  /** Exemples, sous le titre */
  detail: string;
  /** Ce qu'on peut préciser à l'étape suivante (un seul choix, facultatif) */
  precisions: string[];
  /** Contenu qui peut être grave ou illégal : on rappelle les numéros d'urgence et Pharos */
  grave?: boolean;
};

/** Les raisons proposées quand on signale une publication, de la plus courante à la plus rare. */
export const raisonsSignalement: ChoixRaisonSignalement[] = [
  {
    cle: "faux-lieu",
    emoji: "🏚️",
    titre: "Faux lieu ou fausses infos",
    detail: "Lieu fermé ou inventé, faux SOS, prix ou horaires trompeurs",
    precisions: ["Le lieu n'existe pas ou a fermé", "Le SOS ou la promo n'est pas vrai", "Prix, horaires ou adresse faux", "Les images ne montrent pas ce lieu"],
  },
  {
    cle: "pub-cachee",
    emoji: "📣",
    titre: "Pub cachée ou spam",
    detail: "Partenariat pas indiqué, publication en boucle",
    precisions: ["Collaboration commerciale pas indiquée", "Spam ou publication répétée", "Pub pour autre chose qu'un lieu"],
  },
  {
    cle: "arnaque",
    emoji: "💸",
    titre: "Arnaque",
    detail: "Demande d'argent, faux jeu concours, lien douteux",
    precisions: ["Demande d'argent ou de coordonnées bancaires", "Faux jeu concours", "Lien douteux"],
  },
  {
    cle: "haine",
    emoji: "🤬",
    titre: "Haine ou harcèlement",
    detail: "Insultes, moqueries, discrimination, menaces",
    precisions: ["Propos haineux ou discriminatoires", "Harcèlement ou moquerie", "Menaces"],
    grave: true,
  },
  {
    cle: "choquant",
    emoji: "🔞",
    titre: "Violence ou contenu sexuel",
    detail: "Images violentes, nudité, contenu dérangeant",
    precisions: ["Violence ou cruauté", "Nudité ou contenu sexuel", "Image choquante ou dérangeante"],
    grave: true,
  },
  {
    cle: "danger",
    emoji: "⚠️",
    titre: "Danger ou produit interdit",
    detail: "Drogue, alcool proposé à des mineurs, défi dangereux",
    precisions: ["Drogue", "Alcool proposé à des mineurs", "Défi ou comportement dangereux", "Arme"],
    grave: true,
  },
  {
    cle: "vie-privee",
    emoji: "🔒",
    titre: "Vie privée",
    detail: "Quelqu'un filmé ou montré sans son accord",
    precisions: ["J'apparais sans mon accord", "Quelqu'un d'autre apparaît sans son accord", "Des infos personnelles sont visibles"],
  },
  {
    cle: "vol-contenu",
    emoji: "©️",
    titre: "Vidéo ou photo volée",
    detail: "Contenu repris sans l'accord de son auteur",
    precisions: ["C'est mon contenu", "C'est le contenu de quelqu'un d'autre"],
  },
  {
    cle: "autre",
    emoji: "💬",
    titre: "Autre chose",
    detail: "Dis-nous avec tes mots ce qui ne va pas",
    precisions: [],
  },
];
