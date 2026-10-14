import { Logo } from "~/composants/interface/Logo";
import { QrCode } from "~/composants/kit-media-pro/QrCode";
import { Mascotte } from "~/composants/marque/Mascotte";

type Props = {
  nom: string;
  /** Adresse complète de la fiche publique, vers laquelle mène le QR */
  lien: string;
  /** La face de droite porte le trait de pliage, en pointillés, sur son bord gauche */
  pli?: boolean;
};

/**
 * Une face du chevalet de table (maquette « Chevalet de table », validée par Hugo le 14 octobre 2026), dessinée sur
 * 420 × 593 px (la proportion d'un A6) : la page en met deux côte à côte, à plier au milieu.
 */
export function FaceChevaletTable({ nom, lien, pli = false }: Props) {
  const tailleNom = nom.length > 30 ? "text-[26px]" : nom.length > 18 ? "text-[30px]" : "text-[36px]";
  return (
    <div
      className={`flex h-[593px] w-[420px] shrink-0 flex-col items-center justify-between bg-jaune px-[30px] pt-[30px] pb-[22px] text-center text-encre [print-color-adjust:exact] ${pli ? "border-l-2 border-dashed border-gris" : ""}`}
    >
      <Logo className="h-[32px] w-auto" />
      <div className="flex flex-col items-center gap-[8px]">
        <p className="text-[16px] font-bold">On est sur SOS Miam !</p>
        <p className={`line-clamp-3 font-titre ${tailleNom} leading-none font-extrabold tracking-[-0.03em] text-balance [overflow-wrap:anywhere]`}>{nom}</p>
      </div>
      <div className="rounded-[18px] border-[3px] border-encre bg-white p-[10px]">
        <QrCode lien={lien} className="block size-[170px]" />
      </div>
      <p className="font-titre text-[24px] leading-[1.1] font-extrabold tracking-[-0.03em]">Scanne pour voir<br />notre fiche</p>
      <div className="flex items-center gap-[12px]">
        <Mascotte expression="clin" className="size-[60px] shrink-0" />
        <p className="text-left text-[13px] leading-[1.35] font-semibold">Tu t'es régalé ? Laisse-nous<br />un avis après ta visite.</p>
      </div>
    </div>
  );
}
