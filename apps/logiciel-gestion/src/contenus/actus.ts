import type { RubriqueActus } from "../../../../packages/commun/src/regles/actus.ts";

export const RUBRIQUES_ACTUS_GESTION: Record<RubriqueActus, { libelle: string; emoji: string }> = {
  portrait: { libelle: "Portrait d'un lieu", emoji: "🧑‍🍳" },
  "top-quartier": { libelle: "Le top 5 du quartier", emoji: "🏆" },
  "bon-plan": { libelle: "Bon plan du moment", emoji: "💡" },
  "recit-sortie": { libelle: "Récit de sortie", emoji: "🧭" },
};

export const VERIFICATIONS_ACTUS = [
  "Photos : à l'auteur ou autorisées, pas de visage sans accord",
  "Lieux cités publiés, et vraiment ceux du texte",
  "Cadeau du lieu : la mention « Collaboration commerciale » si besoin",
  "Alcool : jamais d'incitation (le message sanitaire s'ajoute seul)",
  "Personne visée ou nommée sans accord, propos blessants",
] as const;

export const VUES_ACTUS = [
  { valeur: "a-relire", libelle: "À relire" },
  { valeur: "reponses", libelle: "Réponses des lieux" },
  { valeur: "a-retoucher", libelle: "En retouche" },
  { valeur: "publies", libelle: "Publiés" },
  { valeur: "refuses", libelle: "Refusés" },
] as const;

export type VueActus = (typeof VUES_ACTUS)[number]["valeur"];

export const TEXTES_ACTUS = {
  titre: "Actus à relire",
  sousTitre: "Chaque article des Miamis passe par la Brigade avant d'être publié. Coche ce que tu as vérifié, puis publie, demande une retouche ou refuse avec un motif.",
  actualiser: "Actualiser",
  exemple: "Données d'exemple : les vrais articles arriveront ici quand l'API des Actus sera branchée. Tes décisions ne partent nulle part pour l'instant.",
  vides: {
    "a-relire": { emoji: "🎉", titre: "Rien à relire : la Brigade est à jour" },
    reponses: { emoji: "💬", titre: "Aucune réponse de lieu à relire" },
    "a-retoucher": { emoji: "✏️", titre: "Aucun article en retouche" },
    publies: { emoji: "📰", titre: "Aucun article publié pour l'instant" },
    refuses: { emoji: "🙅", titre: "Aucun article refusé" },
  },
  liste: "Articles",
  renvoye: "renvoyé après retouche",
  ambassadeur: "Ambassadeur",
  lieuxCites: "Lieux cités",
  verifie: "Vérifié",
  collaboration: "Collaboration commerciale",
  rienRecu: "Rien reçu des lieux",
  alcool: "Parle d'alcool : le message sanitaire s'ajoutera seul sous l'article",
  finLe: (date: string) => `Bon plan valable jusqu'au ${date}`,
  photos: (nombre: number) => (nombre === 0 ? "Aucune photo dans le texte" : `${nombre} photo${nombre > 1 ? "s" : ""} dans le texte`),
  photosDuTexte: "Photos du texte (clique pour agrandir)",
  agrandir: (rang: number) => `Agrandir la photo ${rang}`,
  photo: (rang: number, total: number) => `Photo ${rang} sur ${total}`,
  couverture: "Couverture de l'article",
  imageIllisible: "Image illisible",
  contestee: (le: string) => `Refusé le ${le}, puis contesté par l'auteur : on lui a donné raison, l'article est à relire.`,
  caracteres: (nombre: number) => `${nombre.toLocaleString("fr-FR")} caractères`,
  lecture: (minutes: number) => `${minutes} min de lecture`,
  envoye: (le: string) => `envoyé le ${le}`,
  demandeRetouche: "Ta demande de retouche",
  aVerifier: "À vérifier",
  publier: "Publier",
  aidePublier: (points: number) => `Coche les 5 points pour publier. L'auteur gagne ${points} points.`,
  messageRetouche: "Message à l'auteur (pour « À retoucher »)",
  placeholderRetouche: "Ce qu'il faut changer, avec gentillesse.",
  retoucher: "À retoucher",
  refuser: "Refuser, avec un motif",
  prevenu: "L'auteur est prévenu dans sa cloche. Un refus donne le motif et peut être contesté.",
  suivi: {
    retouche: (le: string) => `Renvoyé à l'auteur le ${le}, en attente de sa nouvelle version.`,
    publie: (le: string) => `Publié le ${le}.`,
    refuse: (le: string) => `Refusé le ${le}.`,
    regle: (libelle: string) => `Règle enfreinte : ${libelle}`,
    contestation: "Contestation de l'auteur",
  },
  refus: {
    titreArticle: "Refuser cet article ?",
    titreReponse: "Refuser cette réponse ?",
    explicationArticle: "L'article n'est pas publié. L'auteur reçoit la règle et ton explication, et peut contester.",
    explicationReponse: "La réponse n'apparaît pas sous l'article. Le lieu reçoit la règle et ton explication, et peut contester.",
    motif: "Règle enfreinte (citée à l'auteur)",
    choisir: "Choisis la règle",
    regle: (regle: string) => `Règle des CGU : « ${regle} ».`,
    pourquoi: "Pourquoi, en clair (envoyé à l'auteur)",
    placeholder: "Ce qu'on a vu, concrètement : « La photo montre une serveuse de face, sans son accord. »",
    aide: "Les faits, sans jugement sur la personne. Le règlement européen demande qu'on explique chaque refus.",
    annuler: "Annuler",
    confirmer: "Refuser",
  },
  fait: {
    publie: (titre: string) => `« ${titre} » est publié.`,
    retouche: (titre: string) => `« ${titre} » est renvoyé à son auteur pour une retouche.`,
    refuse: (titre: string) => `« ${titre} » est refusé.`,
    reponsePubliee: (lieu: string) => `La réponse de ${lieu} est publiée sous l'article.`,
    reponseRefusee: (lieu: string) => `La réponse de ${lieu} est refusée.`,
  },
  reponses: {
    regle: "Une seule réponse par article, 500 caractères au plus, relue avant d'apparaître. On remercie, on précise, on invite : jamais de promo d'alcool, jamais de mot sur la personne.",
    sur: (titre: string, auteur: string) => `Sous « ${titre} », de ${auteur}`,
    publier: "Publier la réponse",
    refuser: "Refuser, avec un motif",
  },
} as const;
