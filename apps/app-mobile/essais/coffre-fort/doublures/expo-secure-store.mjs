export const AFTER_FIRST_UNLOCK = "AFTER_FIRST_UNLOCK";
export const AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY = "AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY";
export const WHEN_UNLOCKED = "WHEN_UNLOCKED";
export const WHEN_UNLOCKED_THIS_DEVICE_ONLY = "WHEN_UNLOCKED_THIS_DEVICE_ONLY";

const coffre = () => (globalThis.__coffre ??= new Map());
const noter = (operation, cle, options) => (globalThis.__journalCoffre ??= []).push({ operation, cle, options });

export async function getItemAsync(cle) {
  noter("lire", cle);
  return coffre().has(cle) ? coffre().get(cle).valeur : null;
}

export async function setItemAsync(cle, valeur, options = {}) {
  noter("ecrire", cle, options);
  coffre().set(cle, { valeur, accessible: options.keychainAccessible ?? WHEN_UNLOCKED });
}

export async function deleteItemAsync(cle) {
  noter("effacer", cle);
  coffre().delete(cle);
}

export function getItem(cle) {
  noter("lire", cle);
  return coffre().has(cle) ? coffre().get(cle).valeur : null;
}

export function setItem(cle, valeur, options = {}) {
  noter("ecrire", cle, options);
  coffre().set(cle, { valeur, accessible: options.keychainAccessible ?? WHEN_UNLOCKED });
}
