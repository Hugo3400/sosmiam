// Textes de « Mes façons de me connecter » dans « Mon compte » (sosmiam.fr, ambassadeur. et pro.) : relier ou délier
// Apple et Google, ajouter un mot de passe. Les messages arrivent par « ?connexions=<code>&avec=<fournisseur> » : jamais un
// texte venu d'ailleurs. « {fournisseur} » est remplacé par « Apple », « Google », ou « Apple ou Google ».
import type { ParLangue, Traduction } from "../../../../packages/commun/src/types/traduction.ts";
import { TEXTES_MES_CONNEXIONS_ANGLAIS } from "./anglais/mes-connexions.ts";

/** Ce qui peut arriver après « Relier » ou « Délier » */
export type CodeMesConnexions =
  | "relie" | "delie" | "identite-deja-reliee" | "deja-relie" | "derniere-connexion" | "autre-compte" | "refuse" | "expire"
  | "annule" | "trop-de-demandes" | "indisponible";

/** Les codes qui annoncent une réussite (les autres : une explication, sans reproche) */
export const REUSSITES_MES_CONNEXIONS: CodeMesConnexions[] = ["relie", "delie"];

export const TEXTES_MES_CONNEXIONS = {
  messages: {
    relie: "C'est relié ! Tu peux maintenant te connecter avec {fournisseur}, en plus de tes autres façons. Ton adresse e-mail SOS Miam, elle, ne bouge pas.",
    delie: "C'est délié : {fournisseur} ne t'ouvre plus la porte de SOS Miam. Tes autres façons de te connecter marchent toujours.",
    "identite-deja-reliee":
      "Ce compte {fournisseur} est déjà relié à un autre compte SOS Miam. On ne fusionne jamais deux comptes : connecte-toi à l'autre compte, délie {fournisseur} depuis son « Mon compte » (ou supprime-le s'il ne te sert plus), puis reviens le relier ici.",
    "deja-relie": "Ton compte SOS Miam a déjà un autre compte {fournisseur} relié. Délie-le d'abord, puis relie le nouveau.",
    "derniere-connexion": "C'est ta seule façon de te connecter : sans elle, tu resterais à la porte ! Ajoute un mot de passe ou relie un autre compte d'abord.",
    "autre-compte": "Ce n'est pas le compte {fournisseur} relié à ton compte SOS Miam : reprends avec le bon.",
    refuse: "{fournisseur} n'a pas pu confirmer qui tu es. Réessaie dans un instant.",
    expire: "Ça a pris un peu trop de temps (10 minutes au plus). Recommence, ça va vite !",
    annule: "Pas de souci, rien n'a bougé.",
    "trop-de-demandes": "Doucement ! Trop d'essais d'affilée : réessaie dans un petit moment.",
    indisponible: "Oups, {fournisseur} ne répond pas pour l'instant. Réessaie dans un instant.",
  } satisfies Record<CodeMesConnexions, string>,
  appleOuGoogle: "Apple ou Google",
  titre: "Mes façons de me connecter",
  chapo: "Un seul compte, plusieurs clés : garde celles qui t'arrangent. Ton adresse e-mail SOS Miam reste la même quoi qu'il arrive.",
  illisible: "On n'arrive pas à lire tes façons de te connecter pour l'instant. Recharge la page dans un petit moment !",
  aideAjouterMotDePasse: "On t'envoie un lien à {email} pour choisir ton mot de passe (valable 24 heures).",
  avertissementRelaisApple:
    "Ton adresse est une adresse masquée d'Apple : le lien n'arrive que si le transfert des e-mails est activé pour SOS Miam, dans les réglages de ton identifiant Apple (« Se connecter avec Apple »).",
  lienMotDePasseEnvoye: "C'est parti ! Un lien t'attend dans ta boîte mail (pense à jeter un œil aux indésirables). Il est valable 24 heures.",
  emailEtMotDePasse: "E-mail et mot de passe",
  active: "Activé",
  pasDeMotDePasse: "Pas encore de mot de passe",
  ajouterMotDePasse: "Ajouter un mot de passe",
  envoiDuLien: "Envoi du lien…",
  relie: "Relié",
  pasRelie: "Pas relié",
  relier: "Relier",
  delier: "Délier",
  monCompte: (fournisseur: string) => ` mon compte ${fournisseur}`,
  pourRelier: (fournisseur: string) => `Pour relier ${fournisseur} ici, ajoute d'abord un mot de passe : c'est lui qui confirmera que c'est bien toi.`,
  seuleFacon: (autre: string, fournisseur: string) => `C'est ta seule façon de te connecter : ajoute un mot de passe ou relie ${autre} avant de pouvoir délier ${fournisseur}.`,
  pourDelier: (fournisseur: string) => `Pour délier ${fournisseur}, ajoute d'abord un mot de passe.`,
  delierFournisseur: (fournisseur: string) => `Délier ${fournisseur}`,
  enCoursDelier: "On délie…",
  enCoursRelier: "On relie…",
  plusAvec: (fournisseur: string) => `Tu ne pourras plus te connecter avec ${fournisseur}. Ton e-mail et ton mot de passe, eux, marchent toujours.`,
  reconnecteAvec: (autre: string) => `Ton compte n'a pas de mot de passe : pour confirmer, reconnecte-toi avec ${autre}. C'est lui qui restera ta façon de te connecter.`,
  confirmation: {
    titreRelier: (fournisseur: string) => `Relier ton compte ${fournisseur} ?`,
    titreDelier: (fournisseur: string) => `Délier ton compte ${fournisseur} ?`,
    delier: (fournisseur: string, cible: string) =>
      `${fournisseur} a confirmé que c'est bien toi. Tu ne pourras plus te connecter avec ${cible} ; ${fournisseur} restera ta façon de te connecter.`,
    relierAvecMotDePasse: (fournisseur: string) =>
      `${fournisseur} a dit oui. Dernière vérification avant d'ajouter cette clé : ton mot de passe. Ensuite, tu pourras te connecter à SOS Miam avec ${fournisseur}, en plus de tes autres façons. Ton adresse e-mail SOS Miam ne change pas.`,
    relierConfirme: (fournisseur: string, autre: string) =>
      `${fournisseur} et ${autre} ont confirmé que c'est bien toi. Tu pourras te connecter à SOS Miam avec ${fournisseur}, en plus de ${autre}. Ton adresse e-mail SOS Miam ne change pas.`,
    attendAutre: (fournisseur: string, autre: string) =>
      `${fournisseur} a dit oui. Ton compte n'a pas de mot de passe : pour vérifier que c'est bien toi, reconnecte-toi avec ${autre}, ta clé actuelle. Après, un seul bouton et c'est relié !`,
    autreIndisponible: (fournisseur: string, autre: string) =>
      `${fournisseur} a dit oui, mais ton compte n'a pas de mot de passe, et ${autre} ne se lance pas ici pour confirmer. Ajoute d'abord un mot de passe (juste en dessous), puis reviens relier ${fournisseur}.`,
    ouiRelier: (fournisseur: string) => `Oui, relier ${fournisseur}`,
    ouiDelier: (fournisseur: string) => `Oui, délier ${fournisseur}`,
    nonMerci: "Non merci",
  },
};

export const TEXTES_MES_CONNEXIONS_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_MES_CONNEXIONS>> = {
  fr: TEXTES_MES_CONNEXIONS,
  en: TEXTES_MES_CONNEXIONS_ANGLAIS,
};
