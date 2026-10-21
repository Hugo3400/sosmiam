export type ChoixHoraires = { principal: string | null; secours: string[] };

export type ChoixHorairesAjuste = ChoixHoraires & { principalParti: string | null; secoursPartis: string[] };

export function ajusterChoixHoraires(choix: ChoixHoraires, disponibles: readonly string[]): ChoixHorairesAjuste {
  const libres = new Set(disponibles);
  if (choix.principal !== null && !libres.has(choix.principal)) {
    return { principal: null, secours: [], principalParti: choix.principal, secoursPartis: [] };
  }
  const secours = choix.secours.filter((heure) => libres.has(heure) && heure !== choix.principal);
  const secoursPartis = choix.secours.filter((heure) => !libres.has(heure));
  return { principal: choix.principal, secours, principalParti: null, secoursPartis };
}
