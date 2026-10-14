export type ContexteDroitValidation = {
  lieu: { id: number; validationActive: boolean };
  /** `limiteJusqua` : validations en pause jusqu'à cette date (ISO) */
  compte: { limiteJusqua: string | null; lieuxMembre: readonly number[] };
  maintenantMs: number;
};

/**
 * Ce compte peut-il faire valider une visite chez ce lieu ? Dans l'ordre : le lieu valide les visites, pas de compte en
 * pause, pas de visite chez un lieu dont on fait partie. Une date de pause illisible compte comme une pause en cours
 * (refus par défaut).
 */
export function verifierDroitValidation(
  c: ContexteDroitValidation,
): { ok: true } | { ok: false; erreur: "lieu-sans-validation" | "compte-limite" | "membre-du-lieu" } {
  if (!c.lieu.validationActive) return { ok: false, erreur: "lieu-sans-validation" };
  if (c.compte.limiteJusqua !== null) {
    const finPause = Date.parse(c.compte.limiteJusqua);
    if (Number.isNaN(finPause) || finPause > c.maintenantMs) return { ok: false, erreur: "compte-limite" };
  }
  if (c.compte.lieuxMembre.includes(c.lieu.id)) return { ok: false, erreur: "membre-du-lieu" };
  return { ok: true };
}
