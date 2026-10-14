import { Logo } from "~/composants/interface/Logo";
import { QrCode } from "~/composants/kit-media-pro/QrCode";
import { BouclierMiamSafe } from "~/composants/marque/BouclierMiamSafe";
import { Mascotte } from "~/composants/marque/Mascotte";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

/** Hauteur de l'affiche : A4 et A3 (1123), ou rallongée pour le 40 × 60 cm (1191) : la colonne répartit la place */
export const HAUTEURS_AFFICHE_VITRINE = { a4: 1123, a3: 1123, "40x60": 1191 } as const;

type Props = {
  nom: string;
  /** Adresse complète de la fiche publique, vers laquelle mène le QR */
  lien: string;
  /** La même, sans « https:// », écrite sous le QR */
  lienCourt: string;
  /** Le lieu a signé la charte Miam Safe : la pastille « Lieu Miam Safe » en bas */
  miamSafe: boolean;
  hauteur: number;
};

/**
 * L'affiche de vitrine au nom du lieu (maquette « Vitrine · au nom du lieu », validée par Hugo le 14 octobre 2026),
 * dessinée sur 794 px de large (une page A4 à 96 points par pouce) : la page la met à l'échelle de l'écran ou du papier.
 * Le nom du lieu, un grand QR vers sa fiche, « Tu t'es régalé ? » ; la pastille Miam Safe seulement si la charte est signée.
 */
export function AfficheVitrineLieu({ nom, lien, lienCourt, miamSafe, hauteur }: Props) {
  // Un nom long passe sur trois lignes au plus, un peu plus petit
  const taillesNom = nom.length > 40 ? "text-[50px]" : nom.length > 24 ? "text-[60px]" : "text-[72px]";
  return (
    <div
      className="flex w-[794px] flex-col items-center justify-between bg-jaune px-[56px] pt-[52px] pb-[44px] text-center text-encre [print-color-adjust:exact]"
      style={{ height: hauteur }}
    >
      <Logo className="h-[52px] w-auto" />

      <div className="flex flex-col items-center gap-[14px]">
        <p className="text-[26px] font-bold">Retrouve-nous sur SOS Miam</p>
        <h1 className={`line-clamp-3 max-w-[680px] font-titre ${taillesNom} leading-none font-extrabold tracking-[-0.03em] text-balance [overflow-wrap:anywhere]`}>{nom}</h1>
      </div>

      <div className="flex items-center gap-[26px] rounded-[30px] border-[5px] border-encre bg-white py-[22px] pr-[30px] pl-[22px] shadow-[10px_10px_0_var(--color-encre)]">
        <QrCode lien={lien} className="size-[220px] shrink-0" />
        <div className="text-left">
          <p className="font-titre text-[40px] leading-[1.05] font-extrabold">Scanne pour<br />voir notre fiche</p>
          <p className="mt-[12px] text-[17px] font-semibold">Horaires, carte, infos pratiques</p>
          <p className="mt-[6px] text-[18px] font-bold">{lienCourt}</p>
        </div>
      </div>

      <div className="flex items-center gap-[22px] rounded-[26px] bg-encre px-[30px] py-[22px] text-creme">
        <Mascotte expression="clin" className="size-[96px] shrink-0" />
        <div className="text-left">
          <p className="font-titre text-[30px] font-extrabold text-jaune">Tu t'es régalé ?</p>
          <p className="mt-[6px] text-[18px] font-medium">{lierPonctuation("Laisse-nous un avis vérifié après ta visite. Bientôt dans l'app.")}</p>
        </div>
      </div>

      <div className="flex w-full items-center justify-between gap-[24px]">
        {miamSafe ? (
          <div className="flex items-center gap-[12px] rounded-full border-[3px] border-encre bg-creme py-[8px] pr-[18px] pl-[10px]">
            <BouclierMiamSafe className="h-[34px] w-[30px]" />
            <span className="text-left text-[16px] leading-[1.25] font-bold">
              Lieu Miam Safe
              <br />
              <span className="font-medium">{lierPonctuation("Pas à l'aise ? « Le Capitaine est là ? »")}</span>
            </span>
          </div>
        ) : <span />}
        <div className="text-right text-[14px] leading-[1.6] font-semibold">
          <p>Gratuit pour les lieux</p>
          <p>TikTok @sos.miam · Instagram @official.sosmiam</p>
        </div>
      </div>
    </div>
  );
}
