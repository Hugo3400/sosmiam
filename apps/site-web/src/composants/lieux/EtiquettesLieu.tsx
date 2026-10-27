import { CLASSE_PASTILLE } from "~/composants/lieux/classes-fiche-lieu";
import { TEXTES_FICHE_LIEU_PAR_LANGUE } from "~/contenus/fiche-lieu";
import { utiliserTextes } from "~/hooks/utiliser-textes";

export function EtiquettesLieu({ etiquettes }: { etiquettes: string[] }) {
  const T = utiliserTextes(TEXTES_FICHE_LIEU_PAR_LANGUE);
  if (etiquettes.length === 0) return null;
  return (
    <ul aria-label={T.etiquettes} lang="fr" className="flex flex-wrap gap-2">
      {etiquettes.map((etiquette) => (
        <li key={etiquette} className={CLASSE_PASTILLE}>{etiquette}</li>
      ))}
    </ul>
  );
}
