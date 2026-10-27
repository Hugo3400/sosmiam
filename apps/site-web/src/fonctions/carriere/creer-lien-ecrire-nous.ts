import { site } from "~/contenus/legal/informations-legales";

export function creerLienEcrireNous(sujet: string): string {
  return `mailto:${site.emailContact}?subject=${encodeURIComponent(sujet)}`;
}
