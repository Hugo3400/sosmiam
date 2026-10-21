import { TitreSection } from "~/composants/interface/TitreSection";
import { Section } from "~/composants/mise-en-page/Section";
import { formulesCarriere, lienEcrireNous } from "~/contenus/carriere";
import { site } from "~/contenus/legal/informations-legales";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

export function FormulesCarriere() {
  return (
    <Section id="comment-ca-marche">
      <TitreSection aGauche chapo={lierPonctuation("Deux façons de nous rejoindre, toutes les deux à distance, partout en France, dès 18 ans.")}>
        Bénévole ou freelance ?
      </TitreSection>
      <ul className="grid gap-6 md:grid-cols-2">
        {[formulesCarriere.benevolat, formulesCarriere.freelance].map((formule) => (
          <li key={formule.titre} className="rounded-carte border-2 border-encre bg-creme p-6 shadow-brut md:p-8">
            <h3 className="text-2xl font-extrabold"><span aria-hidden="true">{formule.emoji} </span>{formule.titre}</h3>
            <p className="mt-3">{lierPonctuation(formule.texte)}</p>
            <p className="mt-5 font-titre text-lg font-extrabold">En échange</p>
            <ul className="mt-2 flex flex-col gap-2">
              {formule.recois.map((chose) => (
                <li key={chose} className="flex gap-2"><span aria-hidden="true" className="font-bold">✓</span><span>{lierPonctuation(chose)}</span></li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
      <p className="mt-10 rounded-carte border-2 border-encre bg-jaune-clair px-6 py-5 text-center text-lg">
        {lierPonctuation("Pas d'offre pour toi, mais une envie qui te démange ? ")}
        <a href={lienEcrireNous} className="font-semibold underline decoration-2 underline-offset-2">{lierPonctuation(`Écris-nous à ${site.emailContact}`)}</a>.
      </p>
    </Section>
  );
}
