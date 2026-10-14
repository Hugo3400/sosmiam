import { BouclierMiamSafe } from "~/composants/marque/BouclierMiamSafe";
import { Mascotte } from "~/composants/marque/Mascotte";
import { PHRASE_MIAM_SAFE } from "~/contenus/charte-miam-safe";
import { formatsKitLieux, texteMemoEquipe as t } from "~/contenus/kit-media-lieux";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

const { largeur, hauteur } = formatsKitLieux.A5;

/**
 * Mémo d'équipe Miam Safe (A5, 300 dpi : 1748 × 2480 px), à garder derrière le comptoir : la phrase, l'écran sombre à
 * reconnaître, les quatre gestes, l'alerte du téléphone pro et les numéros des secours.
 */
export function MemoEquipeMiamSafe() {
  return (
    <div className="flex flex-col bg-creme text-encre" style={{ width: largeur, height: hauteur }}>
      <div className="flex flex-1 flex-col gap-[70px] px-[120px] pt-[110px]">
        <p className="flex items-center gap-[24px] text-[46px] font-bold">
          <BouclierMiamSafe className="h-[64px] w-auto" />
          {lierPonctuation(t.surtitre)}
        </p>

        <div className="flex items-center gap-[60px]">
          <div className="flex-1">
            <p className="text-[44px] font-bold tracking-[0.08em] text-gris uppercase">{lierPonctuation(t.siOnTeDit)}</p>
            <p className="mt-[20px] font-titre text-[150px] leading-[0.98] font-extrabold tracking-[-0.03em]">{lierPonctuation(`« ${PHRASE_MIAM_SAFE} »`)}</p>
            <p className="mt-[34px] text-[46px] leading-[1.3] font-semibold">{lierPonctuation(t.ouEcran)}</p>
          </div>
          <div className="flex h-[700px] w-[380px] shrink-0 flex-col items-center justify-center gap-[24px] rounded-[64px] border-[16px] border-black bg-encre px-[30px] text-center">
            <Mascotte expression="clin" className="size-[170px]" />
            <span className="rounded-full border-[4px] border-jaune px-[20px] py-[6px] text-[26px] font-bold text-jaune">Miam Safe</span>
            <span className="font-titre text-[40px] leading-[1.1] font-extrabold text-creme">{lierPonctuation(PHRASE_MIAM_SAFE)}</span>
          </div>
        </div>

        <ol className="border-t-[6px] border-encre">
          {t.gestes.map((geste, position) => (
            <li key={geste.titre} className="flex items-baseline gap-[40px] border-b-[3px] border-ligne py-[30px]">
              <span className="w-[60px] shrink-0 font-titre text-[72px] font-extrabold">{position + 1}</span>
              <p className="text-[46px] leading-[1.3]">
                <strong className="font-extrabold">{lierPonctuation(geste.titre)}</strong> {lierPonctuation(geste.texte)}
              </p>
            </li>
          ))}
        </ol>

        <p className="rounded-[44px] bg-jaune px-[50px] py-[40px] text-[44px] leading-[1.3] font-semibold">{lierPonctuation(t.alerte)}</p>
      </div>

      <div className="mt-[60px] flex items-center justify-between bg-encre px-[120px] py-[60px] text-creme">
        <p className="text-[42px] font-semibold">{lierPonctuation(t.danger)}</p>
        <p className="font-titre text-[64px] font-extrabold text-tomate">{t.numeros}</p>
      </div>
    </div>
  );
}
