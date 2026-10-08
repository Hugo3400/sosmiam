import { Logo } from "~/composants/interface/Logo";
import { CadreVisuel, type FormatVisuel } from "~/composants/kit-media/CadreVisuel";
import { DisqueDecor } from "~/composants/kit-media/DisqueDecor";
import { PastilleSite } from "~/composants/kit-media/PastilleSite";
import { couleursMarque as c } from "~/composants/marque/couleurs-marque";
import { Ecusson } from "~/composants/marque/Ecusson";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

/** Visuel « Je suis ambassadeur SOS Miam » (kit média) : l'écusson Ambassadeur sur fond jaune, le logo pour « SOS Miam ». */
export function VisuelJeSuisAmbassadeur({ format }: { format: FormatVisuel }) {
  const story = format === "story";
  return (
    <CadreVisuel
      format={format}
      fond="jaune"
      decor={<DisqueDecor x={540} y={story ? 560 : 300} rayon={story ? 360 : 250} fond={c.jauneClair} points={c.blanc} />}
    >
      <Ecusson ruban="AMBASSADEUR" className={`-rotate-6 ${story ? "size-[600px]" : "size-[420px]"}`} />
      <div className="flex flex-col items-center">
        <h1 className={`font-titre leading-[0.95] font-extrabold tracking-[-0.02em] ${story ? "text-[124px]" : "text-[100px]"}`}>
          Je suis
          <br />
          ambassadeur
        </h1>
        <Logo className={`mt-6 w-auto ${story ? "h-[150px]" : "h-[112px]"}`} />
      </div>
      <p className={`max-w-[880px] font-medium ${story ? "text-[44px] leading-[1.3]" : "text-[36px] leading-[1.3]"}`}>
        {lierPonctuation("Je déniche les restos, pâtisseries, bars et sorties indépendants qui ont besoin de monde.")}
      </p>
      <PastilleSite grande={story} />
    </CadreVisuel>
  );
}
