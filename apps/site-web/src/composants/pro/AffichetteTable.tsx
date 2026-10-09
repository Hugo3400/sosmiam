import { Logo } from "~/composants/interface/Logo";
import { Mascotte } from "~/composants/marque/Mascotte";
import { QrCode } from "~/composants/kit-media-pro/QrCode";

type Props = {
  nom: string;
  /** Adresse complète de la fiche publique, vers laquelle mène le QR */
  lien: string;
};

/**
 * L'affichette de table au format A6 (105 × 148 mm) : le nom du lieu, un QR vers sa fiche publique, le logo. À l'écran,
 * un aperçu à la même proportion ; à l'impression, la page A6 entière (voir routes/pro/affichette.tsx, règle @page).
 * Les couleurs sont imprimées telles quelles (print-color-adjust), le fond jaune compris.
 */
export function AffichetteTable({ nom, lien }: Props) {
  return (
    <div
      className="relative mx-auto flex aspect-[105/148] w-full max-w-[360px] flex-col items-center overflow-hidden rounded-carte border-2 border-encre bg-jaune
        px-[7%] pt-[8%] pb-[6%] text-center text-encre shadow-brut-grand [print-color-adjust:exact]
        print:m-0 print:h-[148mm] print:w-[105mm] print:max-w-none print:rounded-none print:border-0 print:shadow-none"
    >
      <Logo className="h-auto w-[52%]" />
      <p className="mt-[5%] font-titre text-[clamp(.8rem,4.2vw,1.05rem)] font-extrabold print:text-[11pt]">Tu as passé un bon moment ?</p>
      <p className="mt-[3%] line-clamp-2 font-titre text-[clamp(1.2rem,7vw,1.75rem)] leading-tight font-extrabold [overflow-wrap:anywhere] print:text-[19pt]">{nom}</p>
      <div className="mt-[5%] w-[56%] rounded-2xl border-2 border-encre bg-white p-[2.5%]">
        <QrCode lien={lien} className="block h-auto w-full" />
      </div>
      <p className="mt-[4%] text-[clamp(.7rem,3.4vw,.9rem)] font-semibold print:text-[9pt]">
        Scanne pour retrouver notre fiche sur SOS Miam : horaires, infos pratiques et plein d'autres pépites du coin.
      </p>
      <p className="mt-auto pt-[3%] font-titre text-[clamp(.75rem,3.6vw,.95rem)] font-extrabold print:text-[10pt]">sosmiam.fr</p>
      <Mascotte expression="clin" className="absolute -right-[6%] -bottom-[4%] h-auto w-[24%] rotate-12" />
    </div>
  );
}
