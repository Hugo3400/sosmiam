import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_ECRAN_NOUVEAU_GROUPE_ANGLAIS } from "~/contenus/anglais/textes-ecran-nouveau-groupe";

export const TEXTES_ECRAN_NOUVEAU_GROUPE = {
  retour: "Retour",
  titre: "Nouveau groupe",
  intro: "La team brunch, les fans de tielle ou toute la bande : un groupe, et vous papotez tous ensemble.",
  nom: "Le nom",
  nomLibelle: "Le nom du groupe",
  nomPlaceholder: "Les affamés du jeudi",
  caracteres: (n: number, max: number) => `${n}/${max} caractères`,
  emoji: "Emoji du groupe",
  avecQui: "Avec qui ?",
  avecQuiTexte: (potes: number, total: number) => `Jusqu'à ${potes} potes de ta bande (${total} avec toi).`,
  indiceMax: (potes: number) => `${potes} potes au plus dans un groupe, toi en plus`,
  unInstant: "Un instant…",
  creer: "Créer le groupe",
  creerIndice: "Tes potes choisis pourront discuter tous ensemble",
  erreurs: {
    titreVide: "Donne un nom à ton groupe, même « Les affamés » fait l'affaire.",
    titreLong: (max: number) => `${max} caractères au plus : fais court et gourmand.`,
    titreMot: "Un mot de ce nom ne passe pas chez nous. Tu reformules gentiment ?",
    membres: "Ajoute au moins un pote : un groupe tout seul, c'est un journal intime.",
    titreRefuse: (max: number) => `Ce nom ne passe pas : ${max} caractères au plus, et des mots gentils.`,
    participants: (max: number) => `Choisis entre 1 et ${max} potes de ta bande.`,
    reseau: "Le groupe n'a pas pu être créé (le réseau, sûrement). Réessaie dans un instant !",
  },
} as const;

export const TEXTES_ECRAN_NOUVEAU_GROUPE_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_ECRAN_NOUVEAU_GROUPE>> = { fr: TEXTES_ECRAN_NOUVEAU_GROUPE, en: TEXTES_ECRAN_NOUVEAU_GROUPE_ANGLAIS };
