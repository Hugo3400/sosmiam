export type FamilleEtiquette = "assiette" | "ambiance" | "pratique" | "public";

export type FamilleEtiquettesOfficielles = {
  id: FamilleEtiquette;
  nom: string;
  etiquettes: readonly string[];
};

export type StatutEtiquetteLieu = "confirmee" | "proposee";

export type EtiquetteLieu = {
  nom: string;
  statut: StatutEtiquetteLieu;
  propositions: number;
  parToi: boolean;
};

export type RefusEtiquetteLibre = "vide" | "trop-courte" | "trop-longue" | "mot-interdit" | "alcool";

export type EtiquetteLibreLue = { ok: true; nom: string; officielle: boolean } | { ok: false; refus: RefusEtiquetteLibre };
