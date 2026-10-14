import { Logo } from "~/composants/interface/Logo";
import { CadreVisuel, type FormatVisuel } from "~/composants/kit-media/CadreVisuel";
import { PastilleSite } from "~/composants/kit-media/PastilleSite";
import { BouclierMiamSafe } from "~/composants/marque/BouclierMiamSafe";
import { Mascotte } from "~/composants/marque/Mascotte";
import { PHRASE_MIAM_SAFE } from "~/contenus/charte-miam-safe";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

/**
 * Visuel « Miam Safe, bientôt dans l'app » (kit média) : fond noir, le Capitaine qui fait un clin d'œil et la phrase à dire
 * au comptoir. Aucune promesse de sécurité : un coup de main pour alerter l'équipe du lieu, discrètement.
 */
export function VisuelMiamSafe({ format }: { format: FormatVisuel }) {
  const story = format === "story";
  return (
    <CadreVisuel format={format} fond="encre">
      <div className="flex flex-col items-center gap-5">
        <Logo clair className={`w-auto ${story ? "h-[80px]" : "h-[60px]"}`} />
        <p className={`font-bold tracking-[0.14em] text-jaune uppercase ${story ? "text-[34px]" : "text-[28px]"}`}>Bientôt dans l’app</p>
      </div>
      <Mascotte expression="clin" className={story ? "size-[380px]" : "size-[250px]"} />
      <div className="flex flex-col items-center gap-6">
        <h1 className={`flex items-center gap-6 font-titre leading-none font-extrabold tracking-[-0.03em] ${story ? "text-[128px]" : "text-[104px]"}`}>
          <BouclierMiamSafe clair className={story ? "h-[120px] w-auto" : "h-[96px] w-auto"} />
          Miam Safe
        </h1>
        <p className={`max-w-[860px] leading-[1.3] font-medium text-balance ${story ? "text-[44px]" : "text-[36px]"}`}>
          {lierPonctuation("Pas à l’aise dans un lieu ? Un coup de main pour alerter l’équipe, discrètement.")}
        </p>
      </div>
      <div className={`flex flex-col items-center gap-3 rounded-[36px] border-4 border-jaune ${story ? "px-12 py-9" : "px-10 py-6"}`}>
        <p className={`font-semibold text-jaune-clair ${story ? "text-[30px]" : "text-[26px]"}`}>La phrase à dire au comptoir</p>
        <p className={`font-titre leading-none font-extrabold whitespace-nowrap text-jaune ${story ? "text-[64px]" : "text-[54px]"}`}>
          {lierPonctuation(`« ${PHRASE_MIAM_SAFE} »`)}
        </p>
      </div>
      <PastilleSite sombre grande={story} />
    </CadreVisuel>
  );
}
