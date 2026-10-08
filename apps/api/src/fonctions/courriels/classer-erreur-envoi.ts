/** Ce qu'on fait d'un envoi raté : réessayer plus tard, abandonner ce destinataire, ou arrêter tout (réglages faux). */
export type SuiteErreurEnvoi = "reessayer" | "echec" | "configuration";

/**
 * Classe une erreur de nodemailer. Identifiants refusés ou expéditeur interdit : ce sont les réglages, pas le mail.
 * Code 5xx sur un destinataire : adresse refusée pour de bon. Le reste (réseau, 4xx, délai) : on réessaiera.
 */
export function classerErreurEnvoi(erreur: { code?: string; responseCode?: number; command?: string }): SuiteErreurEnvoi {
  if (erreur.code === "EAUTH" || erreur.code === "ENOAUTH") return "configuration";
  const code = erreur.responseCode ?? 0;
  if (code >= 500 && code < 600) {
    // Refus à « MAIL FROM » : l'expéditeur n'est pas autorisé sur cette boîte, tous les mails seraient refusés
    if (erreur.command === "MAIL FROM" || code === 535 || code === 530) return "configuration";
    return "echec";
  }
  return "reessayer";
}
