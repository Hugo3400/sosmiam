// Couleurs des dessins de marque (kit de marque SOS Miam), en dur pour que les SVG gardent
// leurs couleurs partout. Les cinq premières sont celles du thème (styles/app.css) ;
// elles rejoindront packages/commun/src/theme avec le reste du thème.
export const couleursMarque = {
  jaune: "#FFD60A",
  jauneClair: "#FFF1A8",
  creme: "#FFF8E7",
  encre: "#1A1A1A",
  tomate: "#FF4D3D",
  blanc: "#FFFFFF",
  /** Ombre de la bouée */
  jauneOmbre: "#F0B400",
  /** Pointes du ruban de l'écusson */
  tomateFonce: "#C93424",
} as const;
