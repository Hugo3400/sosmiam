const DUREE_APRES_GLISSEMENT_MS = 400;

let glisseLe = 0;

export function noterGlissementReponse(): void {
  glisseLe = Date.now();
}

export function estGlissementReponseRecent(): boolean {
  return Date.now() - glisseLe < DUREE_APRES_GLISSEMENT_MS;
}
