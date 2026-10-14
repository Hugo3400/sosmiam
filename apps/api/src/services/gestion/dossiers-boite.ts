// Les dossiers de la boîte mail lus par le logiciel de gestion (sans base de données : les contrôleurs s'en servent).
/** reçus (INBOX), envoyés (copies rangées par l'API et mails écrits du webmail), indésirables */
export type DossierBoite = "recus" | "envoyes" | "indesirables";
export const DOSSIERS_BOITE: readonly DossierBoite[] = ["recus", "envoyes", "indesirables"];
