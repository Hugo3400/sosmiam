import { Logo } from "~/composants/interface/Logo";
import { CadreVisuel, type FormatVisuel } from "~/composants/kit-media/CadreVisuel";
import { DisqueDecor } from "~/composants/kit-media/DisqueDecor";
import { PastilleSite } from "~/composants/kit-media/PastilleSite";
import { couleursMarque as c } from "~/composants/marque/couleurs-marque";
import { Mascotte } from "~/composants/marque/Mascotte";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

/** Visuel « Sauve une table, régale-toi » (kit média) : la mascotte gourmande sur fond crème. */
export function VisuelSauveUneTable({ format }: { format: FormatVisuel }) {
  const story = format === "story";
  return (
    <CadreVisuel
      format={format}
      fond="creme"
      decor={<DisqueDecor x={540} y={story ? 680 : 430} rayon={story ? 330 : 230} fond={c.jaune} points={c.jaune} />}
    >
      <Logo className={`w-auto ${story ? "h-[96px]" : "h-[76px]"}`} />
      <Mascotte expression="miam" className={story ? "size-[620px]" : "size-[430px]"} />
      <h1 className={`font-titre leading-[1.02] font-extrabold tracking-[-0.02em] ${story ? "text-[132px]" : "text-[104px]"}`}>
        Sauve une table,
        <br />
        <mark className="bg-transparent bg-[linear-gradient(transparent_58%,var(--color-jaune)_58%)] px-3 text-encre">régale-toi.</mark>
      </h1>
      <p className={`max-w-[880px] font-medium ${story ? "text-[44px] leading-[1.3]" : "text-[36px] leading-[1.3]"}`}>
        {lierPonctuation("Des restos, pâtisseries, bars et sorties indépendants ont besoin de monde. Toi, tu as faim : ça tombe bien.")}
      </p>
      <PastilleSite grande={story} />
    </CadreVisuel>
  );
}
