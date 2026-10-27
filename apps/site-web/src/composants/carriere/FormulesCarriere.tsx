import { TitreSection } from "~/composants/interface/TitreSection";
import { Section } from "~/composants/mise-en-page/Section";
import { EMOJIS_FORMULES, TEXTES_CARRIERE_PAR_LANGUE } from "~/contenus/carriere";
import { site } from "~/contenus/legal/informations-legales";
import { creerLienEcrireNous } from "~/fonctions/carriere/creer-lien-ecrire-nous";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";

export function FormulesCarriere() {
  const C = utiliserTextes(TEXTES_CARRIERE_PAR_LANGUE);
  const T = C.formules;
  const formules = [
    { ...T.benevolat, emoji: EMOJIS_FORMULES.benevolat },
    { ...T.freelance, emoji: EMOJIS_FORMULES.freelance },
  ];
  return (
    <Section id="comment-ca-marche">
      <TitreSection aGauche chapo={lierPonctuation(T.chapo)}>
        {T.titre}
      </TitreSection>
      <ul className="grid gap-6 md:grid-cols-2">
        {formules.map((formule) => (
          <li key={formule.titre} className="rounded-carte border-2 border-encre bg-creme p-6 shadow-brut md:p-8">
            <h3 className="text-2xl font-extrabold"><span aria-hidden="true">{formule.emoji} </span>{formule.titre}</h3>
            <p className="mt-3">{lierPonctuation(formule.texte)}</p>
            <p className="mt-5 font-titre text-lg font-extrabold">{T.enEchange}</p>
            <ul className="mt-2 flex flex-col gap-2">
              {formule.recois.map((chose) => (
                <li key={chose} className="flex gap-2"><span aria-hidden="true" className="font-bold">✓</span><span>{lierPonctuation(chose)}</span></li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
      <p className="mt-10 rounded-carte border-2 border-encre bg-jaune-clair px-6 py-5 text-center text-lg">
        {lierPonctuation(T.pasDOffre)}
        <a href={creerLienEcrireNous(C.sujetMail)} className="font-semibold underline decoration-2 underline-offset-2">{lierPonctuation(T.ecrisNousA(site.emailContact))}</a>.
      </p>
    </Section>
  );
}
