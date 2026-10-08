/**
 * Ce qu'on peut écrire d'une erreur dans les journaux des comptes : son nom, son code (« P2002 »…) et où elle est née,
 * jamais son message (une erreur de Prisma peut y recopier un e-mail ou une empreinte de mot de passe).
 */
export function resumerErreur(erreur: unknown): string {
  if (typeof erreur !== "object" || erreur === null) return `valeur ${typeof erreur}`;
  const nom = "name" in erreur && typeof erreur.name === "string" ? erreur.name : "Erreur";
  const code = "code" in erreur && (typeof erreur.code === "string" || typeof erreur.code === "number") ? ` ${erreur.code}` : "";
  // Les lignes « at fichier:ligne:colonne » de la pile disent où, sans rien recopier des données (le message est laissé)
  const pile = "stack" in erreur && typeof erreur.stack === "string"
    ? erreur.stack.split("\n").filter((ligne) => /^\s+at .+:\d+:\d+\)?$/.test(ligne)).slice(0, 3).map((ligne) => ligne.trim())
    : [];
  return [`${nom}${code}`, ...pile].join(" | ");
}
