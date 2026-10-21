import type { ComponentProps } from "react";

import { calculerPalier } from "@sos-miam/commun/regles/calculer-palier";
import { RESCOUSSES_PAR_SEMAINE } from "@sos-miam/commun/regles/rescousses";
import { SectionPliable } from "~/composants/interface/SectionPliable";
import { CartePalier } from "~/composants/profil/CartePalier";
import { TEXTES_PALIER } from "~/contenus/textes-profil";
import { ecrireProchaineEtape } from "~/fonctions/profil/ecrire-prochaine-etape";

type Props = ComponentProps<typeof CartePalier>;

export function SectionPalier(props: Props) {
  const progression = calculerPalier(props.points);
  const { actuel } = progression;
  const rescousses = props.restantes !== null ? TEXTES_PALIER.rescousses(Math.min(RESCOUSSES_PAR_SEMAINE, Math.max(0, props.restantes))) : null;
  const situation = [`${actuel.emoji} ${actuel.nom}`, TEXTES_PALIER.points(props.points), rescousses].filter(Boolean).join(" · ");

  return (
    <SectionPliable section="palier" titre={TEXTES_PALIER.titre} sousTitre={TEXTES_PALIER.sousTitre} resume={[situation, ecrireProchaineEtape(progression)]}>
      <CartePalier {...props} />
    </SectionPliable>
  );
}
