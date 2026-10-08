import { Badge } from "~/composants/interface/Badge";
import { Bouton } from "~/composants/interface/Bouton";
import { MaquetteTelephone } from "~/composants/accueil/MaquetteTelephone";

// Chiffres vrais (règles de l'app), pas de faux compteurs avant le lancement
const chiffresCles = [
  { valeur: "3", texte: "rescousses par semaine" },
  { valeur: "7 j", texte: "à la une pour un BIG SOS" },
  { valeur: "0 €", texte: "de commission" },
];

/** Haut de la page d'accueil : promesse, boutons, chiffres clés et maquette de l'app. */
export function Hero() {
  return (
    <section className="overflow-hidden bg-creme pt-10 pb-16 md:pt-16 md:pb-24">
      <div className="mx-auto grid w-[min(1120px,100%-32px)] items-center gap-12 lg:grid-cols-[1.1fr_.9fr]">
        <div>
          <Badge className="mb-5">🛟 Bientôt à Montpellier et dans l'Hérault</Badge>
          <h1 className="text-[clamp(2.6rem,6vw,4.6rem)] font-extrabold tracking-tight">
            Sauve une table,
            <br />
            <mark className="bg-transparent bg-[linear-gradient(transparent_55%,var(--color-jaune)_55%)] px-1 text-encre">régale-toi.</mark>
          </h1>
          <p className="mt-6 mb-8 max-w-[520px] text-lg text-gris">
            SOS Miam te fait découvrir les restos, pâtisseries, bars et sorties de ton coin qui ont besoin de monde :
            la pépite qui vient d'ouvrir, la salle calme un mardi soir, ou le lieu qui traverse un coup dur.
          </p>
          <div className="flex flex-wrap gap-3.5">
            <Bouton href="#inscription">Je m'inscris</Bouton>
            <Bouton href="#pros" variante="blanc">J'ai un lieu</Bouton>
          </div>
          <ul className="mt-11 flex flex-wrap gap-x-9 gap-y-4">
            {chiffresCles.map((chiffre) => (
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
