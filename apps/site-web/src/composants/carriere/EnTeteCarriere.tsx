import { Badge } from "~/composants/interface/Badge";
import { Bouton } from "~/composants/interface/Bouton";
import { Mascotte } from "~/composants/marque/Mascotte";
import { pageCarriere } from "~/contenus/carriere";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

export function EnTeteCarriere() {
  return (
    <section aria-labelledby="carriere-titre" className="border-b-2 border-encre bg-jaune">
      <div className="mx-auto w-[min(1120px,100%-32px)] py-14 md:py-20">
        <div className="grid items-center gap-8 md:grid-cols-[1.5fr_1fr]">
          <div>
            <Badge variante="blanc">{pageCarriere.badge}</Badge>
            <h1 id="carriere-titre" className="mt-4 text-[clamp(2.4rem,6vw,4rem)] font-extrabold tracking-tight">
              {lierPonctuation(`${pageCarriere.titre} !`)}
            </h1>
            <p className="mt-4 max-w-xl text-lg">{lierPonctuation(pageCarriere.chapo)}</p>
            <p className="mt-6 max-w-xl rounded-2xl border-2 border-encre bg-white px-5 py-4 text-lg font-semibold shadow-brut">
              {lierPonctuation(pageCarriere.franchise)}
            </p>
            <ul aria-label="Pour toutes les offres" className="mt-6 flex flex-wrap gap-2">
              {pageCarriere.pourTous.map((info) => (
                <li key={info} className="rounded-full border-2 border-encre bg-jaune-clair px-3.5 py-1 text-sm font-semibold">{info}</li>
              ))}
            </ul>
            <Bouton href="#offres" variante="encre" className="mt-8">Voir les offres</Bouton>
          </div>
          <Mascotte expression="clin" className="mx-auto hidden h-56 w-56 md:block lg:h-72 lg:w-72" />
        </div>
        <ul aria-label="L'esprit SOS Miam" className="mt-12 grid gap-4 md:grid-cols-3">
          {pageCarriere.esprit.map((valeur) => (
            <li key={valeur.titre} className="rounded-carte border-2 border-encre bg-white p-5 shadow-brut">
              <p className="font-titre text-xl font-extrabold"><span aria-hidden="true">{valeur.emoji} </span>{valeur.titre}</p>
              <p className="mt-2 text-gris">{lierPonctuation(valeur.texte)}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
