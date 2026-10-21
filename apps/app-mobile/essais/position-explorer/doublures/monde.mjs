export const monde = (globalThis.__mondePosition ??= { profil: null, rendre: null, lectures: [], appelsLecture: 0, effacements: [], attenteEffacement: 0 });

export function changerProfil(profil) {
  monde.profil = profil;
  monde.rendre?.();
}
