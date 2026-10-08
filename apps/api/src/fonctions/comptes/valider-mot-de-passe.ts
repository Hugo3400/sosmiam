// Règles figées le 8 octobre 2026 (docs/decisions.md) : 12 à 128 caractères, aucune règle de composition (une petite
// phrase marche très bien), pas un mot de passe parmi les plus courants, pas l'e-mail. Ça suffit (cas 2 de la
// délibération CNIL 2022-100) parce que l'API impose en plus une attente par compte après plusieurs échecs.

/**
 * Mots de passe courants de 12 caractères ou plus (les plus courts sont déjà refusés), en français et en anglais :
 * suites du clavier, « motdepasse123 »… Écrits en minuscules et sans espaces, comme le mot de passe comparé.
 */
const MOTS_DE_PASSE_COURANTS = new Set([
  "123456789012", "1234567890123", "12345678901234", "123456789123", "123412341234", "123123123123", "121212121212",
  "111111111111", "000000000000", "1q2w3e4r5t6y", "1qaz2wsx3edc", "q1w2e3r4t5y6", "a1z2e3r4t5y6", "qwertyuiop12",
  "qwertyuiop123", "qwerty123456", "123456qwerty", "qwertyqwerty", "azertyuiop12", "azertyuiop123", "azerty123456",
  "123456azerty", "azertyazerty", "azertyuiopqsdfghjklm", "aaaaaaaaaaaa", "abcdefghijkl", "abcdefgh1234", "abc123abc123",
  "password1234", "password12345", "password123456", "passwordpassword", "passw0rd1234", "motdepasse12", "motdepasse123",
  "motdepasse1234", "monmotdepasse", "motdepassemotdepasse", "jetaimejetaime", "iloveyou1234", "iloveyouiloveyou",
  "bonjour12345", "bonjourbonjour", "soleil123456", "doudou123456", "chocolat1234", "loulou123456", "football1234",
  "princess1234", "sunshine1234", "superman1234", "welcome12345", "letmein12345", "starwars1234", "pokemon12345",
  "trustno1trustno1", "sosmiam12345", "sosmiam123456", "sosmiamsosmiam", "ambassadeur1", "ambassadeur123",
]);

/**
 * Vrai si le mot de passe peut être choisi : 12 à 128 caractères une fois normalisé (NFC, un emoji compte pour un),
 * absent de la liste des plus courants (sans tenir compte des majuscules ni des espaces) et différent de l'e-mail.
 */
export function validerMotDePasse(motDePasse: string, email: string): boolean {
  const normalise = motDePasse.normalize("NFC");
  const longueur = [...normalise].length;
  if (longueur < 12 || longueur > 128) return false;
  const minuscules = normalise.toLowerCase();
  return !MOTS_DE_PASSE_COURANTS.has(minuscules.replace(/\s+/g, "")) && minuscules.trim() !== email.trim().toLowerCase();
}
