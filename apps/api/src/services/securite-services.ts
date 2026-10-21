import { creerSecuriteGestion } from "./securite-gestion.ts";
import { creerMenageSecurite } from "./securite-menage.ts";
import { creerSecuritePublics } from "./securite-publics.ts";
import type { DependancesSecurite } from "./securite-regles.ts";

export function creerSecurite(dependances: DependancesSecurite) {
  return { ...creerSecuritePublics(dependances), ...creerSecuriteGestion(dependances), ...creerMenageSecurite(dependances) };
}

export type Securite = ReturnType<typeof creerSecurite>;
