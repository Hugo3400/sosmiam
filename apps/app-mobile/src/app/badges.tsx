import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";

import { BADGES } from "@sos-miam/commun/contenus/badges";
import type { IdBadge } from "@sos-miam/commun/types/badge";
import { FamilleBadges } from "~/composants/profil/FamilleBadges";
import { EcranReglage } from "~/composants/reglages/EcranReglage";
import { FAMILLES_BADGES } from "~/contenus/familles-badges";
import { TEXTES_BADGES } from "~/contenus/textes-badges";
import { grouperBadgesParFamille } from "~/fonctions/ambassadeur/grouper-badges-par-famille";
import { listerBadgesObtenus } from "~/fonctions/ambassadeur/lister-badges-obtenus";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserActivite } from "~/hooks/utiliser-activite";
import { utiliserSession } from "~/hooks/utiliser-session";
import { DEMO_VISITES_ACTIVE } from "~/services/demo/demo-visites-active";

const FAMILLES = grouperBadgesParFamille(BADGES, FAMILLES_BADGES);

export default function Badges() {
  const router = useRouter();
  const { connecte, compte } = utiliserSession();
  const activite = utiliserActivite();
  const [choisi, setChoisi] = useState<IdBadge | null>(null);

  const obtenus: readonly string[] | null = DEMO_VISITES_ACTIVE
    ? listerBadgesObtenus({ rescousses: activite.rescoussesDonnees, "premiers-sauvetages": activite.premiersSauvetages.length })
    : (compte?.badges ?? null);
  const nombreObtenus = obtenus ? BADGES.filter((b) => obtenus.includes(b.id)).length : 0;
  const revenir = () => (router.canGoBack() ? router.back() : router.replace("/profil"));

  return (
    <EcranReglage titre={TEXTES_BADGES.titre} sousTitre={obtenus ? TEXTES_BADGES.sousTitre(nombreObtenus, BADGES.length) : undefined} onRetour={revenir}>
      {obtenus ? (
        <View className="gap-7">
          <Text className="-mt-3 font-texte text-sm text-gris">{lierPonctuation(TEXTES_BADGES.aide)}</Text>
          {FAMILLES.map((famille) => (
            <FamilleBadges
              key={famille.titre}
              titre={famille.titre}
              badges={famille.badges}
              obtenus={obtenus}
              choisi={choisi}
              demo={DEMO_VISITES_ACTIVE}
              onChoisir={setChoisi}
            />
          ))}
        </View>
      ) : (
        <View className="flex-row items-center gap-3 rounded-carte border-2 border-encre bg-white p-5">
          <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-3xl">
            {connecte ? "📶" : "🔑"}
          </Text>
          <Text className="flex-1 font-texte-semi text-base text-encre">
            {lierPonctuation(connecte ? TEXTES_BADGES.attenteReseau : TEXTES_BADGES.sansSession)}
          </Text>
        </View>
      )}
    </EcranReglage>
  );
}
