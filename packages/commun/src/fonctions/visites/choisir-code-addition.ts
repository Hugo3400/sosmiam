const CODES_POSSIBLES = 10_000;
const ESSAIS_MAX = 50;

/**
 * Tire le code à 4 chiffres d'une addition demandée (« 0427 »), différent des codes déjà en attente chez le lieu.
 * Le hasard est passé en paramètre : `tirer(max)` rend un entier de 0 à max − 1. Un tirage hors bornes compte comme
 * un essai raté. Au bout de 50 essais sans code libre, lève une erreur.
 */
export function choisirCodeAddition(codesPris: ReadonlySet<string>, tirer: (max: number) => number): string {
  for (let essai = 0; essai < ESSAIS_MAX; essai++) {
    const nombre = tirer(CODES_POSSIBLES);
    if (!Number.isInteger(nombre) || nombre < 0 || nombre >= CODES_POSSIBLES) continue;
    const code = String(nombre).padStart(4, "0");
    if (!codesPris.has(code)) return code;
  }
  throw new Error(`Aucun code d'addition libre après ${ESSAIS_MAX} essais`);
}
