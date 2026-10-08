// Petits lecteurs des champs envoyés par le logiciel de gestion : ils nettoient, ou disent quel champ ne va pas.

export class ChampInvalide extends Error {
  readonly champ: string;
  constructor(champ: string) {
    super(`champ invalide : ${champ}`);
    this.champ = champ;
  }
}

/** Texte nettoyé (espaces en trop retirés). Obligatoire : non vide. Facultatif : null si vide. */
export function lireTexte(corps: Record<string, unknown>, champ: string, maximum: number, obligatoire: true): string;
export function lireTexte(corps: Record<string, unknown>, champ: string, maximum: number, obligatoire?: false): string | null;
export function lireTexte(corps: Record<string, unknown>, champ: string, maximum: number, obligatoire = false) {
  const valeur = corps[champ];
  if (valeur === undefined || valeur === null || valeur === "") {
    if (obligatoire) throw new ChampInvalide(champ);
    return null;
  }
  if (typeof valeur !== "string") throw new ChampInvalide(champ);
  const propre = valeur.replace(/[ \t]+/g, " ").trim();
  if (propre.length > maximum || (obligatoire && propre === "")) throw new ChampInvalide(champ);
  return propre || null;
}

export function lireChoix<T extends string>(corps: Record<string, unknown>, champ: string, choix: readonly T[]): T {
  const valeur = corps[champ];
  if (typeof valeur !== "string" || !choix.includes(valeur as T)) throw new ChampInvalide(champ);
  return valeur as T;
}

export function lireNombre(corps: Record<string, unknown>, champ: string, min: number, max: number, entier = true): number | null {
  const valeur = corps[champ];
  if (valeur === undefined || valeur === null || valeur === "") return null;
  if (typeof valeur !== "number" || !Number.isFinite(valeur) || valeur < min || valeur > max || (entier && !Number.isInteger(valeur))) {
    throw new ChampInvalide(champ);
  }
  return valeur;
}

export function lireListe(corps: Record<string, unknown>, champ: string, maximum: number, longueurMax: number, choix?: readonly string[]): string[] {
  const valeur = corps[champ] ?? [];
  if (!Array.isArray(valeur) || valeur.length > maximum) throw new ChampInvalide(champ);
  const propres = valeur.map((element) => (typeof element === "string" ? element.trim() : ""));
  if (propres.some((element) => !element || element.length > longueurMax || (choix && !choix.includes(element)))) throw new ChampInvalide(champ);
  return [...new Set(propres)];
}

/** Identifiant numérique dans l'adresse (« /lieux/12 ») ; null s'il n'en est pas un. */
export function lireId(valeur: unknown): number | null {
  const nombre = Number(valeur);
  return typeof valeur === "string" && /^\d{1,9}$/.test(valeur) && nombre > 0 ? nombre : null;
}

/** Paramètre d'adresse (« ?recherche=… ») en texte, borné. */
export function lireParametre(valeur: unknown, maximum = 100): string {
  return typeof valeur === "string" ? valeur.trim().slice(0, maximum) : "";
}

/** Document de l'éditeur visuel du logiciel (TipTap) : un objet « doc », 300 ko au plus une fois en JSON. */
export function lireDocumentEditeur(valeur: unknown): object {
  if (typeof valeur !== "object" || valeur === null || Array.isArray(valeur) || (valeur as { type?: unknown }).type !== "doc") throw new ChampInvalide("contenu");
  if (JSON.stringify(valeur).length > 300_000) throw new ChampInvalide("contenu");
  return valeur;
}
