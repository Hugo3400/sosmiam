// Import de fiches de lieux en lot (fichier CSV lu par le logiciel) : vérification ligne par ligne avec les doublons
// (déjà en base, ou deux fois dans le fichier), puis création en brouillon, position trouvée par l'adresse (IGN).
import { baseDeDonnees } from "../../base-de-donnees/connexion.ts";
import { trouverDoublonsLieux } from "../../fonctions/lieux/trouver-doublons-lieux.ts";
import { chercherAdresse } from "./geocodage.ts";
import type { LieuSaisi } from "./lieux.ts";

/** Une adresse trouvée avec moins de confiance n'est pas utilisée (mieux vaut pas de position qu'une fausse) */
const SCORE_MINIMUM = 0.6;
/** Adresses cherchées en même temps (le service de l'IGN est public : on reste raisonnable) */
const EN_MEME_TEMPS = 5;

export type LigneImport = { index: number; fiche: LieuSaisi };

/**
 * Pour chaque ligne valable : les lieux déjà en base qui lui ressemblent, et les autres lignes du fichier qui sont le
 * même lieu (même nom dans la même ville, même adresse, même nom à moins de 1 km).
 */
export async function verifierDoublonsImport(lignes: LigneImport[]) {
  const enBase = await baseDeDonnees.lieu.findMany({ select: { id: true, nom: true, ville: true, adresse: true, latitude: true, longitude: true } });
  // Les lignes du fichier prennent des numéros négatifs (-1 pour la ligne 0…) pour ne pas se mêler aux fiches
  const groupes = trouverDoublonsLieux([...enBase, ...lignes.map(({ index, fiche }) => ({ id: -1 - index, nom: fiche.nom, ville: fiche.ville, adresse: fiche.adresse ?? null, latitude: fiche.latitude ?? null, longitude: fiche.longitude ?? null }))]);
  const parId = new Map(enBase.map((lieu) => [lieu.id, lieu]));
  return new Map(lignes.map(({ index }) => {
    const groupe = groupes.find((g) => g.ids.includes(-1 - index));
    const autres = groupe?.ids.filter((id) => id !== -1 - index) ?? [];
    return [index, {
      semblables: autres.filter((id) => id > 0).map((id) => ({ id, nom: parId.get(id)!.nom, ville: parId.get(id)!.ville })),
      dansLeFichier: autres.filter((id) => id < 0).map((id) => -1 - id),
    }];
  }));
}

/** Crée les fiches en brouillon ; une fiche sans position mais avec une adresse est placée grâce à l'IGN quand c'est sûr. */
export async function importerLieux(fiches: LieuSaisi[], maintenant = new Date()) {
  const jour = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" }).format(maintenant);
  let placees = 0;
  const aPlacer = fiches.filter((fiche) => (fiche.latitude === null || fiche.latitude === undefined) && fiche.adresse);
  for (let debut = 0; debut < aPlacer.length; debut += EN_MEME_TEMPS) {
    await Promise.all(aPlacer.slice(debut, debut + EN_MEME_TEMPS).map(async (fiche) => {
      const [meilleur] = await chercherAdresse(`${fiche.adresse}, ${fiche.ville}`).catch(() => []);
      if (meilleur && meilleur.score >= SCORE_MINIMUM) {
        fiche.latitude = meilleur.latitude;
        fiche.longitude = meilleur.longitude;
        placees++;
      }
    }));
  }
  const { count } = await baseDeDonnees.lieu.createMany({
    data: fiches.map((fiche) => ({ ...fiche, statut: "brouillon", note: `Importée le ${jour} (fichier CSV).` })),
  });
  return { crees: count, placees };
}
