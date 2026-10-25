const COULEUR = /^#[0-9a-f]{3,8}$/i;
const COULEURS_SOS_MIAM: [string, string] = ["#FFD60A", "#FF4D3D"];

export function choisirCouleursLieu(couleurs: readonly string[]): [string, string] {
  const [debut, fin] = couleurs;
  return debut && fin && couleurs.every((couleur) => COULEUR.test(couleur)) ? [debut, fin] : COULEURS_SOS_MIAM;
}
