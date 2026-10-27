import { Badge } from "~/composants/interface/Badge";
import { Bouton } from "~/composants/interface/Bouton";
import { MaquetteTelephone } from "~/composants/accueil/MaquetteTelephone";
import { TEXTES_HERO_PAR_LANGUE } from "~/contenus/hero";
import { utiliserTextes } from "~/hooks/utiliser-textes";

/** Haut de la page d'accueil : promesse, boutons, chiffres clés et maquette de l'app. */
export function Hero() {
  const T = utiliserTextes(TEXTES_HERO_PAR_LANGUE);
  return (
    <section className="overflow-hidden bg-creme pt-10 pb-16 md:pt-16 md:pb-24">
      <div className="mx-auto grid w-[min(1120px,100%-32px)] items-center gap-12 lg:grid-cols-[1.1fr_.9fr]">
        <div>
          <Badge className="mb-5">{T.badge}</Badge>
          <h1 className="text-[clamp(2.6rem,6vw,4.6rem)] font-extrabold tracking-tight">
            {T.titre.debut}
            <br />
            <mark className="bg-transparent bg-[linear-gradient(transparent_55%,var(--color-jaune)_55%)] px-1 text-encre">{T.titre.fin}</mark>
          </h1>
          <p className="mt-6 mb-8 max-w-[520px] text-lg text-gris">{T.texte}</p>
          <div className="flex flex-wrap gap-3.5">
            <Bouton href="#inscription">{T.boutons.inscription}</Bouton>
            <Bouton href="#pros" variante="blanc">{T.boutons.lieu}</Bouton>
          </div>
          <ul className="mt-11 flex flex-wrap gap-x-9 gap-y-4">
            {T.chiffres.map((chiffre) => (
              <li key={chiffre.texte}>
                <strong className="block font-titre text-3xl font-extrabold">{chiffre.valeur}</strong>
                <span className="text-sm text-gris">{chiffre.texte}</span>
              </li>
            ))}
          </ul>
        </div>
        <MaquetteTelephone />
      </div>
    </section>
  );
}
