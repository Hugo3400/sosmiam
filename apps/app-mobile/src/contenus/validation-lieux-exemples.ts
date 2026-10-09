// Réglages de validation des lieux d'exemple (démo des visites). En vrai, ils sont posés par l'équipe dans le logiciel de
// gestion. Tous les lieux valident les visites, sauf les deux lieux non vérifiés (sans compte SOS Miam) : Les Zézettes de
// Ginette (10) et Les Oreillettes de Bernadette (15).
// Le code public (8 caractères a-z et 2-9) est celui du QR de vitrine : sosmiam.fr/l/<code> ouvre la fiche, rien de plus.
import type { ValidationLieu } from "@sos-miam/commun/types/validation-lieu";

const valide = (lieuId: number, codePublic: string, validationActive = true): ValidationLieu => ({
  lieuId,
  codePublic,
  validationActive,
  rayonM: null,
});

export const validationLieuxExemples: Readonly<Record<number, ValidationLieu>> = {
  0: valide(0, "nonnalia"),
  1: valide(1, "sucregar"),
  2: valide(2, "figuepre"),
  3: valide(3, "baosmei2"),
  4: valide(4, "chourieu"),
  5: valide(5, "verretor"),
  6: valide(6, "pagaiesl"),
  7: valide(7, "cleruell"),
  8: valide(8, "gadoueci"),
  9: valide(9, "tiellepe"),
  10: valide(10, "zezettes", false),
  11: valide(11, "patesluc"),
  12: valide(12, "paddlefl"),
  13: valide(13, "cabanemi"),
  14: valide(14, "tapasfer"),
  15: valide(15, "oreillet", false),
  16: valide(16, "toqueslg"),
  17: valide(17, "copainsm"),
  18: valide(18, "bouiboui"),
};
