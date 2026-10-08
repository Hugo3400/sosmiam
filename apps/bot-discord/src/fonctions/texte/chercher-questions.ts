import { normaliserTexte } from "./normaliser-texte.ts";

type QuestionCherchable = { question: string; reponse?: string; motsCles?: string[] };

/**
 * Questions qui correspondent le mieux à une saisie, sans tenir compte des accents ni des majuscules.
 * Un mot trouvé dans la question ou les mots-clés compte double ; dans la réponse, simple.
 * Les mots tapés peuvent être incomplets (« rescou » trouve « rescousse »). Saisie vide : les premières questions.
 */
export function chercherQuestions<T extends QuestionCherchable>(questions: T[], saisie: string, limite = 25): T[] {
  const mots = normaliserTexte(saisie).split(" ").filter(Boolean);
  if (mots.length === 0) return questions.slice(0, limite);

  return questions
    .map((question, rang) => ({ question, rang, score: calculerScore(question, mots) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.rang - b.rang)
    .slice(0, limite)
    .map(({ question }) => question);
}

function calculerScore(question: QuestionCherchable, mots: string[]): number {
  const titre = normaliserTexte([question.question, ...(question.motsCles ?? [])].join(" ")).split(" ");
  const reponse = normaliserTexte(question.reponse ?? "").split(" ");
  let score = 0;
  for (const mot of mots) {
    if (titre.some((m) => m.startsWith(mot))) score += 2;
    else if (reponse.some((m) => m.startsWith(mot))) score += 1;
  }
  return score;
}
