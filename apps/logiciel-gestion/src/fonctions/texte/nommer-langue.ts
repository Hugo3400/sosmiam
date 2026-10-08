const noms = new Intl.DisplayNames(["fr"], { type: "language" });

/** Nom d'une langue d'après son code (« fr » → « français »), avec une majuscule. */
export function nommerLangue(code: string): string {
  if (code === "Inconnue") return code;
  try {
    const nom = noms.of(code) ?? code;
    return nom.charAt(0).toUpperCase() + nom.slice(1);
  } catch {
    return code;
  }
}
