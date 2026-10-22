import { formaterIlYA } from "~/fonctions/dates/formater-il-y-a";

const avecLe = (moment: string) => (/^\d/.test(moment) ? `le ${moment}` : moment);

export function decrireMomentMessage(iso: string, heure: string, maintenant: Date, deMoi: boolean): { vu: string; lu: string } {
  const moment = formaterIlYA(iso, maintenant);
  if (!moment.court) return { vu: heure, lu: heure };
  if (deMoi) return { vu: `Envoyé ${avecLe(moment.court)} · ${heure}`, lu: `Envoyé ${avecLe(moment.lu)}, à ${heure}` };
  return { vu: `${moment.court} · ${heure}`, lu: `${moment.lu}, à ${heure}` };
}
