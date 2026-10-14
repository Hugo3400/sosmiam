import { Logo } from "~/composants/interface/Logo";
import { QrCode } from "~/composants/kit-media-pro/QrCode";
import { Ecusson } from "~/composants/marque/Ecusson";
import { LIEN_INSCRIRE_LIEU, LIEN_INSCRIRE_LIEU_COURT } from "~/contenus/kit-media-pro";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  face: "recto" | "verso";
  prenom: string;
  ville: string;
};

/**
 * La carte de visite d'un ambassadeur certifié (maquette « Carte de visite d'ambassadeur », validée par Hugo le 14 octobre
 * 2026), dessinée sur 510 × 330 px (la proportion de 85 × 55 mm). Recto : son prénom et sa ville, l'écusson ; verso : « Ton
 * lieu sur SOS Miam, c'est gratuit » et un QR vers « J'inscris mon lieu ».
 */
export function CarteVisiteAmbassadeur({ face, prenom, ville }: Props) {
  if (face === "recto") {
    return (
      <div className="flex h-[330px] w-[510px] shrink-0 overflow-hidden rounded-[14px] bg-jaune px-[30px] py-[26px] text-encre [print-color-adjust:exact] print:rounded-none">
        <div className="flex flex-1 flex-col justify-between">
          <Logo className="h-[30px] w-auto self-start" />
          <p className="font-titre text-[30px] leading-none font-extrabold tracking-[-0.03em]">Ambassadeur<br />SOS Miam</p>
          <div className="flex flex-col gap-[4px]">
            <p className="line-clamp-1 font-titre text-[24px] leading-tight font-extrabold [overflow-wrap:anywhere]">{prenom}</p>
            <p className="line-clamp-1 text-[15px] font-semibold">{ville}</p>
          </div>
        </div>
        <Ecusson ruban="Ambassadeur" className="size-[150px] shrink-0 self-center" />
      </div>
    );
  }
  return (
    <div className="flex h-[330px] w-[510px] shrink-0 overflow-hidden rounded-[14px] bg-encre px-[30px] py-[26px] text-creme [print-color-adjust:exact] print:rounded-none">
      <div className="flex flex-1 flex-col justify-between">
        <p className="font-titre text-[26px] leading-[1.05] font-extrabold tracking-[-0.03em]">
          Ton lieu sur<br />SOS Miam,<br /><span className="text-jaune">c'est gratuit.</span>
        </p>
        <p className="pr-[12px] text-[12px] leading-[1.4] font-medium">{lierPonctuation("Ta fiche, des avis vérifiés, le SOS « place ce soir ». Pas d'abonnement, pas de commission.")}</p>
        <p className="text-[11px] font-bold text-jaune-clair">{LIEN_INSCRIRE_LIEU_COURT}</p>
      </div>
      <div className="self-center rounded-[12px] bg-white p-[8px]">
        <QrCode lien={LIEN_INSCRIRE_LIEU} className="block size-[130px]" />
      </div>
    </div>
  );
}
