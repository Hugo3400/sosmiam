import { BouclierMiamSafe } from "~/composants/marque/BouclierMiamSafe";
import { formatsKitLieux, texteLieuMiamSafe as t } from "~/contenus/kit-media-lieux";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

const { largeur, hauteur } = formatsKitLieux.autocollant;

/**
 * Autocollant rond de vitrine « Lieu Miam Safe » (10 cm, 300 dpi), sur un carré blanc : on découpe le cercle. Pour les
 * lieux qui ont signé la charte : la phrase à dire au comptoir, rien de plus.
 */
export function AutocollantMiamSafe() {
  return (
    <div className="grid place-items-center bg-white" style={{ width: largeur, height: hauteur }}>
      <div className="flex size-[1141px] flex-col items-center justify-center gap-[34px] rounded-full border-[14px] border-jaune bg-encre px-[120px] text-center text-creme">
        <BouclierMiamSafe clair className="h-[300px] w-auto" />
        <p className="font-titre text-[128px] leading-[0.95] font-extrabold tracking-[-0.03em]">
          Lieu
          <br />
          Miam Safe
        </p>
        <div className="flex flex-col items-center gap-[10px]">
          <p className="text-[46px] font-semibold text-jaune-clair">{lierPonctuation(t.intro)}</p>
          <p className="font-titre text-[66px] leading-none font-extrabold whitespace-nowrap text-jaune">{lierPonctuation(`« ${t.phrase} »`)}</p>
        </div>
      </div>
    </div>
  );
}
