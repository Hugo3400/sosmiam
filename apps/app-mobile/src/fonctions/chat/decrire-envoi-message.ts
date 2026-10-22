import { formaterIlYA } from "~/fonctions/dates/formater-il-y-a";

export function decrireEnvoiMessage(iso: string, maintenant: Date): { vu: string; lu: string } {
  const moment = formaterIlYA(iso, maintenant);
  if (!moment.court) return { vu: "Envoyé", lu: "Envoyé" };
  return { vu: `Envoyé · ${moment.court}`, lu: `Envoyé ${/^\d/.test(moment.lu) ? `le ${moment.lu}` : moment.lu}` };
}
