import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

import { utiliserProfil } from "~/hooks/utiliser-profil";
import couleurs from "~/theme/couleurs";

/**
 * La fiche d'un lieu ouverte depuis un lien du site (sosmiam.fr/lieux/<id>) : on ouvre la même fiche dans l'app. Sans
 * compte, on entre en visite (regarder une fiche ne demande pas de compte).
 */
export default function OuvrirFicheDuSite() {
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
      <ActivityIndicator color={couleurs.encre} accessibilityLabel="On ouvre la fiche du lieu" />
    </View>
  );
}
