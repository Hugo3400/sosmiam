import { LogoApple } from "~/composants/compte/LogoApple";
import { LogoGoogle } from "~/composants/compte/LogoGoogle";
import { TEXTES_CONNEXION_EXTERNE_PAR_LANGUE } from "~/contenus/connexion-externe";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import type { FournisseurExterne } from "~/types/connexion-externe";

/**
 * Habits imposés par les règles de marque : Apple en noir, pomme et texte blancs (contraste 21:1) ; Google en blanc, bord
 * #747775, texte #1F1F1F (16:1) et « G » en couleurs. Même taille pour les deux, aucun des deux plus mis en avant.
 */
const habits: Record<FournisseurExterne, string> = {
  apple: "bg-black text-white border-black hover:bg-[#1f1f1f]",
  google: "bg-white text-[#1F1F1F] border-[#747775] hover:bg-[#f2f2f2]",
};

type Props = { fournisseur: FournisseurExterne; adresse: string; libelle?: string };

/**
 * « Continuer avec Apple » ou « Continuer avec Google » : un vrai lien (navigation complète vers le départ, puis chez le
 * fournisseur), utilisable au clavier et sans JavaScript. Le logo est décoratif : le libellé suffit.
 */
export function BoutonFournisseur({ fournisseur, adresse, libelle }: Props) {
  const T = utiliserTextes(TEXTES_CONNEXION_EXTERNE_PAR_LANGUE);
  return (
    <a
      href={adresse}
      className={`flex min-h-12 w-full items-center justify-center gap-3 rounded-full border px-6 py-3 text-base font-medium
        transition-colors focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-encre ${habits[fournisseur]}`}
    >
      {fournisseur === "apple" ? <LogoApple className="h-5 w-5 shrink-0" /> : <LogoGoogle className="h-5 w-5 shrink-0" />}
      <span>{libelle ?? T.fournisseurs[fournisseur]}</span>
    </a>
  );
}
