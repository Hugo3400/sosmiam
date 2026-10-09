import { Logo } from "~/composants/interface/Logo";
import { PuceAtout } from "~/composants/kit-media-pro/PuceAtout";
import { TraitSouligne } from "~/composants/kit-media/TraitSouligne";
import { couleursMarque as c } from "~/composants/marque/couleurs-marque";
import { formatsImpression, texteFlyerRecto } from "~/contenus/kit-media-pro";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

const { largeur, hauteur } = formatsImpression.A6;

/** Recto du flyer A6 du kit média pro (ce que SOS Miam apporte à un lieu), dessiné à 300 dpi : 1240 × 1748 px. */
export function FlyerRecto() {
  return (
    <div className="flex flex-col justify-between bg-creme px-[96px] pt-[96px] pb-[84px] text-encre" style={{ width: largeur, height: hauteur }}>
      <Logo className="h-[104px] w-auto self-start" />

      <div>
        <h1 className="font-titre text-[128px] leading-[1.02] font-extrabold tracking-[-0.025em]">
          {texteFlyerRecto.titre}
          <br />
          <span className="relative">
            {texteFlyerRecto.titreFin}
            <TraitSouligne couleur={c.jaune} epaisseur={16} />
          </span>
        </h1>
        <p className="mt-[44px] text-[44px] leading-[1.3] font-medium">{lierPonctuation(texteFlyerRecto.intro)}</p>
      </div>

      <ul className="flex flex-col gap-[38px]">
        {texteFlyerRecto.atouts.map((atout) => (
          <li key={atout.titre} className="flex items-start gap-[30px]">
            <PuceAtout className="mt-[2px] size-[60px]" />
            <div>
              <p className="font-titre text-[48px] leading-[1.1] font-extrabold">{lierPonctuation(atout.titre)}</p>
              <p className="mt-[6px] text-[36px] leading-[1.3]">{lierPonctuation(atout.texte)}</p>
            </div>
          </li>
        ))}
      </ul>

      <p className="self-end rounded-full bg-encre px-[40px] py-[20px] font-titre text-[38px] leading-none font-extrabold text-jaune">
        {lierPonctuation(texteFlyerRecto.retourne)}
      </p>
    </div>
  );
}
