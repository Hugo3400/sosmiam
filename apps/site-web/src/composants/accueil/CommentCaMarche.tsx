import { IconeEtapeCommentCaMarche, type IconeEtape } from "~/composants/accueil/IconeEtapeCommentCaMarche";
import { Bouton } from "~/composants/interface/Bouton";
import { Section } from "~/composants/mise-en-page/Section";
import { TEXTES_COMMENT_CA_MARCHE_PAR_LANGUE } from "~/contenus/comment-ca-marche";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";

const VISUELS: readonly { icone: IconeEtape; sos?: boolean }[] = [{ icone: "chercher" }, { icone: "sos", sos: true }, { icone: "addition" }, { icone: "bouee" }];

export function CommentCaMarche() {
  const T = utiliserTextes(TEXTES_COMMENT_CA_MARCHE_PAR_LANGUE);
  return (
    <Section id="comment">
      <div className="mb-10 flex items-end justify-between gap-4 md:mb-12 md:gap-8">
        <div className="max-w-[680px]">
          <p className="mb-3 text-sm font-bold tracking-[.08em] text-gris uppercase">{T.surtitre}</p>
          <h2 className="text-[clamp(1.9rem,4.2vw,3.25rem)] leading-[1.06] font-extrabold tracking-tight text-balance">{lierPonctuation(T.titre)}</h2>
        </div>
        <img src="/images/marque/capitaine-place-ce-soir.svg" alt={T.mascotte} width={250} height={303} className="h-auto w-[84px] shrink-0 md:w-[150px]" />
      </div>
      <div className="relative">
        <div aria-hidden="true" className="absolute top-[30px] bottom-16 left-[25px] border-l-[3px] border-dashed border-encre lg:top-[52px] lg:right-[12%] lg:bottom-auto lg:left-[12%] lg:border-t-[3px] lg:border-l-0" />
        <ol className="relative grid gap-[18px] lg:grid-cols-4 lg:gap-6">
          {T.etapes.map((etape, i) => {
            const visuel = VISUELS[i];
            return (
            <li key={etape.titre} className="flex items-start gap-3.5 lg:block">
              <span className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-full border-2 border-encre bg-jaune font-titre text-2xl font-extrabold lg:hidden">{i + 1}</span>
              <div
                className={`flex h-full flex-1 flex-col gap-3 rounded-[20px] border-2 bg-white p-[18px] lg:gap-3.5 lg:rounded-carte lg:px-6 lg:pt-[26px] lg:pb-6 ${visuel.sos ? "border-rouge-sos shadow-[4px_4px_0_var(--color-rouge-sos)] lg:shadow-[6px_6px_0_var(--color-rouge-sos)]" : "border-encre shadow-[4px_4px_0_var(--color-jaune)] lg:shadow-brut-jaune"}`}
              >
                <div className="hidden items-center justify-between lg:flex">
                  <span className="grid h-[52px] w-[52px] place-items-center rounded-full border-2 border-encre bg-jaune font-titre text-2xl font-extrabold">{i + 1}</span>
                  <IconeEtapeCommentCaMarche icone={visuel.icone} />
                </div>
                <h3 className="text-[1.3rem] leading-tight font-extrabold lg:text-[1.55rem]">{etape.titre}</h3>
                <p className="text-[.95rem] leading-relaxed text-gris lg:text-base">{lierPonctuation(etape.texte)}</p>
                <span
                  className={`mt-auto self-start rounded-full border-2 px-2.5 py-1 text-[.8rem] whitespace-nowrap lg:text-[.82rem] ${visuel.sos ? "border-rouge-sos bg-rose-alerte font-bold text-rouge-texte" : "border-encre bg-jaune-clair font-semibold"}`}
                >
                  {etape.gain}
                </span>
              </div>
            </li>
            );
          })}
        </ol>
      </div>
      <div className="mt-10 flex flex-col gap-4 rounded-[20px] bg-encre p-5 text-white md:mt-12 md:flex-row md:items-center md:justify-between md:gap-6 md:rounded-carte md:px-7 md:py-[22px]">
        <p className="max-w-[640px] leading-normal">
          {T.verifies.debut}
          <strong className="text-jaune">{T.verifies.badge}</strong>
          {lierPonctuation(T.verifies.fin)}
        </p>
        <Bouton href="#inscription" className="shrink-0">
          {T.bouton}
        </Bouton>
      </div>
    </Section>
  );
}
