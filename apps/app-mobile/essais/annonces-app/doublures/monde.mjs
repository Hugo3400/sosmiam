export const monde = (globalThis.__mondeAnnonces ??= { etat: {}, ecouteurs: new Set(), pousses: [] });

export function changer(partiel) {
  monde.etat = { ...monde.etat, ...partiel };
  for (const ecouteur of [...monde.ecouteurs]) ecouteur();
}

export function ecouter(ecouteur) {
  monde.ecouteurs.add(ecouteur);
  return () => monde.ecouteurs.delete(ecouteur);
}

export const lire = () => monde.etat;
