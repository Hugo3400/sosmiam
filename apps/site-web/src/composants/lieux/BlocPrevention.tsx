import { Link } from "react-router";

import { ALCOOL_INFO_SERVICE, MESSAGE_SANITAIRE_ALCOOL } from "~/contenus/legal/prevention";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

const classeLien = "font-semibold underline decoration-jaune decoration-[3px] underline-offset-2 hover:decoration-encre";

/**
 * Petit bloc de prévention sur la fiche d'un lieu qui sert de l'alcool (un bar) : le message sanitaire de la loi Évin,
 * mot pour mot, le service d'aide et la page /prevention. Discret, mais toujours là.
 */
export function BlocPrevention() {
  return (
    <aside aria-label="Prévention" className="rounded-2xl border-2 border-dashed border-encre/40 px-5 py-4 text-sm text-gris">
      <p className="font-semibold text-encre">{MESSAGE_SANITAIRE_ALCOOL}</p>
      <p className="mt-1.5">
        {lierPonctuation("Besoin d'en parler ? ")}
        {`${ALCOOL_INFO_SERVICE.nom} : `}
        <a href={ALCOOL_INFO_SERVICE.lienTelephone} className={classeLien}>{ALCOOL_INFO_SERVICE.telephone}</a>
        {lierPonctuation(" (appel anonyme et non surtaxé) ou ")}
        <a href={ALCOOL_INFO_SERVICE.site} rel="noopener" className={classeLien}>{ALCOOL_INFO_SERVICE.site.replace(/^https:\/\/(www\.)?/, "")}</a>
        {". "}
        <Link to="/prevention" className={classeLien}>Santé et prévention</Link>
      </p>
    </aside>
  );
}
