// Doublure de stockage/profil-local.ts : le profil gardé dans globalThis.__disque, chaque écriture notée dans
// globalThis.__ecritures. globalThis.__delaiEcriture : délai de chaque écriture (ms).
export async function enregistrerProfilLocal(profil) {
  const delai = globalThis.__delaiEcriture ?? 0;
  if (delai) await new Promise((r) => setTimeout(r, delai));
  (globalThis.__ecritures ??= []).push(profil);
  globalThis.__disque = profil;
}

export async function effacerProfilLocal() {
  globalThis.__disque = null;
}

export async function lireProfilLocal() {
  return globalThis.__disque ?? null;
}
