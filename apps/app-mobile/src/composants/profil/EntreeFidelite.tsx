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
      ? "Pas encore de carte : un tampon à chaque visite validée"
      : `${cartes.length} carte${cartes.length > 1 ? "s" : ""}${pretes > 0 ? ` · ${pretes} récompense${pretes > 1 ? "s" : ""} t'attend${pretes > 1 ? "ent" : ""} 🎁` : ""}`;

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
