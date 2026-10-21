const LIENS_PERMIS = [
  /^\/$/, /^\/explorer$/, /^\/potes$/, /^\/profil$/, /^\/notifications$/, /^\/lieu\/\d{1,9}$/,
  /^\/pro\/comptoir$/, /^\/pro\/reservations$/, /^\/miam-safe\/partage\/\d{1,9}$/, /^\/reservations$/,
  /^\/potes\/messages$/, /^\/potes\/discussion\/\d{1,12}$/, /^\/potes\/sortie\/\d{1,12}$/, /^\/potes\/profil\/[a-z2-9]{10}$/,
  /^\/potes\/miamis\/sortie\/\d{1,12}$/, /^\/potes\/miamis\/idee\/\d{1,12}$/, /^\/potes\/miamis\/qui-est-la$/,
];

export function estLienPermis(lien: unknown): lien is string {
  return typeof lien === "string" && LIENS_PERMIS.some((forme) => forme.test(lien));
}
