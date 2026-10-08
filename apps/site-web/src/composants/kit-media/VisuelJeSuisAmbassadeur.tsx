import { Logo } from "~/composants/interface/Logo";
import { CadreVisuel, type FormatVisuel } from "~/composants/kit-media/CadreVisuel";
import { DisqueDecor } from "~/composants/kit-media/DisqueDecor";
import { PastilleSite } from "~/composants/kit-media/PastilleSite";
import { TraitSouligne } from "~/composants/kit-media/TraitSouligne";
import { couleursMarque as c } from "~/composants/marque/couleurs-marque";
import { Ecusson } from "~/composants/marque/Ecusson";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

/** Visuel « Je suis ambassadeur SOS Miam » (kit média) : l'écusson Ambassadeur sur fond jaune, le logo pour « SOS Miam ». */
export function VisuelJeSuisAmbassadeur({ format }: { format: FormatVisuel }) {
  const story = format === "story";
  return (
    <CadreVisuel format={format} fond="jaune">
      <div className="relative">
        <DisqueDecor rayon={story ? 270 : 205} fond={c.jauneClair} points={c.blanc} />
        <Ecusson ruban="AMBASSADEUR" className={`relative -rotate-6 ${story ? "size-[520px]" : "size-[390px]"}`} />
      </div>
      <div className="flex flex-col items-center">
        <h1 className={`font-titre leading-[1.02] font-extrabold tracking-[-0.02em] ${story ? "text-[118px]" : "text-[96px]"}`}>
          Je suis
          <br />
          <span className="relative">
            ambassadeur
            <TraitSouligne couleur={c.blanc} epaisseur={story ? 16 : 13} />
          </span>
        </h1>
        <Logo className={`w-auto ${story ? "mt-14 h-[132px]" : "mt-11 h-[100px]"}`} />
      </div>
      <p className={`max-w-[860px] font-medium text-balance ${story ? "text-[44px] leading-[1.3]" : "text-[36px] leading-[1.3]"}`}>
        {lierPonctuation("Je déniche les restos, pâtisseries, bars et sorties indépendants qui ont besoin de monde.")}
      </p>
      <PastilleSite grande={story} />
    </CadreVisuel>
  );
}
