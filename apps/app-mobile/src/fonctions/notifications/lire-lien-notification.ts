/** Les écrans qu'une notification peut ouvrir (le « lien » posé par le serveur) : jamais une adresse inventée ou externe */
const LIENS_PERMIS = [
  /^\/$/, /^\/explorer$/, /^\/potes$/, /^\/profil$/, /^\/notifications$/, /^\/lieu\/\d{1,9}$/,
  // Miam Safe : l'alerte silencieuse au comptoir (équipe du lieu) et « Prévenir un pote » (le partage de position)
  /^\/pro\/comptoir$/, /^\/miam-safe\/partage\/\d{1,9}$/,
];

/** Le lien d'une notification touchée (data.lien), s'il mène à un écran connu ; sinon null (on ouvre l'app, c'est tout). */
export function lireLienNotification(donnees: unknown): string | null {
  const lien = typeof donnees === "object" && donnees !== null ? (donnees as Record<string, unknown>).lien : null;
  return typeof lien === "string" && LIENS_PERMIS.some((forme) => forme.test(lien)) ? lien : null;
}
