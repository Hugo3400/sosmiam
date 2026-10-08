import type { PositionLieu } from "@sos-miam/commun/types/lieu";
import type { LieuExplorer } from "~/fonctions/lieux/trier-lieux-explorer";

// Même contrat que CarteLieux.tsx (iPhone et Android) : à garder identique
type Props = {
  /** Lieux filtrés et triés (seuls ceux qui ont une position s'affichent) */
  lieux: LieuExplorer[];
  /** Ville à montrer : celle choisie dans les filtres, sinon la tienne (partout en France) ; null si on ne la connaît pas (on montre alors nos lieux) */
  centre: PositionLieu | null;
  /** « Autour de moi » (sinon null) */
  position: PositionLieu | null;
  /** Id du lieu sélectionné */
  selection: number | null;
  onSelection: (id: number | null) => void;
  /** Place prise en haut par la recherche et les filtres (pour cadrer) */
  margeHaut: number;
  /** Place prise en bas par la feuille de liste, la barre d'onglets (ou le clavier) sous elle (pour cadrer) */
  margeBas: number;
};

/**
 * Aperçu web : pas de carte (react-native-maps n'existe que sur iPhone et Android, et n'est jamais chargé ici).
 * L'écran garde sa recherche, ses filtres et sa liste ; Metro prend ce fichier à la place de CarteLieux.tsx sur le web.
 */
export function CarteLieux(_props: Props) {
  return null;
}
