// Les raccourcis clavier du logiciel, dans l'ordre de la fenêtre d'aide (F1).
import { MENU } from "./menu.ts";

/** Les 9 premiers écrans du menu, dans l'ordre : Ctrl+1 à Ctrl+9 */
export const ECRANS_RACCOURCIS = MENU.flatMap((groupe) => groupe.entrees).slice(0, 9);

export const RACCOURCIS: { touches: string; action: string }[] = [
  { touches: "Ctrl + K", action: "Rechercher partout (lieu, compte, publication, BIG SOS, écran…)" },
  ...ECRANS_RACCOURCIS.map((entree, i) => ({ touches: `Ctrl + ${i + 1}`, action: entree.libelle })),
  { touches: "Ctrl + ,", action: "Réglages" },
  { touches: "Ctrl + L", action: "Verrouiller le logiciel" },
  { touches: "F1", action: "Cette aide" },
  { touches: "Échap", action: "Fermer une fenêtre" },
  { touches: "Ctrl + B, I, U, K", action: "Dans l'éditeur : gras, italique, souligné, lien" },
];
