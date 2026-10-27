import { Badge } from "~/composants/interface/Badge";
import { Bouton } from "~/composants/interface/Bouton";
import { Mascotte } from "~/composants/marque/Mascotte";
import type { TextesSecurite } from "~/contenus/securite";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

export function EnTeteSecurite({ textes }: { textes: TextesSecurite["page"] }) {
  return (
    <section aria-labelledby="securite-titre" className="border-b-2 border-encre bg-jaune">
      <div className="mx-auto w-[min(1120px,100%-32px)] py-14 md:py-20">
        <div className="grid items-center gap-8 md:grid-cols-[1.5fr_1fr]">
          <div>
            <Badge variante="blanc">{textes.badge}</Badge>
            <h1 id="securite-titre" className="mt-4 text-[clamp(2.4rem,6vw,4rem)] font-extrabold tracking-tight">
              {textes.titre}<span aria-hidden="true"> 🐞</span>
            </h1>
            <p className="mt-4 max-w-xl text-xl font-semibold">{lierPonctuation(textes.chapo)}</p>
            <p className="mt-4 max-w-xl text-lg">{lierPonctuation(textes.pourQui)}</p>
            <ul aria-label={textes.enUnCoupDOeilLibelle} className="mt-6 flex flex-wrap gap-2">
              {textes.enUnCoupDOeil.map((info) => (
                <li key={info} className="rounded-full border-2 border-encre bg-jaune-clair px-3.5 py-1 text-sm font-semibold">{info}</li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <Bouton href="#signaler" variante="encre">{textes.signaler}</Bouton>
              <Bouton href="#regles" variante="blanc">{textes.lireRegles}</Bouton>
            </div>
          </div>
          <Mascotte expression="surprise" className="mx-auto hidden h-56 w-56 md:block lg:h-72 lg:w-72" />
        </div>
      </div>
    </section>
  );
}
