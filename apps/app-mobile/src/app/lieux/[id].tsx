import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

import { TEXTES_FICHE_LIEU_PAR_LANGUE } from "~/contenus/textes-fiche-lieu";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import { utiliserTextes } from "~/hooks/utiliser-textes";

/**
 * La fiche d'un lieu ouverte depuis un lien du site (sosmiam.fr/lieux/<id>) : on ouvre la même fiche dans l'app. Sans
 * compte, on entre en visite (regarder une fiche ne demande pas de compte).
 */
export default function OuvrirFicheDuSite() {
  const couleurs = utiliserCouleurs();
  const T = utiliserTextes(TEXTES_FICHE_LIEU_PAR_LANGUE);
  const router = useRouter();
  const { id = "" } = useLocalSearchParams<{ id: string }>();
  const { profil, invite, entrerEnInvite } = utiliserProfil();

  useEffect(() => {
    void (async () => {
      if (!/^[1-9]\d{0,8}$/.test(id)) return router.replace("/explorer");
      if (!profil && !invite) await entrerEnInvite();
      router.replace({ pathname: "/lieu/[id]", params: { id } });
    })();
  }, [id, profil, invite, entrerEnInvite, router]);

  return (
    <View className="flex-1 items-center justify-center bg-creme">
      <ActivityIndicator color={couleurs.encre} accessibilityLabel={T.ouvertureLu} />
    </View>
  );
}
