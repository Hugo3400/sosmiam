// Réglages lus dans le fichier .env du bot (modèle : .env.exemple).

/** Accueil des nouveaux membres : il faut l'intent « Server Members » activé dans le portail Discord. */
export const intentMembres = process.env.INTENT_MEMBRES === "1";

/** Jeton du bot : obligatoire pour se connecter. */
export function lireJeton(): string {
  const jeton = process.env.DISCORD_JETON;
  if (!jeton) throw new Error("DISCORD_JETON manquant : copie .env.exemple en .env et colle le jeton du bot.");
  return jeton;
}
