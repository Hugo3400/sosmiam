import { DUREE_PARTAGE_POSITION_MINUTES } from "../../../../../packages/commun/src/regles/miam-safe.ts";

/**
 * La notification urgente de « Prévenir un pote » : « 🛡 Léa a besoin de toi » / « Léa ne se sent pas en sécurité à « Chez
 * Mo ». Sa position est partagée avec toi pendant 1 h. » Sans position : « Prends vite de ses nouvelles. » Le lien ouvre
 * l'écran du partage dans l'app du pote. Ton sérieux, sans blague, et sans genre (« de ses nouvelles »).
 */
export function ecrireMessagePote(partage: { id: number; prenom: string; nomLieu: string | null; avecPosition: boolean }) {
  const ou = partage.nomLieu ? ` à « ${partage.nomLieu} »` : "";
  const suite = partage.avecPosition
    ? ` Sa position est partagée avec toi pendant ${DUREE_PARTAGE_POSITION_MINUTES / 60} h.`
    : " Prends vite de ses nouvelles.";
  return {
    titre: `🛡 ${partage.prenom} a besoin de toi`,
    texte: `${partage.prenom} ne se sent pas en sécurité${ou}.${suite}`,
    lien: `/miam-safe/partage/${partage.id}`,
    urgent: true,
  };
}
