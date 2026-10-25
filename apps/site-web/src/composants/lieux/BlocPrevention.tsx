import { Link } from "react-router";

import { TEXTES_FICHE_LIEU } from "~/contenus/fiche-lieu";
import { ALCOOL_INFO_SERVICE, MESSAGE_SANITAIRE_ALCOOL } from "~/contenus/legal/prevention";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

const classeLien = "font-semibold underline decoration-encre/40 decoration-2 underline-offset-2 hover:decoration-encre";

/**
 * Petit bloc de prévention sur la fiche d'un lieu qui sert de l'alcool (un bar) : le message sanitaire de la loi Évin,
 * mot pour mot, le service d'aide et la page /prevention. Discret, mais toujours là.
 */
export function BlocPrevention() {
  const T = TEXTES_FICHE_LIEU.prevention;
  return (
    <aside aria-label={T.etiquette} className="rounded-carte border-2 border-encre bg-jaune-clair px-6 py-5 text-sm md:px-7 md:py-6">
      <p className="text-base font-extrabold text-encre md:text-[17px]">{MESSAGE_SANITAIRE_ALCOOL}</p>
      <p className="mt-2">
        {lierPonctuation(T.besoin)}
        {`${ALCOOL_INFO_SERVICE.nom} : `}
        <a href={ALCOOL_INFO_SERVICE.lienTelephone} className={classeLien}>{ALCOOL_INFO_SERVICE.telephone}</a>
        {lierPonctuation(T.anonyme)}
        <a href={ALCOOL_INFO_SERVICE.site} rel="noopener" className={classeLien}>{ALCOOL_INFO_SERVICE.site.replace(/^https:\/\/(www\.)?/, "")}</a>
        {". "}
        <Link to="/prevention" className={classeLien}>{T.page}</Link>
      </p>
    </aside>
  );
}
