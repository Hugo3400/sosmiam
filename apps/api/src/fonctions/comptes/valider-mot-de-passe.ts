// Règles figées le 8 octobre 2026 (docs/decisions.md), complétées après la relecture : 12 à 128 caractères, aucune règle
// de composition (une petite phrase marche très bien), mais 16 chiffres au moins s'il n'y a que des chiffres ; pas un mot
// de passe courant (même entouré de chiffres ou de signes), ni une suite, ni un petit motif répété, ni l'e-mail ou ce qui
// précède son « @ ». Ça suffit (cas 2 de la délibération CNIL 2022-100) parce que l'API impose en plus une attente par
// compte après plusieurs échecs (controleurs/comptes-attente.ts).

/**
 * Mots de passe courants de 12 caractères ou plus (les plus courts sont déjà refusés), en français et en anglais :
 * suites du clavier, « motdepasse123 »… Écrits en minuscules et sans espaces, comme le mot de passe comparé.
 */
const MOTS_DE_PASSE_COURANTS = new Set([
  "123456789012", "1234567890123", "12345678901234", "1234567890123456", "123456789123", "123412341234", "123123123123",
  "121212121212", "111111111111", "000000000000", "1q2w3e4r5t6y", "1qaz2wsx3edc", "q1w2e3r4t5y6", "a1z2e3r4t5y6",
  "qwertyuiop12", "qwertyuiop123", "qwerty123456", "123456qwerty", "qwertyqwerty", "azertyuiop12", "azertyuiop123",
  "azerty123456", "123456azerty", "azertyazerty", "azertyuiopqsdfghjklm", "aaaaaaaaaaaa", "abcdefghijkl", "abcdefgh1234",
  "abc123abc123", "password1234", "password12345", "password123456", "passwordpassword", "passw0rd1234", "motdepasse12",
  "motdepasse123", "motdepasse1234", "monmotdepasse", "motdepassemotdepasse", "jetaimejetaime", "iloveyou1234",
  "iloveyouiloveyou", "bonjour12345", "bonjourbonjour", "soleil123456", "doudou123456", "chocolat1234", "loulou123456",
  "football1234", "princess1234", "sunshine1234", "superman1234", "welcome12345", "letmein12345", "starwars1234",
  "pokemon12345", "trustno1trustno1", "sosmiam12345", "sosmiam123456", "sosmiamsosmiam", "ambassadeur1", "ambassadeur123",
  // Refusés aussi entourés de chiffres ou de signes (« Motdepasse2026! », « azertyuiop1234 »)
  "motdepasse", "password", "azerty", "azertyuiop", "qwerty", "qwertyuiop", "jetaime", "iloveyou", "bonjour", "soleil",
  "doudou", "chocolat", "loulou", "football", "princess", "sunshine", "superman", "welcome", "letmein", "starwars",
  "pokemon", "sosmiam", "ambassadeur",
]);

/** Suites des chiffres, de l'alphabet et des claviers, dans les deux sens, assez longues pour 128 caractères */
const SUITES = [
  "0123456789", "abcdefghijklmnopqrstuvwxyz", "azertyuiopqsdfghjklmwxcvbn", "qwertyuiopasdfghjklzxcvbnm",
  "1q2w3e4r5t6y7u8i9o0p", "q1w2e3r4t5y6u7i8o9p0", "a1z2e3r4t5y6u7i8o9p0", "1qaz2wsx3edc4rfv5tgb6yhn7ujm8ik9ol0p",
].flatMap((suite) => [suite, [...suite].reverse().join("")].map((sens) => sens.repeat(Math.ceil(140 / sens.length))));

/** Mot de passe courant, ce qui précède le « @ » de l'e-mail, petit motif répété (« aaaa… », « 1212… ») ou suite */
function estEvident(texte: string, avantArobase: string): boolean {
  if (texte.length < 6) return false;
  return MOTS_DE_PASSE_COURANTS.has(texte) || texte === avantArobase
    || [1, 2, 3, 4].some((n) => texte.length >= 3 * n && texte.slice(n) === texte.slice(0, -n))
    || SUITES.some((suite) => suite.includes(texte));
}

/**
 * Vrai si le mot de passe peut être choisi : 12 à 128 caractères une fois normalisé (NFC, un emoji compte pour un),
 * pas fait que d'espaces, 16 chiffres au moins s'il n'a que des chiffres (CNIL, cas 2, exemple 3), différent de l'e-mail,
 * et rien d'évident (sans tenir compte des majuscules ni des espaces, puis sans les signes, puis sans les chiffres du
 * début et de la fin) : ni un mot de passe courant, ni une suite, ni un petit motif répété, ni ce qui précède le « @ ».
 */
export function validerMotDePasse(motDePasse: string, email: string): boolean {
  const normalise = motDePasse.normalize("NFC");
  const longueur = [...normalise].length;
  if (longueur < 12 || longueur > 128) return false;
  const minuscules = normalise.toLowerCase();
  const sansEspaces = minuscules.replace(/\s+/g, "");
  const adresse = email.trim().toLowerCase();
  if (sansEspaces === "" || minuscules.trim() === adresse) return false;
  const sansSignes = sansEspaces.replace(/[\p{P}\p{S}]+/gu, "");
  // Que des chiffres (espaces et signes n'y changent presque rien : « 06 12 34… », « 08/10/2026… ») : 16 au moins
  if (/^\p{Nd}{1,15}$/u.test(sansSignes)) return false;
  const coeur = sansSignes.replace(/^\p{N}+|\p{N}+$/gu, "");
  const avantArobase = adresse.split("@")[0].replace(/[\p{P}\p{S}]+/gu, "");
  return ![sansEspaces, sansSignes, coeur].some((texte) => estEvident(texte, avantArobase));
}
