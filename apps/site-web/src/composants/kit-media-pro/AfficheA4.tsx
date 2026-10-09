import { Logo } from "~/composants/interface/Logo";
import { PuceAtout } from "~/composants/kit-media-pro/PuceAtout";
import { QrCode } from "~/composants/kit-media-pro/QrCode";
import { TraitSouligne } from "~/composants/kit-media/TraitSouligne";
import { couleursMarque as c } from "~/composants/marque/couleurs-marque";
import { Mascotte } from "~/composants/marque/Mascotte";
import { LIEN_INSCRIRE_LIEU, LIEN_INSCRIRE_LIEU_COURT, formatsImpression, texteAffiche } from "~/contenus/kit-media-pro";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

const { largeur, hauteur } = formatsImpression.A4;

/**
 * Affiche A4 du kit média pro (« Ton lieu sur SOS Miam, c'est gratuit »), dessinée à 300 dpi : 2480 × 3508 px.
 * Fond jaune, les atouts sur une carte blanche, et un grand QR code vers « J'inscris mon lieu ».
 */
export function AfficheA4() {
  return (
    <div className="flex flex-col items-center justify-between bg-jaune px-[190px] pt-[170px] pb-[130px] text-center text-encre" style={{ width: largeur, height: hauteur }}>
      <Logo className="h-[210px] w-auto" />

      <h1 className="font-titre text-[218px] leading-[1.02] text-balance font-extrabold tracking-[-0.025em]">
        {lierPonctuation(texteAffiche.titre).replace("SOS Miam", "SOS\u00a0Miam")}
        <br />
        <span className="relative">
          {texteAffiche.titreFin.replace("'", "’")}
          <TraitSouligne couleur={c.tomate} epaisseur={26} />
        </span>
      </h1>

      <p className="mt-[40px] max-w-[1900px] text-[80px] leading-[1.25] font-medium text-balance">{lierPonctuation(texteAffiche.sousTitre)}</p>

      <ul className="grid w-full grid-cols-2 gap-x-[80px] gap-y-[70px] rounded-[70px] border-[10px] border-encre bg-white px-[90px] py-[90px] text-left shadow-[24px_24px_0_var(--color-encre)]">
        {texteAffiche.atouts.map((atout) => (
          <li key={atout.titre} className="flex items-start gap-[40px]">
            <PuceAtout className="mt-[6px] size-[96px]" />
            <div>
              <p className="font-titre text-[70px] leading-[1.08] font-extrabold">{lierPonctuation(atout.titre)}</p>
              <p className="mt-[18px] text-[56px] leading-[1.3]">{lierPonctuation(atout.texte)}</p>
            </div>
          </li>
        ))}
      </ul>

      <p className="w-full rounded-full bg-encre px-[60px] py-[44px] font-titre text-[64px] leading-none font-extrabold text-jaune">
        {texteAffiche.bandeau}
      </p>

      <div className="flex w-full items-center justify-between">
        <Mascotte expression="clin" className="size-[480px] shrink-0" />
        <div className="flex items-center gap-[70px] rounded-[60px] border-[10px] border-encre bg-white py-[50px] pr-[80px] pl-[50px]">
          <QrCode lien={LIEN_INSCRIRE_LIEU} className="size-[640px] shrink-0" />
          <div className="text-left">
            <p className="max-w-[700px] font-titre text-[104px] leading-[1.05] font-extrabold text-balance">{texteAffiche.appelQr}</p>
            <p className="mt-[40px] text-[42px] leading-[1.2] font-semibold whitespace-nowrap">{LIEN_INSCRIRE_LIEU_COURT}</p>
          </div>
        </div>
      </div>

      <p className="text-[44px] leading-[1.3]">{lierPonctuation(texteAffiche.piedDePage)}</p>
    </div>
  );
}
