const LIBELLES_ENDROIT: Record<string, string> = { salle: "En salle", terrasse: "En terrasse", toilettes: "Aux toilettes", ailleurs: "Ailleurs" };

/** Le texte de la notification d'une alerte Miam Safe : « En terrasse · table 12, pull vert. Va la voir discrètement. » */
export function ecrireTexteAlerte(endroit: string, detail: string): string {
  const lieu = LIBELLES_ENDROIT[endroit] ?? "Dans le lieu";
  return `${detail ? `${lieu} · ${detail}` : lieu}. Va la voir discrètement.`;
}
