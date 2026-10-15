// Doublure de services/demo/demo-visites-active.ts : le mode démo, éteint tant qu'un essai ne l'allume pas (allumerDemo).
// Le vrai module le lit une fois au lancement ; le moteur, lui, le relit à chaque geste : un essai l'allume avant de
// monter le moteur, et c'est tout (demo.test.mjs, dans son propre processus).
export const CLE_MODE_DEMO = "sosmiam.mode-demo";
export let DEMO_POSSIBLE = false;
export let DEMO_VISITES_ACTIVE = false;

export function allumerDemo(oui = true) {
  DEMO_POSSIBLE = oui;
  DEMO_VISITES_ACTIVE = oui;
}
