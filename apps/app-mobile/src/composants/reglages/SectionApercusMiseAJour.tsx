import { useRouter } from "expo-router";
import { useCallback, useState } from "react";

import { EcranMiseAJourObligatoire } from "~/composants/mise-a-jour/EcranMiseAJourObligatoire";
import { FenetreNouvelleVersion } from "~/composants/mise-a-jour/FenetreNouvelleVersion";
import { FenetreNouveautes } from "~/composants/nouveautes/FenetreNouveautes";
import { LigneReglage } from "~/composants/reglages/LigneReglage";
import { SectionReglages } from "~/composants/reglages/SectionReglages";
import { NOUVEAUTES_VERSIONS } from "~/contenus/nouveautes-versions";
import { TEXTES_MISE_A_JOUR } from "~/contenus/textes-mise-a-jour";
import { TEXTES_NOUVEAUTES } from "~/contenus/textes-nouveautes";

const A = TEXTES_MISE_A_JOUR.apercus;

export function SectionApercusMiseAJour() {
  const router = useRouter();
  const [apercu, setApercu] = useState<"obligatoire" | "nouvelle-version" | "nouveautes" | null>(null);
  const fermer = useCallback(() => setApercu(null), []);

  return (
    <SectionReglages titre={A.titreSection}>
      <LigneReglage emoji="🛟" titre={A.obligatoire} detail={A.detailObligatoire} onPress={() => setApercu("obligatoire")} />
      <LigneReglage emoji="✨" titre={A.nouvelle} detail={A.detailNouvelle} onPress={() => setApercu("nouvelle-version")} />
      <LigneReglage emoji="🎉" titre={TEXTES_NOUVEAUTES.apercu.titre} detail={TEXTES_NOUVEAUTES.apercu.detail} onPress={() => setApercu("nouveautes")} />
      {apercu === "obligatoire" ? <EcranMiseAJourObligatoire onSortirApercu={fermer} /> : null}
      <FenetreNouvelleVersion visible={apercu === "nouvelle-version"} onFermer={fermer} />
      <FenetreNouveautes
        nouveautes={NOUVEAUTES_VERSIONS[0] ?? null}
        visible={apercu === "nouveautes"}
        onVoir={() => {
          fermer();
          router.push("/reglages/nouveautes");
        }}
        onFermer={fermer}
      />
    </SectionReglages>
  );
}
