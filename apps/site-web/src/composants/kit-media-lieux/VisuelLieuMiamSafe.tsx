import { Logo } from "~/composants/interface/Logo";
import { CadreVisuel, type FormatVisuel } from "~/composants/kit-media/CadreVisuel";
import { PastilleSite } from "~/composants/kit-media/PastilleSite";
import { BouclierMiamSafe } from "~/composants/marque/BouclierMiamSafe";
import { Mascotte } from "~/composants/marque/Mascotte";
import { texteLieuMiamSafe as t } from "~/contenus/kit-media-lieux";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

/**
 * Visuel « Ici, on est Miam Safe » du kit des lieux (lieux qui ont signé la charte) : fond noir, le bouclier, la phrase à
 * dire au comptoir. Aucune promesse de sécurité : l'équipe vient voir la personne, discrètement.
 */
export function VisuelLieuMiamSafe({ format }: { format: FormatVisuel }) {
  const story = format === "story";
  return (
    <CadreVisuel format={format} fond="encre">
      <Logo clair className={`w-auto ${story ? "h-[80px]" : "h-[60px]"}`} />
      <BouclierMiamSafe clair className={story ? "h-[300px] w-auto" : "h-[200px] w-auto"} />
      <h1 className={`font-titre leading-[1.02] font-extrabold tracking-[-0.03em] text-balance ${story ? "text-[120px]" : "text-[96px]"}`}>
        {lierPonctuation(t.titre)}
      </h1>
      <div className={`flex flex-col items-center gap-3 rounded-[36px] border-4 border-jaune ${story ? "px-12 py-10" : "px-10 py-7"}`}>
        <p className={`font-semibold text-jaune-clair ${story ? "text-[36px]" : "text-[30px]"}`}>{lierPonctuation(t.intro)}</p>
        <p className={`font-titre leading-none font-extrabold whitespace-nowrap text-jaune ${story ? "text-[66px]" : "text-[56px]"}`}>
          {lierPonctuation(`« ${t.phrase} »`)}
        </p>
        <p className={`font-medium ${story ? "text-[36px]" : "text-[30px]"}`}>{lierPonctuation(t.suite)}</p>
      </div>
      <div className="flex items-center gap-8">
        <Mascotte expression="clin" className={story ? "size-[150px]" : "size-[110px]"} />
        <PastilleSite sombre grande={story} />
      </div>
    </CadreVisuel>
  );
}
