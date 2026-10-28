export const MARQUE = "sosmiam.installation";
export const MARQUE_A_JOUR = "appareil-seul";
export const MARQUE_D_AVANT = "1";

export const SESSION = "sosmiam.session";
export const CODE_INVITATION = "sosmiam.code-invitation";
export const PROFIL = "sosmiam.profil";
export const VERROU_AGE = "sosmiam.verrou-age";

export const JETON_D_AVANT = "jeton-de-la-personne-d-avant-0123456789";
export const JETON_NEUF = "jeton-tout-neuf-de-cette-installation-42";
export const CODE_D_AVANT = "k7mq2x9pa4vt";
export const VERROU = "2099-01-01";
export const PROFIL_D_AVANT = {
  prenom: "Léa",
  pseudo: "lea.croque",
  dateNaissance: "1995-01-01",
  ville: "Montpellier",
  envies: { lieux: ["cafes"] },
  creeLe: "2026-10-01T00:00:00.000Z",
};

export const APPAREIL_SEUL = "AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY";

export function remplirCoffre() {
  const coffre = (globalThis.__coffre = new Map());
  coffre.set(SESSION, { valeur: JETON_D_AVANT, accessible: "AFTER_FIRST_UNLOCK" });
  coffre.set(CODE_INVITATION, { valeur: CODE_D_AVANT, accessible: "WHEN_UNLOCKED" });
  coffre.set(PROFIL, { valeur: JSON.stringify(PROFIL_D_AVANT), accessible: "WHEN_UNLOCKED" });
  coffre.set(VERROU_AGE, { valeur: VERROU, accessible: "WHEN_UNLOCKED" });
  globalThis.__journalCoffre = [];
  return coffre;
}

export function remplirMagasin(marque) {
  const magasin = (globalThis.__magasin = new Map());
  if (marque !== undefined) magasin.set(MARQUE, marque);
  magasin.set("sosmiam.invite", "1");
  globalThis.__journalMagasin = [];
  return magasin;
}

export const effacements = () => (globalThis.__journalCoffre ?? []).filter((e) => e.operation === "effacer").map((e) => e.cle).sort();
export const ecritures = () => (globalThis.__journalCoffre ?? []).filter((e) => e.operation === "ecrire");
