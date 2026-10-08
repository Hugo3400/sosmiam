// Ce qu'un lieu a réglé pour valider les visites (logiciel de gestion seulement, jamais par le lieu lui-même).

/** Réglages de validation d'un lieu (posés dans le logiciel de gestion) et son code public de vitrine */
export type ValidationLieu = { lieuId: number; codePublic: string; validationActive: boolean; rayonM: number | null };
