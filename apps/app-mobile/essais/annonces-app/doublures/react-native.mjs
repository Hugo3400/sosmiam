const ecouteurs = new Set();

export const AppState = {
  currentState: "active",
  addEventListener(_type, ecouteur) {
    ecouteurs.add(ecouteur);
    return { remove: () => ecouteurs.delete(ecouteur) };
  },
  changerPourEssai(etat) {
    AppState.currentState = etat;
    for (const ecouteur of [...ecouteurs]) ecouteur(etat);
  },
};

export const Platform = { OS: "android", select: (choix) => choix.android ?? choix.default };
