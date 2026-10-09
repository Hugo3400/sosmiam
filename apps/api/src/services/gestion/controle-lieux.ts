// Contrôle des fiches de lieux dans le logiciel de gestion : positions douteuses (loin des autres lieux de leur ville),
// doublons (même nom ou même adresse), et lieux semblables à une nouvelle fiche (demande acceptée, import).
import { baseDeDonnees } from "../../base-de-donnees/connexion.ts";
import { repererPositionsDouteuses } from "../../fonctions/lieux/reperer-positions-douteuses.ts";
import { trouverDoublonsLieux } from "../../fonctions/lieux/trouver-doublons-lieux.ts";

const COMPARABLE = { id: true, nom: true, ville: true, adresse: true, latitude: true, longitude: true, statut: true, emoji: true } as const;

/** Tout le contrôle d'un coup : positions douteuses et groupes de doublons, avec de quoi afficher chaque lieu. */
export async function lireControleLieux() {
  const lieux = await baseDeDonnees.lieu.findMany({ select: COMPARABLE, orderBy: { id: "asc" } });
  const parId = new Map(lieux.map((lieu) => [lieu.id, lieu]));
  return {
    positionsDouteuses: repererPositionsDouteuses(lieux).map((douteux) => ({ ...douteux, lieu: parId.get(douteux.id)! })),
    doublons: trouverDoublonsLieux(lieux).map((groupe) => ({ raison: groupe.raison, lieux: groupe.ids.map((id) => parId.get(id)!) })),
  };
}

/**
 * Les lieux déjà en base qui ressemblent à une fiche pas encore créée (même nom dans la même ville, même adresse, ou
 * même nom à moins de 1 km) : à vérifier avant d'accepter une demande ou d'importer.
 */
export async function chercherLieuxSemblables(fiche: { nom: string; ville: string; adresse: string | null; latitude: number | null; longitude: number | null }) {
  const lieux = await baseDeDonnees.lieu.findMany({ select: COMPARABLE });
  const groupes = trouverDoublonsLieux([...lieux, { id: 0, ...fiche }]);
  const avecLaFiche = groupes.find((groupe) => groupe.ids.includes(0));
  return avecLaFiche ? avecLaFiche.ids.filter((id) => id !== 0).map((id) => lieux.find((lieu) => lieu.id === id)!) : [];
}
