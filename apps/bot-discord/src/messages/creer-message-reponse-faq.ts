// Réponse à une question de /faq.
import type { ContainerBuilder } from "discord.js";
import { THEMES_FAQ, type QuestionFaq } from "../contenus/questions-faq.ts";
import { creerBloc } from "../fonctions/discord/creer-bloc.ts";
import { COULEURS } from "../interface/couleurs.ts";

export function creerMessageReponseFaq(question: QuestionFaq): ContainerBuilder {
  const theme = THEMES_FAQ[question.theme];
  return creerBloc({
    couleur: question.theme === "bigSos" ? COULEURS.rougeSos : COULEURS.jaune,
    parties: [`### ${question.question}\n${question.reponse}`],
    pied: `${theme.emoji} ${theme.titre} · Une autre question ? Tape /faq`,
  });
}
