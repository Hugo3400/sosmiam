import type { LectureChat } from "~/contenus/type-discussion-chat";
import { estMessageLu } from "~/fonctions/chat/est-message-lu";
import { formaterIlYA } from "~/fonctions/dates/formater-il-y-a";

const MAX_PRENOMS = 3;

const joindre = (noms: readonly string[]) => (noms.length < 2 ? noms.join("") : `${noms.slice(0, -1).join(", ")} et ${noms[noms.length - 1]}`);
const avecLe = (moment: string) => (/^\d/.test(moment) ? `le ${moment}` : moment);

type Options = {
  messageId: string;
  ordre: readonly string[];
  lectures: readonly LectureChat[] | undefined;
  prive: boolean;
  prenomDe: (membre: string) => string | null;
  maintenant: Date;
};

export function decrireVuMessage({ messageId, ordre, lectures, prive, prenomDe, maintenant }: Options): { vu: string; lu: string } | null {
  const couvrantes = (lectures ?? []).filter((l) => estMessageLu(l.luJusqua, messageId, ordre));
  if (couvrantes.length === 0) return null;
  const derniere = couvrantes
    .map((l) => l.luLe)
    .filter((le): le is string => !!le && !Number.isNaN(new Date(le).getTime()))
    .sort()
    .pop();
  const moment = derniere ? formaterIlYA(derniere, maintenant) : null;
  const suiteVue = moment?.court ? ` · ${moment.court}` : "";
  const suiteLue = moment?.lu ? `, ${avecLe(moment.lu)}` : "";
  if (prive) return { vu: `Vu${suiteVue}`, lu: `Vu${moment?.lu ? ` ${avecLe(moment.lu)}` : ""}` };
  const prenoms = couvrantes.map((l) => prenomDe(l.membre));
  if (couvrantes.length > MAX_PRENOMS || prenoms.some((p) => !p)) {
    const n = couvrantes.length;
    return { vu: `Vu par ${n}${suiteVue}`, lu: `Vu par ${n} personne${n > 1 ? "s" : ""}${suiteLue}` };
  }
  const noms = joindre(prenoms as string[]);
  return { vu: `Vu par ${noms}${suiteVue}`, lu: `Vu par ${noms}${suiteLue}` };
}
