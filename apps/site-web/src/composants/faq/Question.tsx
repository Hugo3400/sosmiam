import { BlocsTexte } from "~/composants/interface/BlocsTexte";
import type { QuestionFaq } from "~/contenus/faq/type-faq";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

/** Une question de la FAQ, qui se déplie au clic. Son id sert de lien direct (/faq#faq-prix). */
export function Question({ question, cachee = false }: { question: QuestionFaq; cachee?: boolean }) {
  return (
    <details
      id={question.id}
      hidden={cachee}
      className="group mb-3.5 rounded-2xl border-2 border-encre bg-white px-[22px] transition-shadow open:shadow-[4px_4px_0_var(--color-jaune)]"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-[18px] text-[1.05rem] font-semibold
        focus-visible:rounded-md focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-encre [&::-webkit-details-marker]:hidden">
        {lierPonctuation(question.question)}
        <span aria-hidden="true" className="font-titre text-2xl leading-none font-extrabold transition-transform duration-200 group-open:rotate-45">+</span>
      </summary>
      <div className="grid gap-[18px] pb-[18px] text-gris">
        <BlocsTexte blocs={question.reponse} />
      </div>
    </details>
  );
}
