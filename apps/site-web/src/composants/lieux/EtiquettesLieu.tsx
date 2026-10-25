import { CLASSE_PASTILLE } from "~/composants/lieux/classes-fiche-lieu";
import { TEXTES_FICHE_LIEU } from "~/contenus/fiche-lieu";

export function EtiquettesLieu({ etiquettes }: { etiquettes: string[] }) {
  if (etiquettes.length === 0) return null;
  return (
    <ul aria-label={TEXTES_FICHE_LIEU.etiquettes} lang="fr" className="flex flex-wrap gap-2">
      {etiquettes.map((etiquette) => (
        <li key={etiquette} className={CLASSE_PASTILLE}>{etiquette}</li>
      ))}
    </ul>
  );
}
