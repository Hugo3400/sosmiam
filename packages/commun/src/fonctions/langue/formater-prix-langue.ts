import type { Langue } from "../../regles/langues.ts";

const MILLIERS = /\B(?=(\d{3})+(?!\d))/g;

export function formaterPrixLangue(prix: number, langue: Langue): string {
  const centimes = Math.round(prix * 100);
  const signe = centimes < 0 ? "-" : "";
  const euros = Math.trunc(Math.abs(centimes) / 100);
  const reste = Math.abs(centimes) % 100;
  const decimales = reste === 0 ? "" : String(reste).padStart(2, "0");
  if (langue === "en") return `${signe}€${String(euros).replace(MILLIERS, ",")}${decimales && `.${decimales}`}`;
  return `${signe}${String(euros).replace(MILLIERS, " ")}${decimales && `,${decimales}`} €`;
}
