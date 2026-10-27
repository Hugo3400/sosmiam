import { ecrireDateAParisLangue } from "~/fonctions/dates/ecrire-date-a-paris-langue";
import { utiliserLangue } from "~/hooks/utiliser-langue";

export function JourEnLettres({ iso }: { iso: string }) {
  const langue = utiliserLangue();
  const date = new Date(iso);
  const texte = Number.isNaN(date.getTime()) ? null : ecrireDateAParisLangue(date.toISOString(), langue);
  return texte ? <time dateTime={date.toISOString()}>{texte}</time> : null;
}
