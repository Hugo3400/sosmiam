import { Logo } from "~/composants/interface/Logo";
import { CadreVisuel, type FormatVisuel } from "~/composants/kit-media/CadreVisuel";
import { PastilleSite } from "~/composants/kit-media/PastilleSite";
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
    <CadreVisuel format={format} fond="encre">
      <Logo clair className={`w-auto ${story ? "h-[96px]" : "h-[72px]"}`} />
      <ul className={`grid grid-cols-2 ${story ? "gap-11" : "gap-8"}`}>
        {pictos.map((picto) => (
          <li key={picto.type}>
            <PictoCategorie type={picto.type} className={`${picto.rotation} ${story ? "size-[220px]" : "size-[160px]"}`} />
          </li>
        ))}
      </ul>
      <h1 className={`font-titre leading-[1.05] font-extrabold tracking-[-0.02em] ${story ? "text-[112px]" : "text-[92px]"}`}>
        {lierPonctuation("Tu as un lieu ?")}
        <br />
        <span className="text-jaune">C’est gratuit.</span>
      </h1>
      <div className={`max-w-[880px] leading-[1.3] text-balance ${story ? "text-[44px]" : "text-[35px]"}`}>
        <p className="font-medium">{lierPonctuation("Resto, pâtisserie, bar ou sortie indépendante : inscris ton lieu sur SOS Miam.")}</p>
        <p className={`font-bold text-jaune-clair ${story ? "mt-5" : "mt-3"}`}>Sans abonnement, sans commission.</p>
      </div>
      <PastilleSite sombre grande={story} />
    </CadreVisuel>
  );
}
