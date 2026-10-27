import { Link } from "react-router";

import { MESSAGE_SANITAIRE_ALCOOL_TRADUIT } from "~/contenus/anglais/liens-pied-de-page";
import { TEXTES_FICHE_LIEU_PAR_LANGUE } from "~/contenus/fiche-lieu";
import { ALCOOL_INFO_SERVICE, MESSAGE_SANITAIRE_ALCOOL } from "~/contenus/legal/prevention";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserLienLangue } from "~/hooks/utiliser-lien-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";

const classeLien = "font-semibold underline decoration-encre/40 decoration-2 underline-offset-2 hover:decoration-encre";

/**
 * Petit bloc de prévention sur la fiche d'un lieu qui sert de l'alcool (un bar) : le message sanitaire de la loi Évin,
 * mot pour mot, le service d'aide et la page /prevention. Discret, mais toujours là.
 */
export function BlocPrevention() {
  const T = utiliserTextes(TEXTES_FICHE_LIEU_PAR_LANGUE).prevention;
  const langue = utiliserLangue();
  const lien = utiliserLienLangue();
  return (
    <aside aria-label={T.etiquette} className="rounded-carte border-2 border-encre bg-jaune-clair px-6 py-5 text-sm md:px-7 md:py-6">
      <p lang="fr" className="text-base font-extrabold text-encre md:text-[17px]">{MESSAGE_SANITAIRE_ALCOOL}</p>
      {langue === "en" && <p className="mt-1 font-semibold">{MESSAGE_SANITAIRE_ALCOOL_TRADUIT}</p>}
      <p className="mt-2">
        {lierPonctuation(T.besoin)}
        {T.service(ALCOOL_INFO_SERVICE.nom)}
        <a href={ALCOOL_INFO_SERVICE.lienTelephone} className={classeLien}>{ALCOOL_INFO_SERVICE.telephone}</a>
        {lierPonctuation(T.anonyme)}
        <a href={ALCOOL_INFO_SERVICE.site} rel="noopener" className={classeLien}>{ALCOOL_INFO_SERVICE.site.replace(/^https:\/\/(www\.)?/, "")}</a>
        {". "}
        <Link to={lien("/prevention")} className={classeLien}>{T.page}</Link>
      </p>
    </aside>
  );
}
