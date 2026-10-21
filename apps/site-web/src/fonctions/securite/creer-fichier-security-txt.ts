const ADRESSE_SITE = "https://sosmiam.fr";
const JOURS_VALIDITE = 180;

export function creerFichierSecurityTxt(maintenant: Date): string {
  const expiration = new Date(maintenant.getTime() + JOURS_VALIDITE * 24 * 60 * 60 * 1000);
  return [
    `Contact: ${ADRESSE_SITE}/securite`,
    `Expires: ${expiration.toISOString().replace(/\.\d{3}Z$/, "Z")}`,
    "Preferred-Languages: fr, en",
    `Canonical: ${ADRESSE_SITE}/.well-known/security.txt`,
    `Policy: ${ADRESSE_SITE}/securite`,
    `Acknowledgments: ${ADRESSE_SITE}/securite#tableau-d-honneur`,
    "",
  ].join("\n");
}
