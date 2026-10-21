import { useCallback, useState } from "react";

import { EcranMiseAJourObligatoire } from "~/composants/mise-a-jour/EcranMiseAJourObligatoire";
import { FenetreNouvelleVersion } from "~/composants/mise-a-jour/FenetreNouvelleVersion";
import { LigneReglage } from "~/composants/reglages/LigneReglage";
import { SectionReglages } from "~/composants/reglages/SectionReglages";
import { TEXTES_MISE_A_JOUR } from "~/contenus/textes-mise-a-jour";

const A = TEXTES_MISE_A_JOUR.apercus;

export function SectionApercusMiseAJour() {
  const [apercu, setApercu] = useState<"obligatoire" | "nouvelle-version" | null>(null);
  const fermer = useCallback(() => setApercu(null), []);

  return (
    <SectionReglages titre={A.titreSection}>
      <LigneReglage emoji="🛟" titre={A.obligatoire} detail={A.detailObligatoire} onPress={() => setApercu("obligatoire")} />
      <LigneReglage emoji="✨" titre={A.nouvelle} detail={A.detailNouvelle} onPress={() => setApercu("nouvelle-version")} />
      {apercu === "obligatoire" ? <EcranMiseAJourObligatoire onSortirApercu={fermer} /> : null}
      <FenetreNouvelleVersion visible={apercu === "nouvelle-version"} onFermer={fermer} />
    </SectionReglages>
  );
}
