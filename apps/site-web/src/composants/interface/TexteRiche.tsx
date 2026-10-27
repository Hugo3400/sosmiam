import { Link } from "react-router";

import { decouperTexteRiche } from "~/fonctions/texte/decouper-texte-riche";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserLienLangue } from "~/hooks/utiliser-lien-langue";

const styleLien = "font-semibold text-encre underline decoration-jaune decoration-[3px] underline-offset-2 hover:decoration-encre";

/**
 * Affiche un texte avec **gras** et [liens](/adresse). Un lien interne sans « # » passe par le routeur ;
 * un lien vers une section (« /#inscription ») reste un <a>, géré par utiliserAncresSansDiese.
 */
export function TexteRiche({ texte }: { texte: string }) {
  const lien = utiliserLienLangue();
  return decouperTexteRiche(texte).map((morceau, i) => {
    if (morceau.type === "gras") return <strong key={i} className="text-encre">{lierPonctuation(morceau.texte)}</strong>;
    if (morceau.type === "francais") return <i key={i} lang="fr">{lierPonctuation(morceau.texte)}</i>;
    if (morceau.type === "lien") {
      const href = lien(morceau.href);
      return href.startsWith("/") && !href.includes("#")
        ? <Link key={i} to={href} className={styleLien}>{morceau.texte}</Link>
        : <a key={i} href={href} className={styleLien}>{morceau.texte}</a>;
    }
    return lierPonctuation(morceau.texte);
  });
}
