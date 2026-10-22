import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

import { Bouton } from "~/composants/interface/Bouton";
import { EcranReglage } from "~/composants/reglages/EcranReglage";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import { utiliserSession } from "~/hooks/utiliser-session";
import { DEMO_VISITES_ACTIVE } from "~/services/demo/demo-visites-active";
import { validationLieuxExemples } from "~/contenus/validation-lieux-exemples";

/**
 * Le QR de vitrine d'un lieu, ouvert dans l'app (sosmiam.fr/l/<code>) : on retrouve le lieu et on ouvre sa fiche. Sans
 * compte, on entre en visite (regarder une fiche ne demande pas de compte).
 */
export default function OuvrirQrVitrine() {
  const couleurs = utiliserCouleurs();
  const router = useRouter();
  const { code = "" } = useLocalSearchParams<{ code: string }>();
  const { contenu } = utiliserSession();
  const { profil, invite, entrerEnInvite } = utiliserProfil();
  const [introuvable, setIntrouvable] = useState(false);

  useEffect(() => {
    let actif = true;
    void (async () => {
      const lieuId = DEMO_VISITES_ACTIVE
        ? (Object.values(validationLieuxExemples).find((v) => v.codePublic === code)?.lieuId ?? null)
        : await contenu.trouverParCode(code).then((r) => (r.ok ? r.lieuId : null));
      if (!actif) return;
      if (lieuId === null) return setIntrouvable(true);
      if (!profil && !invite) await entrerEnInvite();
      router.replace({ pathname: "/lieu/[id]", params: { id: String(lieuId) } });
    })();
    return () => {
      actif = false;
    };
  }, [code, contenu, profil, invite, entrerEnInvite, router]);

  if (introuvable) {
    return (
      <EcranReglage titre="Ce QR code ne mène nulle part" sousTitre="Le lieu n'est peut-être plus sur SOS Miam. Plein d'autres adresses t'attendent dans Explorer !">
        <Bouton libelle="Voir les adresses" variante="blanc" onPress={() => router.replace("/explorer")} />
      </EcranReglage>
    );
  }
  return (
    <View className="flex-1 items-center justify-center bg-creme">
      <ActivityIndicator color={couleurs.encre} accessibilityLabel="On ouvre la fiche du lieu" />
    </View>
  );
}
