import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import type { Langue } from "@sos-miam/commun/regles/langues";
import { TEXTES_CHAT_MOMENTS_PAR_LANGUE } from "~/contenus/textes-chat-moments";
import type { LectureChat } from "~/contenus/type-discussion-chat";
import { estMessageLu } from "~/fonctions/chat/est-message-lu";
import { formaterIlYALangue } from "~/fonctions/langue/formater-il-y-a-langue";
import { listerPrenomsLangue } from "~/fonctions/langue/lister-prenoms-langue";

const MAX_PRENOMS = 3;

type Options = {
  messageId: string;
  ordre: readonly string[];
  lectures: readonly LectureChat[] | undefined;
  prive: boolean;
  prenomDe: (membre: string) => string | null;
  maintenant: Date;
  langue: Langue;
};

export function decrireVuMessage({ messageId, ordre, lectures, prive, prenomDe, maintenant, langue }: Options): { vu: string; lu: string } | null {
  const T = choisirTextes(TEXTES_CHAT_MOMENTS_PAR_LANGUE, langue);
  const couvrantes = (lectures ?? []).filter((l) => estMessageLu(l.luJusqua, messageId, ordre));
  if (couvrantes.length === 0) return null;
  const derniere = couvrantes
    .map((l) => l.luLe)
    .filter((le): le is string => !!le && !Number.isNaN(new Date(le).getTime()))
    .sort()
    .pop();
  const moment = derniere ? formaterIlYALangue(derniere, langue, maintenant) : null;
  const suiteVue = moment?.court ? ` · ${moment.court}` : "";
  const suiteLue = moment?.lu ? `, ${T.leMoment(moment.lu)}` : "";
  if (prive) return { vu: `${T.vu}${suiteVue}`, lu: `${T.vu}${moment?.lu ? ` ${T.leMoment(moment.lu)}` : ""}` };
  const prenoms = couvrantes.map((l) => prenomDe(l.membre));
  if (couvrantes.length > MAX_PRENOMS || prenoms.some((p) => !p)) {
    const n = couvrantes.length;
    return { vu: `${T.vuPar(String(n))}${suiteVue}`, lu: `${T.vuParPersonnes(n)}${suiteLue}` };
  }
  const noms = listerPrenomsLangue(prenoms as string[], langue);
  return { vu: `${T.vuPar(noms)}${suiteVue}`, lu: `${T.vuPar(noms)}${suiteLue}` };
}
