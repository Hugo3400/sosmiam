import type { RefusEtiquetteLibre } from "@sos-miam/commun/types/etiquette";

export const TEXTES_ETIQUETTES = {
  titre: "Les étiquettes",
  lieuVerifie: "Le lieu confirme ou refuse les propositions.",
  lieuNonVerifie: "Ce lieu n'a pas encore de compte SOS Miam : ses étiquettes restent des propositions.",
  aucune: "Pas encore d'étiquette ici. Sois la première ou le premier à en proposer une !",
  proposer: "+ Proposer une étiquette",
  indiceProposer: "Choisis une étiquette dans la liste, ou écris la tienne",
  merci: "Proposée, merci ! Le lieu la verra passer.",
  feuilleTitre: "Proposer une étiquette",
  feuilleSousTitre: (nomLieu: string) => `Ce qui décrit le mieux ${nomLieu}, selon toi.`,
  libre: "Ta propre étiquette",
  libreMention: "facultatif",
  librePlaceholder: "Ex. : fans de ramen",
  envoyer: "Proposer",
  annuler: "Annuler",
  dejaConfirmee: "Le lieu l'a déjà confirmée : bien vu !",
  dejaProposee: "Tu l'as déjà proposée, merci !",
  voirPlus: (n: number) => (n === 1 ? "Voir l'autre" : `Voir les ${n} autres`),
  voirMoins: "Voir moins",
  filtre: "Étiquette",
  filtreLu: (nom: string) => `Étiquette : ${nom}`,
  filtreIndice: "Vegan, halal, accessible en fauteuil… : ne garde que les lieux qui l'ont",
  filtreTitre: "Filtrer par étiquette",
  filtreSousTitre: "Seulement les étiquettes confirmées par les lieux.",
  filtreToutes: "Toutes les étiquettes",
  filtreFermer: "Fermer",
  ligneLu: (noms: readonly string[]) => `Étiquettes : ${noms.join(", ")}`,
} as const;

export const REFUS_ETIQUETTE: Readonly<Record<RefusEtiquetteLibre, string>> = {
  vide: "Choisis une étiquette ou écris la tienne.",
  "trop-courte": "Un peu court : au moins 2 lettres.",
  "trop-longue": "24 caractères au plus : fais court et gourmand !",
  "mot-interdit": "Cette étiquette ne passe pas : garde-la sympa pour tout le monde.",
  alcool: "Pas d'étiquette sur l'alcool : on garde ça pour le comptoir.",
};
