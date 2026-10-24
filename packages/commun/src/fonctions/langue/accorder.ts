import type { Langue } from "../../regles/langues.ts";

export function accorder(nombre: number, langue: Langue, un: string, plusieurs: string): string {
  const singulier = langue === "en" ? Math.abs(nombre) === 1 : Math.abs(nombre) < 2;
  return singulier ? un : plusieurs;
}
