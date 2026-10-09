/** Une liste écrite « a,b , c » (variable d'environnement) : éléments sans espaces autour, vides retirés, sans doublons. */
export function lireListeVirgules(valeur: unknown, defaut: string[] = []): string[] {
  if (typeof valeur !== "string") return [...defaut];
  return [...new Set(valeur.split(",").map((element) => element.trim()).filter((element) => element !== ""))];
}
