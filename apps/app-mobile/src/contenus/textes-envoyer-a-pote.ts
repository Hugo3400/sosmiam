import { LONGUEUR_MAX_MOT_RECOMMANDATION } from "@sos-miam/commun/regles/potes";
import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_ENVOYER_A_POTE_ANGLAIS } from "~/contenus/anglais/textes-envoyer-a-pote";

export const TEXTES_ENVOYER_A_POTE = {
  erreursMot: {
    vide: "Ton mot est vide : écris quelque chose, ou laisse-le de côté.",
    "trop-long": `${LONGUEUR_MAX_MOT_RECOMMANDATION} caractères maximum : la version courte, c'est la meilleure !`,
    "mot-interdit": "Un mot de ton message ne passe pas chez nous. Tu le reformules gentiment ?",
  },
  pasParti: "Ton lieu n'est pas parti : réessaie dans un instant.",
  envoyeA: (prenoms: string) => `C'est envoyé à ${prenoms} !`,
  indisponible: "Ce lieu n'est pas disponible",
  fermer: "Fermer",
  envoye: "C'est envoyé !",
  saliver: (prenoms: string, nombre: number, lieu: string) => `${prenoms} ${nombre > 1 ? "vont" : "va"} saliver devant ${lieu}.`,
  titre: "Envoyer à un pote",
  bandeVide: "Ta bande est vide pour l'instant. Ajoute un pote, et les bons plans voyageront !",
  ajouter: "Ajouter un pote",
  aQui: "À qui ?",
  position: (position: number, total: number) => `${position} sur ${total}`,
  petitMot: "Un petit mot",
  facultatif: "facultatif",
  exempleMot: "Leurs pâtes vont te faire pleurer de joie",
  envoyer: "Envoyer",
  indiceAucun: "Choisis d'abord au moins un pote",
  indiceEnvoyer: (lieu: string, prenoms: string) => `Envoie ${lieu} à ${prenoms}`,
  annuler: "Annuler",
  recue: {
    nouveau: "Nouveau",
    envoieLu: (prenom: string, lieu: string, details: string) => `${prenom} t'envoie ${lieu}, ${details}`,
    sonMot: (mot: string) => `Son mot : ${mot}`,
    indiceOuvrir: "Ouvre la fiche du lieu",
    envoie: (prenom: string) => `${prenom} t'envoie`,
    citerMot: (mot: string) => `« ${mot} »`,
    optionsLu: (prenom: string) => `Plus d'options sur ce lieu envoyé par ${prenom}`,
    indiceOptions: "Le retirer d'ici, voir son profil, signaler ce lieu envoyé, ou bloquer cette personne",
  },
};

export const TEXTES_ENVOYER_A_POTE_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_ENVOYER_A_POTE>> = { fr: TEXTES_ENVOYER_A_POTE, en: TEXTES_ENVOYER_A_POTE_ANGLAIS };
