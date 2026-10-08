// Format signé par le logiciel de gestion : le même que apps/logiciel-gestion/src/fonctions/securite/construire-message-gestion.ts
// (un test de chaque côté vérifie le même exemple). Toute modification doit être faite des deux côtés en même temps.
export type DemandeSignee = {
  methode: string;
  /** Chemin après « /api-gestion », avec ses paramètres : « /newsletter/inscrits?page=2 » */
  chemin: string;
  horodatage: string;
  nonce: string;
  session: string | null;
  /** SHA-256 du corps de la demande, en hexadécimal (celui d'un corps vide s'il n'y en a pas) */
  empreinteCorps: string;
};

/** Texte exact que le logiciel signe avec sa clé, et que l'API vérifie. */
export function construireMessageGestion(demande: DemandeSignee): string {
  return [
    "SOSMIAM-GESTION-1",
    demande.methode.toUpperCase(),
    demande.chemin,
    demande.horodatage,
    demande.nonce,
    demande.session ?? "-",
    demande.empreinteCorps,
  ].join("\n");
}
