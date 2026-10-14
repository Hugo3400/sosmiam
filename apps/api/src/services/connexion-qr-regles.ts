// Connexion par QR code (décidé le 14 octobre 2026) : ce que les routes demandent aux données, sans rien importer qui
// touche à la base (le double en mémoire s'en sert aussi). La base : connexion-qr.ts ; la mémoire : connexion-qr-en-memoire.ts.
// Contrat des adresses : routes/connexion-qr.ts.

/** Un QR vit 2 minutes */
export const DUREE_QR = 2 * 60_000;
/** Après le scan, l'app a 60 secondes pour accepter (et toujours avant la fin du QR) */
export const FENETRE_REPONSE_QR = 60_000;
/** Une demande acceptée juste avant la fin du QR se récupère encore pendant ce temps (l'appareil interroge toutes les 2 s) */
export const RATTRAPAGE_ACCEPTEE_QR = 30_000;
/** La réponse « accepte » s'est perdue : le même secret qui revient dans les 30 s après la PREMIÈRE remise reçoit une
 * nouvelle session (l'ancienne est révoquée) */
export const FENETRE_RELANCE_QR = 30_000;
/** Au plus 3 sessions remises pour une même demande (la première et deux relances) */
export const REMISES_MAX_QR = 3;
/** Le ménage de nuit efface les demandes expirées depuis plus d'un jour */
export const GARDE_APRES_EXPIRATION_QR = 24 * 60 * 60_000;

export type CibleQr = "site" | "app";
export type OrigineQr = "sosmiam.fr" | "ambassadeur.sosmiam.fr" | "pro.sosmiam.fr" | "app";
/** « utilisee » : la session a été donnée (relançable 30 s, 3 remises au plus : voir choisirRemiseQr) */
export type StatutQr = "attente" | "scanne" | "accepte" | "refuse" | "utilisee";

export type DemandeQr = {
  id: number;
  cible: CibleQr;
  origine: OrigineQr;
  appareil: string;
  statut: StatutQr;
  /** Le compte qui a scanné (puis accepté), ou null */
  compteId: number | null;
  creeLe: number;
  expireLe: number;
  scanneLe: number | null;
  reponduLe: number | null;
};

export type NouvelleDemandeQr = Pick<DemandeQr, "cible" | "origine" | "appareil" | "creeLe" | "expireLe"> & {
  codeEmpreinte: string;
  secretEmpreinte: string;
};

/** Chaque écriture est atomique : vrai seulement si la demande était bien dans l'état attendu (sinon rien ne change). */
export type ServicesConnexionQr = {
  creer: (demande: NouvelleDemandeQr) => Promise<void>;
  lireParCode: (codeEmpreinte: string) => Promise<DemandeQr | null>;
  lireParSecret: (secretEmpreinte: string) => Promise<DemandeQr | null>;
  /** « attente » → « scanne » par ce compte */
  noterScan: (id: number, compteId: number, maintenant: number) => Promise<boolean>;
  /** « scanne » par ce compte → « accepte » ou « refuse » */
  repondre: (id: number, compteId: number, accepte: boolean, maintenant: number) => Promise<boolean>;
  /**
   * Remet LA session (jeton déjà tiré, seule son empreinte arrive ici) : « accepte » → « utilisee », ou relance dans les 30 s
   * après la première remise (3 au plus) : la session remise avant est révoquée. Tout d'un bloc, sous verrou : de deux appels
   * simultanés, jamais deux sessions valables à la fin. Faux (rien n'est créé) si la demande ne permet pas de remise.
   */
  remettre: (id: number, empreinteSession: string, maintenant: number) => Promise<boolean>;
};
