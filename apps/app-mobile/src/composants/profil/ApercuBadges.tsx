import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { BADGES } from "@sos-miam/commun/contenus/badges";
import { SectionPliable } from "~/composants/interface/SectionPliable";
import { BoutonContour } from "~/composants/profil/BoutonContour";
import { VignetteBadge } from "~/composants/profil/VignetteBadge";
import { TEXTES_BADGES_PROFIL } from "~/contenus/textes-profil";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { choisirDerniersBadges } from "~/fonctions/profil/choisir-derniers-badges";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  obtenus: readonly string[];
};

const NOMBRE_DERNIERS = 4;

export function ApercuBadges({ obtenus }: Props) {
  const router = useRouter();
  const derniers = choisirDerniersBadges(obtenus, NOMBRE_DERNIERS);
  const plusRecent = derniers[0];
  const reste = Math.max(0, BADGES.length - obtenus.length);
  const voirTout = () => router.push("/badges");

  return (
    <SectionPliable
      section="badges"
      titre={TEXTES_BADGES_PROFIL.titre}
      sousTitre={derniers.length > 0 ? TEXTES_BADGES_PROFIL.derniers(derniers.length) : undefined}
      resume={[
        reste > 0 ? TEXTES_BADGES_PROFIL.encore(reste) : TEXTES_BADGES_PROFIL.complete,
        ...(plusRecent ? [TEXTES_BADGES_PROFIL.dernier(plusRecent.emoji, plusRecent.nom)] : []),
      ]}
      compteur={{ texte: `${obtenus.length}/${BADGES.length}`, lu: `${obtenus.length} sur ${BADGES.length}` }}
    >
      {derniers.length > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={TEXTES_BADGES_PROFIL.apercuLu(derniers.map((badge) => badge.nom))}
          accessibilityHint={TEXTES_BADGES_PROFIL.indiceVoirTout}
          onPress={() => {
            vibrerLegerement();
            voirTout();
          }}
          className="active:opacity-70"
        >
          <View aria-hidden className="-m-1 flex-row flex-wrap">
            {derniers.map((badge) => (
              <VignetteBadge key={badge.id} badge={badge} />
            ))}
          </View>
        </Pressable>
      ) : (
        <View className="flex-row items-center gap-3 rounded-carte border-2 border-dashed border-ligne p-4">
          <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-3xl">
            🛟
          </Text>
          <Text className="flex-1 font-texte text-sm leading-5 text-encre">{lierPonctuation(TEXTES_BADGES_PROFIL.aucun)}</Text>
        </View>
      )}
      <BoutonContour libelle={TEXTES_BADGES_PROFIL.voirTout} indice={TEXTES_BADGES_PROFIL.indiceVoirTout} onPress={voirTout} />
    </SectionPliable>
  );
}
