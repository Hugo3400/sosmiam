import { Logo } from "~/composants/interface/Logo";
import { QrCode } from "~/composants/kit-media-pro/QrCode";
import { LIEN_INSCRIRE_LIEU, LIEN_INSCRIRE_LIEU_COURT, formatsImpression, texteFlyerVerso } from "~/contenus/kit-media-pro";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

const { largeur, hauteur } = formatsImpression.A6;

/** Verso du flyer A6 du kit média pro (comment s'inscrire, avec le QR code), dessiné à 300 dpi : 1240 × 1748 px. */
export function FlyerVerso() {
  return (
    <div className="flex flex-col justify-between bg-jaune px-[96px] pt-[96px] pb-[84px] text-encre" style={{ width: largeur, height: hauteur }}>
      <h1 className="font-titre text-[112px] leading-[1.02] font-extrabold tracking-[-0.025em]">
        {texteFlyerVerso.titre}
        <br />
        {texteFlyerVerso.titreFin}
      </h1>

      <ol className="flex flex-col gap-[30px]">
        {texteFlyerVerso.etapes.map((etape, i) => (
          <li key={etape} className="flex items-start gap-[30px]">
            <span className="grid size-[68px] shrink-0 place-items-center rounded-full bg-encre font-titre text-[42px] font-extrabold text-jaune">{i + 1}</span>
            <p className="pt-[8px] text-[38px] leading-[1.3] font-medium">{lierPonctuation(etape)}</p>
          </li>
        ))}
      </ol>

      <div className="flex items-center gap-[44px] rounded-[40px] border-[6px] border-encre bg-white p-[30px] shadow-[12px_12px_0_var(--color-encre)]">
        <QrCode lien={LIEN_INSCRIRE_LIEU} className="size-[400px] shrink-0" />
        <div>
          <p className="font-titre text-[54px] leading-[1.08] font-extrabold">{texteFlyerVerso.appelQr}</p>
          <p className="mt-[24px] text-[30px] leading-[1.25] font-semibold break-all">{LIEN_INSCRIRE_LIEU_COURT}</p>
        </div>
      </div>

      <p className="rounded-[28px] bg-encre px-[40px] py-[28px] text-center font-titre text-[40px] leading-[1.2] font-extrabold text-jaune text-balance">
        {lierPonctuation(texteFlyerVerso.gratuit)}
      </p>

      <div className="flex items-end justify-between gap-[40px] text-[30px] leading-[1.3]">
        <div className="grow">
          <p className="font-semibold">{lierPonctuation(texteFlyerVerso.deLaPartDe)}</p>
          <div className="mt-[54px] border-b-[4px] border-dotted border-encre" />
          <p className="mt-[24px]">{lierPonctuation(texteFlyerVerso.question)}</p>
        </div>
        <Logo avecTexte={false} className="size-[150px] shrink-0" />
      </div>
    </div>
  );
}
