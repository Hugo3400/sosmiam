import { CLASSE_BLOC, CLASSE_TITRE_BLOC } from "~/composants/lieux/classes-fiche-lieu";
import { EtiquettesLieu } from "~/composants/lieux/EtiquettesLieu";
import { TEXTES_FICHE_LIEU_PAR_LANGUE } from "~/contenus/fiche-lieu";
import { utiliserTextes } from "~/hooks/utiliser-textes";

export function BlocAmbiance({ etiquettes }: { etiquettes: string[] }) {
  const T = utiliserTextes(TEXTES_FICHE_LIEU_PAR_LANGUE).ambiance;
  if (etiquettes.length === 0) return null;
  return (
    <section aria-labelledby="fiche-ambiance" className={`flex flex-col gap-3.5 ${CLASSE_BLOC}`}>
      <h2 id="fiche-ambiance" className={CLASSE_TITRE_BLOC}>{T.titre}</h2>
      <EtiquettesLieu etiquettes={etiquettes} />
      <p className="text-sm text-gris">{T.note}</p>
    </section>
  );
}
