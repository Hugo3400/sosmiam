import { Logo } from "~/composants/interface/Logo";
import { Mascotte } from "~/composants/marque/Mascotte";
import { formatsKitLieux } from "~/contenus/kit-media-lieux";

const { largeur, hauteur } = formatsKitLieux.autocollant;

/** Autocollant rond de vitrine « On est sur SOS Miam » (10 cm, 300 dpi), sur un carré blanc : on découpe le cercle. */
export function AutocollantSosMiam() {
  return (
    <div className="grid place-items-center bg-white" style={{ width: largeur, height: hauteur }}>
      <div className="flex size-[1141px] flex-col items-center justify-center gap-[34px] rounded-full border-[14px] border-encre bg-jaune text-center text-encre">
        <Mascotte expression="miam" className="size-[330px]" />
        <p className="font-titre text-[118px] leading-[0.98] font-extrabold tracking-[-0.02em]">
          On est sur
        </p>
        <Logo className="h-[150px] w-auto" />
        <p className="rounded-full bg-encre px-[56px] py-[20px] font-titre text-[64px] leading-none font-extrabold text-jaune">sosmiam.fr</p>
      </div>
    </div>
  );
}
