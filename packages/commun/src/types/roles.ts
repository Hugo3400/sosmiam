// Rôles d'un compte (ambassadeur, équipe d'un lieu) et modes de l'app qu'ils ouvrent.

export type StatutAmbassadeur = "en-attente" | "actif" | "refuse" | "suspendu";

export type RoleLieu = "gerant" | "equipe";

export type LieuGere = { id: number; nom: string; emoji: string; role: RoleLieu };

/** Rôles relus par le serveur à chaque demande ; changer de mode dans l'app ne donne aucun droit */
export type RolesCompte = { ambassadeur: StatutAmbassadeur | null; pro: LieuGere[] };

export type ModeApp = "perso" | "pro" | "ambassadeur";
