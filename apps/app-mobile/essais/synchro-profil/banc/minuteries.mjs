// Les minuteries du moteur (nouvel essai dans 30 s, 2 min, 10 min, ou ce que dit Retry-After) ne partent jamais seules :
// elles attendent qu'un essai les déclenche (declencher). Les courtes, sous la seconde (pauses du banc, délais des
// doublures), restent de vraies minuteries. Branché dès l'import, pour tout le fichier d'essais.
const vraiSetTimeout = globalThis.setTimeout;
const vraiClearTimeout = globalThis.clearTimeout;

/** Les minuteries longues pas encore déclenchées ni annulées */
let enAttente = [];
/** Les délais de toutes les minuteries longues posées, même annulées depuis */
let posees = [];

globalThis.setTimeout = (fonction, ms, ...args) => {
  if (ms >= 1000) {
    const minuterie = { faux: true, fonction, ms };
    enAttente.push(minuterie);
    posees.push(ms);
    return minuterie;
  }
  return vraiSetTimeout(fonction, ms, ...args);
};
globalThis.clearTimeout = (minuterie) => {
  if (minuterie?.faux) {
    enAttente = enAttente.filter((m) => m !== minuterie);
    return;
  }
  return vraiClearTimeout(minuterie);
};

/** Une vraie pause, en millisecondes : le temps que les réponses des doublures arrivent */
export const pause = (ms = 0) => new Promise((r) => vraiSetTimeout(r, ms));

/** Oublie toutes les minuteries longues (au début de chaque essai) */
export function oublierMinuteries() {
  enAttente = [];
  posees = [];
}

/** Les délais des minuteries longues qui attendent encore */
export const lireMinuteriesEnAttente = () => enAttente.map((m) => m.ms);

/** Les délais de toutes les minuteries longues posées depuis le dernier oubli, annulées comprises */
export const lireMinuteriesPosees = () => [...posees];

/** Déclenche la plus ancienne minuterie qui attend, puis laisse `attente` ms aux réponses */
export async function declencher(attente = 40) {
  const minuterie = enAttente.shift();
  if (minuterie) minuterie.fonction();
  await pause(attente);
}
