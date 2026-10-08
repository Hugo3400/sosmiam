import { Link } from "react-router";

import { decouperTexteRiche } from "~/fonctions/texte/decouper-texte-riche";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

const styleLien = "font-semibold text-encre underline decoration-jaune decoration-[3px] underline-offset-2 hover:decoration-encre";

/**
 * Affiche un texte avec **gras** et [liens](/adresse). Un lien interne sans « # » passe par le routeur ;
 * un lien vers une section (« /#inscription ») reste un <a>, géré par utiliserAncresSansDiese.
 */
export function TexteRiche({ texte }: { texte: string }) {
  return decouperTexteRiche(texte).map((morceau, i) => {
    if (morceau.type === "gras") return <strong key={i} className="text-encre">{lierPonctuation(morceau.texte)}</strong>;
    if (morceau.type === "lien") {
      return morceau.href.startsWith("/") && !morceau.href.includes("#")
        ? <Link key={i} to={morceau.href} className={styleLien}>{morceau.texte}</Link>
        : <a key={i} href={morceau.href} className={styleLien}>{morceau.texte}</a>;
    }
    return lierPonctuation(morceau.texte);
  });
}
