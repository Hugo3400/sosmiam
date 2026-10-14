import { Logo } from "~/composants/interface/Logo";
import { QrCode } from "~/composants/kit-media-pro/QrCode";
import { BouclierMiamSafe } from "~/composants/marque/BouclierMiamSafe";
import { Mascotte } from "~/composants/marque/Mascotte";
import { ENGAGEMENTS_CHARTE_MIAM_SAFE } from "~/contenus/charte-miam-safe";
import { LIEN_ESPACE_PRO, LIEN_ESPACE_PRO_COURT, formatsImpression, texteAfficheMiamSafe } from "~/contenus/kit-media-pro";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

const { largeur, hauteur } = formatsImpression.A4;

/**
 * Fiche A4 « Miam Safe » du kit média pro, dessinée à 300 dpi : 2480 × 3508 px. Pour montrer à un gérant ce que la charte
 * demande à son équipe, et où la signer (QR vers l'espace pro). Aucune promesse de sécurité.
 */
export function AfficheMiamSafeA4() {
  const t = texteAfficheMiamSafe;
  return (
    <div className="flex flex-col items-center justify-between bg-creme px-[190px] pt-[170px] pb-[130px] text-center text-encre" style={{ width: largeur, height: hauteur }}>
      <div className="flex flex-col items-center gap-[40px]">
        <Logo className="h-[180px] w-auto" />
        <p className="text-[54px] font-bold tracking-[0.12em] uppercase">{t.surtitre}</p>
      </div>

      <div className="flex flex-col items-center gap-[50px]">
        <h1 className="flex items-center gap-[60px] font-titre text-[230px] leading-none font-extrabold tracking-[-0.03em]">
          <BouclierMiamSafe className="h-[220px] w-auto" />
          Miam Safe
        </h1>
        <p className="max-w-[1900px] text-[72px] leading-[1.25] font-medium text-balance">{lierPonctuation(t.sousTitre)}</p>
      </div>

      <div className="w-full rounded-[70px] border-[10px] border-encre bg-white px-[90px] py-[80px] text-left shadow-[24px_24px_0_var(--color-encre)]">
        <p className="font-titre text-[80px] leading-none font-extrabold">{lierPonctuation(t.titreEngagements)}</p>
        <ol className="mt-[50px] grid gap-[44px]">
          {ENGAGEMENTS_CHARTE_MIAM_SAFE.map((e, position) => (
            <li key={e.titre} className="flex items-start gap-[44px]">
              <span className="grid size-[100px] shrink-0 place-items-center rounded-full border-[8px] border-encre bg-jaune font-titre text-[58px] font-extrabold">{position + 1}</span>
              <div>
                <p className="font-titre text-[56px] leading-[1.1] font-extrabold">{lierPonctuation(e.titre)}</p>
                <p className="mt-[14px] text-[42px] leading-[1.32]">{lierPonctuation(e.texte)}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <p className="w-full rounded-full bg-encre px-[60px] py-[44px] font-titre text-[62px] leading-none font-extrabold text-jaune">{lierPonctuation(t.bandeau)}</p>

      <div className="flex w-full items-center justify-between">
        <Mascotte expression="clin" className="size-[400px] shrink-0" />
        <div className="flex items-center gap-[70px] rounded-[60px] border-[10px] border-encre bg-white py-[50px] pr-[80px] pl-[50px]">
          <QrCode lien={LIEN_ESPACE_PRO} className="size-[520px] shrink-0" />
          <div className="text-left">
            <p className="max-w-[760px] font-titre text-[96px] leading-[1.05] font-extrabold text-balance">{lierPonctuation(t.appelQr)}</p>
            <p className="mt-[36px] text-[48px] leading-[1.2] font-semibold whitespace-nowrap">{LIEN_ESPACE_PRO_COURT}</p>
          </div>
        </div>
      </div>

      <p className="max-w-[2000px] text-[42px] leading-[1.3] text-balance">{lierPonctuation(t.piedDePage)}</p>
    </div>
  );
}
