import { useRouter } from "expo-router";

import { TuileRaccourci } from "~/composants/profil/TuileRaccourci";
import { TEXTES_RACCOURCIS } from "~/contenus/textes-profil";
import { utiliserVisites } from "~/hooks/utiliser-visites";

export function EntreeVisites() {
  const router = useRouter();
  const { visites, aEcrire, enCours } = utiliserVisites();
  const validees = visites.filter((v) => v.statut === "validee").length;
  const detail =
    validees > 0
      ? [TEXTES_RACCOURCIS.visitesValidees(validees), aEcrire.length > 0 ? TEXTES_RACCOURCIS.avisAEcrire(aEcrire.length) : null].filter(Boolean).join(" · ")
      : enCours
        ? TEXTES_RACCOURCIS.additionEnAttente
        : TEXTES_RACCOURCIS.pasDeVisite;

  return (
    <TuileRaccourci
      emoji="🧾"
      titre={TEXTES_RACCOURCIS.visites}
      detail={detail}
      indice={TEXTES_RACCOURCIS.indiceVisites}
      onPress={() => router.push("/visites")}
    />
  );
}
