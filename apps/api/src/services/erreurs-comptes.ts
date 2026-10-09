// Erreurs des services des comptes que les contrôleurs reconnaissent (sans rien importer qui touche à la base : le double
// en mémoire s'en sert aussi).

/** Le pseudo demandé à l'inscription « app » est déjà celui d'un autre compte (409 « pseudo-pris ») */
export class PseudoDejaPris extends Error {
  constructor() {
    super("Pseudo déjà pris");
    this.name = "PseudoDejaPris";
  }
}
