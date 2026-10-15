export const monde = (globalThis.__mondeMiamSafe ??= { etat: {}, ecouteurs: new Set() });

export function changer(partiel) {
  monde.etat = { ...monde.etat, ...partiel };
  for (const ecouteur of [...monde.ecouteurs]) ecouteur();
}

export function ecouter(ecouteur) {
  monde.ecouteurs.add(ecouteur);
  return () => monde.ecouteurs.delete(ecouteur);
}

export const lire = () => monde.etat;
