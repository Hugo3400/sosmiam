import { Logo } from "~/composants/interface/Logo";
import { CadreVisuel, type FormatVisuel } from "~/composants/kit-media/CadreVisuel";
import { DisqueDecor } from "~/composants/kit-media/DisqueDecor";
import { PastilleSite } from "~/composants/kit-media/PastilleSite";
import { couleursMarque as c } from "~/composants/marque/couleurs-marque";
import { PictoCategorie } from "~/composants/marque/PictoCategorie";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import type { CategorieLieu } from "~/types/lieux";

// Les quatre pictos, un peu penchés chacun de leur côté
const pictos: { type: CategorieLieu; rotation: string }[] = [
  { type: "resto", rotation: "-rotate-6" },
  { type: "patisserie", rotation: "rotate-3" },
  { type: "bar", rotation: "-rotate-3" },
  { type: "sortie", rotation: "rotate-6" },
];

/** Visuel « Tu as un lieu ? C'est gratuit » (kit média), pour les restaurateurs et les lieux : fond noir, pictos jaunes. */
export function VisuelTuAsUnLieu({ format }: { format: FormatVisuel }) {
  const story = format === "story";
  return (
    <CadreVisuel
      format={format}
      fond="encre"
      decor={<DisqueDecor x={540} y={story ? 600 : 360} rayon={story ? 330 : 230} fond="none" points={c.jaune} />}
    >
      <Logo clair className={`w-auto ${story ? "h-[96px]" : "h-[76px]"}`} />
      <ul className={`grid grid-cols-2 ${story ? "gap-10" : "gap-7"}`}>
        {pictos.map((picto) => (
          <li key={picto.type}>
            <PictoCategorie type={picto.type} className={`${picto.rotation} ${story ? "size-[210px]" : "size-[150px]"}`} />
          </li>
        ))}
      </ul>
      <h1 className={`font-titre leading-[1.02] font-extrabold tracking-[-0.02em] ${story ? "text-[132px]" : "text-[104px]"}`}>
        {lierPonctuation("Tu as un lieu ?")}
        <br />
        <span className="text-jaune">C'est gratuit.</span>
      </h1>
      <p className={`max-w-[880px] font-medium text-creme ${story ? "text-[44px] leading-[1.3]" : "text-[36px] leading-[1.3]"}`}>
        {lierPonctuation("Resto, pâtisserie, bar ou sortie indépendante : inscris ton lieu sur sosmiam.fr. Sans abonnement, sans commission.")}
      </p>
      <PastilleSite sombre grande={story} />
    </CadreVisuel>
  );
}
