const LIENS_PERMIS = [
  /^\/$/, /^\/explorer$/, /^\/potes$/, /^\/profil$/, /^\/notifications$/, /^\/lieu\/\d{1,9}$/,
  /^\/pro\/comptoir$/, /^\/miam-safe\/partage\/\d{1,9}$/,
  /^\/potes\/messages$/, /^\/potes\/discussion\/\d{1,12}$/, /^\/potes\/sortie\/\d{1,12}$/, /^\/potes\/profil\/[a-z2-9]{10}$/,
];

export function estLienPermis(lien: unknown): lien is string {
  return typeof lien === "string" && LIENS_PERMIS.some((forme) => forme.test(lien));
}
