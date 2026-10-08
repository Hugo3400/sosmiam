const formatDate = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" });

type Props = {
  /** Date ISO 8601 (renvoyée par l'API) */
  iso: string;
  /** Décalage à ajouter : « effacé 30 jours après le refus », « 3 mois après la réponse » */
  plusJours?: number;
  plusMois?: number;
};

/** Une date en toutes lettres, à l'heure de Paris : « 1er novembre 2026 ». Même rendu sur le serveur et dans le navigateur. */
export function DateEnLettres({ iso, plusJours = 0, plusMois = 0 }: Props) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  date.setUTCMonth(date.getUTCMonth() + plusMois);
  date.setUTCDate(date.getUTCDate() + plusJours);
  const texte = formatDate.formatToParts(date).map((morceau) => (morceau.type === "day" && morceau.value === "1" ? "1er" : morceau.value)).join("");
  return <time dateTime={date.toISOString()}>{texte}</time>;
}
