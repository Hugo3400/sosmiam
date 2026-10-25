import { CLASSE_BLOC, CLASSE_TITRE_BLOC } from "~/composants/lieux/classes-fiche-lieu";
import { EtiquettesLieu } from "~/composants/lieux/EtiquettesLieu";
import { TEXTES_FICHE_LIEU } from "~/contenus/fiche-lieu";

export function BlocAmbiance({ etiquettes }: { etiquettes: string[] }) {
  const T = TEXTES_FICHE_LIEU.ambiance;
  if (etiquettes.length === 0) return null;
  return (
    <section aria-labelledby="fiche-ambiance" className={`flex flex-col gap-3.5 ${CLASSE_BLOC}`}>
      <h2 id="fiche-ambiance" className={CLASSE_TITRE_BLOC}>{T.titre}</h2>
      <EtiquettesLieu etiquettes={etiquettes} />
      <p className="text-sm text-gris">{T.note}</p>
    </section>
  );
}
