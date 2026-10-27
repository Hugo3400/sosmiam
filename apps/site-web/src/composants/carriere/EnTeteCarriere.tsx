import { Badge } from "~/composants/interface/Badge";
import { Bouton } from "~/composants/interface/Bouton";
import { Mascotte } from "~/composants/marque/Mascotte";
import { EMOJIS_ESPRIT, TEXTES_CARRIERE_PAR_LANGUE } from "~/contenus/carriere";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";

export function EnTeteCarriere() {
  const T = utiliserTextes(TEXTES_CARRIERE_PAR_LANGUE).enTete;
  return (
    <section aria-labelledby="carriere-titre" className="border-b-2 border-encre bg-jaune">
      <div className="mx-auto w-[min(1120px,100%-32px)] py-14 md:py-20">
        <div className="grid items-center gap-8 md:grid-cols-[1.5fr_1fr]">
          <div>
            <Badge variante="blanc">{T.badge}</Badge>
            <h1 id="carriere-titre" className="mt-4 text-[clamp(2.4rem,6vw,4rem)] font-extrabold tracking-tight">
              {lierPonctuation(T.titre)}
            </h1>
            <p className="mt-4 max-w-xl text-lg">{lierPonctuation(T.chapo)}</p>
            <p className="mt-6 max-w-xl rounded-2xl border-2 border-encre bg-white px-5 py-4 text-lg font-semibold shadow-brut">
              {lierPonctuation(T.franchise)}
            </p>
            <ul aria-label={T.pourToutes} className="mt-6 flex flex-wrap gap-2">
              {T.pourTous.map((info) => (
                <li key={info} className="rounded-full border-2 border-encre bg-jaune-clair px-3.5 py-1 text-sm font-semibold">{info}</li>
              ))}
            </ul>
            <Bouton href="#offres" variante="encre" className="mt-8">{T.voirOffres}</Bouton>
          </div>
          <Mascotte expression="clin" className="mx-auto hidden h-56 w-56 md:block lg:h-72 lg:w-72" />
        </div>
        <ul aria-label={T.espritTitre} className="mt-12 grid gap-4 md:grid-cols-3">
          {T.esprit.map((valeur, rang) => (
            <li key={valeur.titre} className="rounded-carte border-2 border-encre bg-white p-5 shadow-brut">
              <p className="font-titre text-xl font-extrabold"><span aria-hidden="true">{EMOJIS_ESPRIT[rang]} </span>{valeur.titre}</p>
              <p className="mt-2 text-gris">{lierPonctuation(valeur.texte)}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
