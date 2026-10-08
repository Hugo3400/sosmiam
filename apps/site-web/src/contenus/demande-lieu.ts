// Champs du formulaire « J'inscris mon lieu » (page /inscrire-mon-lieu). Les longueurs maximales sont celles de l'API
// (POST /demandes-lieux) : un texte plus long y serait refusé, pas coupé.

export type ChampDemandeLieu = {
  nom: string;
  libelle: string;
  /** Petit texte d'aide sous le libellé */
  aide?: string;
  maximum: number;
  obligatoire: boolean;
  type: "texte" | "email" | "tel" | "url" | "zone";
  autoComplete?: string;
  exemple?: string;
  /** Message affiché quand l'API refuse ce champ */
  erreur: string;
};

/** Le lieu : ce qui pourra apparaître sur sa fiche publique si la demande est acceptée. */
export const champsLieu: ChampDemandeLieu[] = [
  { nom: "nom", libelle: "Nom du lieu", maximum: 80, obligatoire: true, type: "texte", autoComplete: "organization", exemple: "Chez Mamie Rose", erreur: "Donne le nom du lieu (80 caractères au plus)." },
  { nom: "ville", libelle: "Ville", maximum: 80, obligatoire: true, type: "texte", autoComplete: "address-level2", exemple: "Lyon", erreur: "Indique la ville du lieu (80 caractères au plus)." },
  { nom: "adresse", libelle: "Adresse", maximum: 160, obligatoire: false, type: "texte", autoComplete: "street-address", exemple: "12 rue de la République", erreur: "L'adresse fait 160 caractères au plus." },
  {
    nom: "description", libelle: "Ton lieu en quelques mots", aide: "Ce qui le rend unique, l'ambiance, pourquoi il mérite plus de monde (20 caractères au moins).",
    maximum: 1000, obligatoire: true, type: "zone", erreur: "Raconte ton lieu en 20 à 1000 caractères.",
  },
  { nom: "plat", libelle: "Le plat ou la spécialité à goûter", maximum: 80, obligatoire: false, type: "texte", exemple: "La tarte du jour", erreur: "Le plat fait 80 caractères au plus." },
  { nom: "horaires", libelle: "Horaires", maximum: 160, obligatoire: false, type: "texte", exemple: "Mar–sam, 12h–14h30 et 19h–23h", erreur: "Les horaires font 160 caractères au plus." },
  { nom: "siteWeb", libelle: "Site web", maximum: 200, obligatoire: false, type: "url", autoComplete: "url", exemple: "https://monlieu.fr", erreur: "Le site web doit être une adresse comme https://monlieu.fr." },
  { nom: "instagram", libelle: "Instagram", maximum: 60, obligatoire: false, type: "texte", exemple: "@monlieu", erreur: "Le compte Instagram fait 60 caractères au plus." },
];

/** Toi : pour te répondre. Jamais publié. */
export const champsContact: ChampDemandeLieu[] = [
  { nom: "contactNom", libelle: "Ton prénom et ton nom", maximum: 80, obligatoire: true, type: "texte", autoComplete: "name", erreur: "Dis-nous comment tu t'appelles (80 caractères au plus)." },
  { nom: "contactEmail", libelle: "Ton e-mail", maximum: 254, obligatoire: true, type: "email", autoComplete: "email", exemple: "ton@email.fr", erreur: "Cette adresse e-mail ne semble pas valide." },
  { nom: "contactTelephone", libelle: "Ton téléphone", maximum: 30, obligatoire: false, type: "tel", autoComplete: "tel", exemple: "06 12 34 56 78", erreur: "Le téléphone fait 30 caractères au plus." },
];

export const typesDemandeLieu = [
  { valeur: "resto", libelle: "Resto" },
  { valeur: "patisserie", libelle: "Pâtisserie" },
  { valeur: "bar", libelle: "Bar" },
  { valeur: "sortie", libelle: "Sortie" },
  { valeur: "autre", libelle: "Autre" },
] as const;
