import { Badge } from "~/composants/interface/Badge";
import { Mascotte } from "~/composants/marque/Mascotte";
import { BoutonsProgramme } from "~/composants/programme/BoutonsProgramme";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

/** Haut de la page /programme : le programme en une phrase, les deux boutons et la mascotte qui fait un clin d'œil. */
export function HautProgramme() {
  return (
    <section className="overflow-hidden bg-creme pt-10 pb-16 md:pt-16 md:pb-24">
      <div className="mx-auto grid w-[min(1120px,100%-32px)] items-center gap-10 lg:grid-cols-[1.15fr_.85fr]">
        <div>
          <Badge className="mb-5">🎖️ Programme Ambassadeurs · dès 18&nbsp;ans</Badge>
          <h1 className="text-[clamp(2.4rem,6vw,4.4rem)] font-extrabold tracking-tight">
            {"Deviens "}
            <mark className="bg-transparent bg-[linear-gradient(transparent_55%,var(--color-jaune)_55%)] px-1 text-encre">ambassadeur</mark>
            {" SOS\u00a0Miam"}
          </h1>
          <p className="mt-6 mb-8 max-w-[540px] text-lg text-gris">
            {lierPonctuation(
              "Tu connais un petit resto, une pâtisserie ou un bowling qui mérite plus de monde ? Aide-nous à le faire connaître. C'est gratuit, ça se fait à ton rythme, et c'est partout en France.",
            )}
          </p>
          <BoutonsProgramme />
          <p className="mt-5 text-sm text-gris">{lierPonctuation("Dès 18 ans. L'équipe valide chaque inscription à la main.")}</p>
        </div>
        <Mascotte expression="clin" className="mx-auto w-48 sm:w-60 lg:w-80" />
      </div>
    </section>
  );
}
