// Le seul endroit qui dit si la démo des visites est allumée : en développement, ou avec EXPO_PUBLIC_DEMO_VISITES=1
// (valeur figée à la compilation, jamais un réglage caché). Lu par choisirServices (services de démo) et par
// FournisseurModes (rôles joués dans les Coulisses) : les deux doivent toujours être d'accord.

/** Vrai si la démo des visites (faux serveur local, rôles de démo) est allumée dans cette version de l'app */
export const DEMO_VISITES_ACTIVE = __DEV__ || process.env.EXPO_PUBLIC_DEMO_VISITES === "1";
