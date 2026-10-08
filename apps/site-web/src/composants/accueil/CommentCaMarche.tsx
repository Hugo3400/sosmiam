import { TitreSection } from "~/composants/interface/TitreSection";
import { Section } from "~/composants/mise-en-page/Section";
import { etapesCommentCaMarche } from "~/contenus/etapes";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

/** Les trois gestes de base : découvrir, y aller, venir à la rescousse. */
export function CommentCaMarche() {
  return (
    <Section id="comment">
      <TitreSection chapo="Trois gestes, et un petit lieu de ton quartier passe un meilleur mois.">Comment ça marche</TitreSection>
      <ol className="grid gap-6 md:grid-cols-3">
        {etapesCommentCaMarche.map((etape, i) => (
          <li key={etape.titre} className="rounded-carte border-2 border-encre bg-white p-8 shadow-brut-jaune">
            <span className="mb-4 grid h-12 w-12 place-items-center rounded-full bg-jaune font-titre text-2xl font-extrabold">{i + 1}</span>
            <h3 className="mb-2 text-2xl font-extrabold">{etape.titre}</h3>
            <p className="text-gris">{lierPonctuation(etape.texte)}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
