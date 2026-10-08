import { Logo } from "~/composants/interface/Logo";
import { CadreVisuel, type FormatVisuel } from "~/composants/kit-media/CadreVisuel";
import { DisqueDecor } from "~/composants/kit-media/DisqueDecor";
import { PastilleSite } from "~/composants/kit-media/PastilleSite";
import { TraitSouligne } from "~/composants/kit-media/TraitSouligne";
import { couleursMarque as c } from "~/composants/marque/couleurs-marque";
import { Mascotte } from "~/composants/marque/Mascotte";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

/** Visuel « Sauve une table, régale-toi » (kit média) : la mascotte gourmande sur fond crème. */
export function VisuelSauveUneTable({ format }: { format: FormatVisuel }) {
  const story = format === "story";
  return (
    <CadreVisuel format={format} fond="creme">
      <Logo className={`w-auto ${story ? "h-[96px]" : "h-[72px]"}`} />
      <div className="relative">
        <DisqueDecor rayon={story ? 290 : 200} fond={c.jaune} points={c.jaune} />
        <Mascotte expression="miam" className={`relative ${story ? "size-[540px]" : "size-[370px]"}`} />
      </div>
      <h1 className={`font-titre leading-[1.05] font-extrabold tracking-[-0.02em] ${story ? "text-[112px]" : "text-[92px]"}`}>
        Sauve une table,
        <br />
        <span className="relative">
          régale-toi.
          <TraitSouligne couleur={c.jaune} epaisseur={story ? 18 : 15} />
        </span>
      </h1>
      <p className={`max-w-[880px] font-medium text-balance ${story ? "text-[44px] leading-[1.3]" : "text-[35px] leading-[1.3]"}`}>
        {lierPonctuation("Des restos, pâtisseries, bars et sorties indépendants ont besoin de monde. Toi, tu as faim : ça tombe bien.")}
      </p>
      <PastilleSite grande={story} />
    </CadreVisuel>
  );
}
