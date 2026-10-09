import { appeler, parametres } from "./client-gestion.ts";

// Mêmes valeurs que packages/commun/src/types/lieu.ts
export type TypeLieu = "resto" | "patisserie" | "bar" | "sortie";
export type EnvieLieu = "terrasse" | "vege" | "amoureux" | "potes" | "famille";
export type StatutLieu = "brouillon" | "publie" | "masque";
export type CreneauOuverture = { jours: number[]; de: string; a: string };
/** Infos pratiques (packages/commun/src/types/infos-pratiques.ts) : null = pas renseigné, jamais affiché dans l'app */
export type InfosPratiquesLieu = {
  animaux: "bienvenus" | "terrasse" | "non" | null;
  accessible: boolean | null;
  terrasse: boolean | null;
  wifi: boolean | null;
  enfants: boolean | null;
  parking: boolean | null;
  paiements: string[];
  reservation: "inutile" | "conseillee" | "obligatoire" | null;
};

export type SaisieLieu = {
  nom: string;
  type: TypeLieu;
  emoji: string;
  info: string;
  texte: string;
  adresse: string | null;
  quartier: string;
  ville: string;
  latitude: number | null;
  longitude: number | null;
  prix: "€" | "€€" | "€€€";
  prixMoyen: number | null;
  couleurs: [string, string];
  horaires: string;
  ouverture: CreneauOuverture[];
  plat: string;
  tags: string[];
  envies: EnvieLieu[];
  reservable: boolean;
  telephone: string | null;
  siteWeb: string | null;
  instagram: string | null;
  decouvertPar: string | null;
  statut: StatutLieu;
  note: string | null;
} & InfosPratiquesLieu;

export type Lieu = SaisieLieu & { id: number; creeLe: string; modifieLe: string };

export type ResumeLieu = Pick<Lieu, "id" | "nom" | "type" | "emoji" | "info" | "quartier" | "ville" | "statut" | "couleurs" | "modifieLe" | "adresse" | "latitude" | "longitude"> & {
  _count: { publications: number };
  /** Ce qui manque à la fiche pour être complète (vide : complète), voir POINTS_FICHE */
  manques: string[];
};

export const listerLieux = (recherche = "", statut = "") => appeler<ResumeLieu[]>("GET", `/lieux${parametres({ recherche, statut })}`);
export const lireLieu = (id: number) => appeler<Lieu>("GET", `/lieux/${id}`);
export const enregistrerLieu = (id: number | null, saisie: SaisieLieu) =>
  id ? appeler<Lieu>("PUT", `/lieux/${id}`, { corps: saisie }) : appeler<Lieu>("POST", "/lieux", { corps: saisie });
export type ResultatAdresse = { libelle: string; nom: string; ville: string; codePostal: string; latitude: number; longitude: number; score: number };
/** Adresses trouvées par le service public de géocodage (IGN), pour remplir les coordonnées d'un lieu */
export const chercherAdresse = (adresse: string) => appeler<ResultatAdresse[]>("GET", `/geocodage${parametres({ adresse })}`);
/** Ce qu'on peut changer d'un coup sur plusieurs fiches */
export type ModificationLot = Partial<Pick<SaisieLieu, "statut" | "ville" | "quartier" | "type" | "prix" | "reservable">>;
export const modifierLieuxEnLot = (ids: number[], modification: ModificationLot) =>
  appeler<{ ok: true; nombre: number }>("POST", "/lieux/lot", { corps: { ids, action: "modifier", modification } });
export const supprimerLieuxEnLot = (ids: number[]) =>
  appeler<{ ok: true; nombre: number }>("POST", "/lieux/lot", { corps: { ids, action: "supprimer" } });
export const supprimerLieu = (id: number) => appeler<{ ok: true }>("DELETE", `/lieux/${id}`);

/** Tout ce qui concerne un lieu : publications, signalements reçus, BIG SOS, missions d'ambassadeurs, demande d'origine */
export type HistoriqueLieu = {
  publications: { id: number; legende: string; statut: string; suspendue: boolean; publieeLe: string | null; auteurType: string; auteurPseudo: string | null }[];
  signalements: { id: number; cibleId: string; raison: string; statut: string; creeLe: string }[];
  bigSos: { id: number; statut: string; phase: string; debutLe: string | null; finLe: string | null; creeLe: string; objectifTitre: string | null; objectifCible: number | null; objectifAtteint: number }[];
  missions: { id: number; titre: string; statut: string; faiteLe: string | null; compteRendu: string | null; creeLe: string; compte: { id: number; prenom: string } }[];
  demandes: { id: number; origine: string; creeLe: string; statut: string }[];
};
export const lireHistoriqueLieu = (id: number) => appeler<HistoriqueLieu>("GET", `/lieux/${id}/historique`);

/** Un lieu tel que le contrôle le montre */
export type LieuControle = Pick<Lieu, "id" | "nom" | "ville" | "adresse" | "latitude" | "longitude" | "statut" | "emoji">;
export type ControleLieux = {
  /** Loin des autres lieux de leur ville (plus de 10 km), ou posés en (0, 0) : distance null */
  positionsDouteuses: { id: number; distanceKm: number | null; lieu: LieuControle }[];
  doublons: { raison: "meme-nom" | "meme-adresse" | "meme-nom-proche"; lieux: LieuControle[] }[];
};
export const lireControleLieux = () => appeler<ControleLieux>("GET", "/lieux/controle");
/** Lieux déjà en base qui ressemblent à une fiche pas encore créée (demande à accepter, import) */
export const chercherLieuxSemblables = (fiche: { nom: string; ville: string; adresse?: string | null; latitude?: number | null; longitude?: number | null }) =>
  appeler<LieuControle[]>("GET", `/lieux/semblables${parametres({
    nom: fiche.nom, ville: fiche.ville, adresse: fiche.adresse ?? "",
    latitude: fiche.latitude?.toString() ?? "", longitude: fiche.longitude?.toString() ?? "",
  })}`);

/** Aperçu d'un import : chaque ligne valable (ou le champ qui ne va pas), et ses doublons (en base, ou lignes du fichier) */
export type LigneImportVerifiee = { ok: boolean; champ?: string; semblables: { id: number; nom: string; ville: string }[]; dansLeFichier: number[] };
export const verifierImportLieux = (lieux: Record<string, unknown>[]) => appeler<LigneImportVerifiee[]>("POST", "/lieux/import/verifier", { corps: { lieux } });
/** 50 lignes au plus par appel ; les fiches arrivent en brouillon, placées par leur adresse quand c'est sûr */
export const importerLieux = (lieux: Record<string, unknown>[]) => appeler<{ ok: true; crees: number; placees: number }>("POST", "/lieux/import", { corps: { lieux } });
