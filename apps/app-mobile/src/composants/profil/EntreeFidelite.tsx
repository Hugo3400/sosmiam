import { useRouter } from "expo-router";

import { TuileRaccourci } from "~/composants/profil/TuileRaccourci";
import { TEXTES_RACCOURCIS } from "~/contenus/textes-profil";
import { utiliserVisites } from "~/hooks/utiliser-visites";

export function EntreeFidelite() {
  const router = useRouter();
  const { cartes } = utiliserVisites();
  const pretes = cartes.reduce((somme, c) => somme + c.pretes.length, 0);
  const detail =
    cartes.length === 0
      ? TEXTES_RACCOURCIS.pasDeCarte
      : `${TEXTES_RACCOURCIS.cartes(cartes.length)}${pretes > 0 ? ` · ${TEXTES_RACCOURCIS.cadeaux(pretes)}` : ""}`;

  return (
    <TuileRaccourci
      emoji="🎟️"
      titre={TEXTES_RACCOURCIS.fidelite}
      detail={detail}
      indice={TEXTES_RACCOURCIS.indiceFidelite}
      onPress={() => router.push("/fidelite")}
    />
  );
}
