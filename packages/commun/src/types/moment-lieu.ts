// Ce que l'équipe d'un lieu voit et règle « pour ce soir » : son SOS « place ce soir » et son message du moment.

export type SosDuJour = {
  places: number;
  offre: string | null;
  jusqua: string;
  lanceLe: string;
  /** Le prénom du membre de l'équipe qui l'a lancé (null s'il a supprimé son compte depuis) */
  lancePar: string | null;
  arreteLe: string | null;
  /** Ni arrêté, ni fini */
  enCours: boolean;
};

export type MomentLieu = {
  /** Le SOS lancé aujourd'hui (même arrêté ou fini) ; null : aucun aujourd'hui */
  sos: SosDuJour | null;
  /** Un SOS peut encore être lancé aujourd'hui (un par jour) */
  sosPossible: boolean;
  /** La fermeture de ce soir d'après les horaires du lieu ; null : inconnue (il faut dire jusqu'à quand) */
  fermeture: string | null;
  /** jusqua null : posé sans fin (par l'équipe SOS Miam) */
  message: { texte: string; jusqua: string | null } | null;
};
