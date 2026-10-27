import { choisirTextes } from "../../../../../packages/commun/src/fonctions/langue/choisir-textes.ts";
import type { Langue } from "../../../../../packages/commun/src/regles/langues.ts";
import type { ParLangue } from "../../../../../packages/commun/src/types/traduction.ts";
import { QUESTIONS_AMBASSADEURS_PAR_LANGUE } from "~/contenus/faq/ambassadeurs";
import { QUESTIONS_APP_PAR_LANGUE } from "~/contenus/faq/app";
import { QUESTIONS_BIG_SOS_PAR_LANGUE } from "~/contenus/faq/big-sos";
import { QUESTIONS_ESSENTIEL_PAR_LANGUE } from "~/contenus/faq/essentiel";
import { TEXTES_ONGLETS_FAQ, TEXTES_ONGLETS_FAQ_PAR_LANGUE } from "~/contenus/faq/onglets-faq";
import { QUESTIONS_PROS_PAR_LANGUE } from "~/contenus/faq/pros";
import type { ContenuQuestionFaq, OngletFaq } from "~/contenus/faq/type-faq";

type OngletDeclare = {
  cle: keyof typeof TEXTES_ONGLETS_FAQ;
  emoji: string;
  alerte?: boolean;
  questions: ParLangue<Readonly<Record<string, ContenuQuestionFaq>>>;
};

const ONGLETS: readonly OngletDeclare[] = [
  { cle: "essentiel", emoji: "💡", questions: QUESTIONS_ESSENTIEL_PAR_LANGUE },
  { cle: "big-sos", emoji: "🆘", alerte: true, questions: QUESTIONS_BIG_SOS_PAR_LANGUE },
  { cle: "app", emoji: "📱", questions: QUESTIONS_APP_PAR_LANGUE },
  { cle: "pros", emoji: "🍽️", questions: QUESTIONS_PROS_PAR_LANGUE },
  { cle: "ambassadeurs", emoji: "🎖️", questions: QUESTIONS_AMBASSADEURS_PAR_LANGUE },
];

export function listerOngletsFaq(langue: Langue): OngletFaq[] {
  const titres = choisirTextes(TEXTES_ONGLETS_FAQ_PAR_LANGUE, langue);
  return ONGLETS.map(({ cle, emoji, alerte, questions }) => ({
    cle,
    emoji,
    ...titres[cle],
    ...(alerte ? { alerte } : {}),
    questions: Object.entries(choisirTextes(questions, langue)).map(([id, question]) => ({ id, ...question })),
  }));
}
