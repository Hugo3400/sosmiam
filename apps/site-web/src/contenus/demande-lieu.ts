// Champs du formulaire « J'inscris mon lieu » (page /inscrire-mon-lieu). Les longueurs maximales sont celles de l'API
// (POST /demandes-lieux) : un texte plus long y serait refusé, pas coupé.

import type { ParLangue, Traduction } from "../../../../packages/commun/src/types/traduction.ts";
import { TEXTES_DEMANDE_LIEU_ANGLAIS } from "~/contenus/anglais/demande-lieu";
import { assemblerDemandeLieu } from "~/fonctions/lieux/assembler-demande-lieu";

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

export type NomChampDemandeLieu = keyof typeof TEXTES_DEMANDE_LIEU.champs;

export type StructureChampDemandeLieu = Pick<ChampDemandeLieu, "maximum" | "obligatoire" | "type" | "autoComplete" | "exemple"> & { nom: NomChampDemandeLieu };

export const STRUCTURE_DEMANDE_LIEU: {
  lieu: readonly StructureChampDemandeLieu[];
  contact: readonly StructureChampDemandeLieu[];
  types: readonly ("resto" | "patisserie" | "bar" | "sortie" | "autre")[];
} = {
  lieu: [
    { nom: "nom", maximum: 80, obligatoire: true, type: "texte", autoComplete: "organization", exemple: "Chez Mamie Rose" },
    { nom: "ville", maximum: 80, obligatoire: true, type: "texte", autoComplete: "address-level2", exemple: "Lyon" },
    { nom: "adresse", maximum: 160, obligatoire: false, type: "texte", autoComplete: "street-address", exemple: "12 rue de la République" },
    { nom: "description", maximum: 1000, obligatoire: true, type: "zone" },
    { nom: "plat", maximum: 80, obligatoire: false, type: "texte" },
    { nom: "horaires", maximum: 160, obligatoire: false, type: "texte" },
    { nom: "siteWeb", maximum: 200, obligatoire: false, type: "url", autoComplete: "url" },
    { nom: "instagram", maximum: 60, obligatoire: false, type: "texte" },
  ],
  contact: [
    { nom: "contactNom", maximum: 80, obligatoire: true, type: "texte", autoComplete: "name" },
    { nom: "contactEmail", maximum: 254, obligatoire: true, type: "email", autoComplete: "email" },
    { nom: "contactTelephone", maximum: 30, obligatoire: false, type: "tel", autoComplete: "tel", exemple: "06 12 34 56 78" },
  ],
  types: ["resto", "patisserie", "bar", "sortie", "autre"],
};

export const TEXTES_DEMANDE_LIEU = {
  meta: {
    titre: "Inscrire mon lieu",
    description: "Resto, pâtisserie, bar ou sortie indépendant, partout en France : inscris ton lieu sur SOS Miam. C'est gratuit, sans abonnement ni commission.",
  },
  titre: "Inscris ton lieu",
  chapo: "C'est gratuit, sans abonnement ni commission. Raconte-nous ton lieu : on lit chaque demande et on te répond par e-mail.",
  champs: {
    nom: { libelle: "Nom du lieu", erreur: "Donne le nom du lieu (80 caractères au plus)." },
    ville: { libelle: "Ville", erreur: "Indique la ville du lieu (80 caractères au plus)." },
    adresse: { libelle: "Adresse", erreur: "L'adresse fait 160 caractères au plus." },
    description: {
      libelle: "Ton lieu en quelques mots",
      aide: "Ce qui le rend unique, l'ambiance, pourquoi il mérite plus de monde (20 caractères au moins).",
      erreur: "Raconte ton lieu en 20 à 1000 caractères.",
    },
    plat: { libelle: "Le plat ou la spécialité à goûter", exemple: "La tarte du jour", erreur: "Le plat fait 80 caractères au plus." },
    horaires: { libelle: "Horaires", exemple: "Mar–sam, 12h–14h30 et 19h–23h", erreur: "Les horaires font 160 caractères au plus." },
    siteWeb: { libelle: "Site web", exemple: "https://monlieu.fr", erreur: "Le site web doit être une adresse comme https://monlieu.fr." },
    instagram: { libelle: "Instagram", exemple: "@monlieu", erreur: "Le compte Instagram fait 60 caractères au plus." },
    contactNom: { libelle: "Ton prénom et ton nom", erreur: "Dis-nous comment tu t'appelles (80 caractères au plus)." },
    contactEmail: { libelle: "Ton e-mail", exemple: "ton@email.fr", erreur: "Cette adresse e-mail ne semble pas valide." },
    contactTelephone: { libelle: "Ton téléphone", erreur: "Le téléphone fait 30 caractères au plus." },
  },
  types: { resto: "Resto", patisserie: "Pâtisserie", bar: "Bar", sortie: "Sortie", autre: "Autre" },
  formulaire: {
    tonLieu: "Ton lieu",
    cEstPlutot: "C'est plutôt…",
    facultatif: " (facultatif)",
    toi: "Toi",
    pourTeRepondre: "Pour te répondre. Ces coordonnées ne sont jamais publiées.",
    compteur: (longueur: number, maximum: number) => `${longueur} / ${maximum} caractères`,
    envoi: "Envoi…",
    envoyer: "Envoyer ma demande",
    donnees: "Ce qu'on fait de ces informations : ",
    confidentialite: "confidentialité",
    merci: "Merci, c'est envoyé !",
    retourAccueil: "Retour à l'accueil",
  },
  messages: {
    unChamp: "Un champ est à corriger.",
    plusieursChamps: (nombre: number) => `${nombre} champs sont à corriger.`,
    envoyee: "On lit chaque demande. Si tout est bon, on crée la fiche de ton lieu et on t'écrit à l'adresse indiquée.",
    champInconnu: "Un champ ne va pas : vérifie le formulaire.",
    tropDeDemandes: "Doucement ! Trop de demandes d'affilée : réessaie dans une demi-heure, ou écris-nous à bonjour@sosmiam.fr.",
    erreur: "Oups, ta demande n'est pas passée. Réessaie dans un instant, ou écris-nous à bonjour@sosmiam.fr.",
  },
};

export const TEXTES_DEMANDE_LIEU_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_DEMANDE_LIEU>> = {
  fr: TEXTES_DEMANDE_LIEU,
  en: TEXTES_DEMANDE_LIEU_ANGLAIS,
};

const formulaireFrancais = assemblerDemandeLieu(STRUCTURE_DEMANDE_LIEU, TEXTES_DEMANDE_LIEU);

/** Le lieu : ce qui pourra apparaître sur sa fiche publique si la demande est acceptée. */
export const champsLieu: ChampDemandeLieu[] = formulaireFrancais.champsLieu;

/** Toi : pour te répondre. Jamais publié. */
export const champsContact: ChampDemandeLieu[] = formulaireFrancais.champsContact;

export const typesDemandeLieu = formulaireFrancais.types;
