import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { BADGES, BADGES_PAR_LANGUE } from "@sos-miam/commun/contenus/badges";
import { SectionPliable } from "~/composants/interface/SectionPliable";
import { BoutonContour } from "~/composants/profil/BoutonContour";
import { CaseBadge } from "~/composants/profil/CaseBadge";
import { TEXTES_BADGES_PROFIL_PAR_LANGUE } from "~/contenus/textes-profil";
import { TEXTES_BADGES_ONGLET_PROFIL_PAR_LANGUE } from "~/contenus/textes-profil-onglet";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { choisirDerniersBadges } from "~/fonctions/profil/choisir-derniers-badges";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  obtenus: readonly string[];
};

const NOMBRE_DERNIERS = 4;

export function ApercuBadges({ obtenus }: Props) {
  const router = useRouter();
  const textesBadges = utiliserTextes(TEXTES_BADGES_PROFIL_PAR_LANGUE);
  const T = utiliserTextes(TEXTES_BADGES_ONGLET_PROFIL_PAR_LANGUE);
  const badges = utiliserTextes(BADGES_PAR_LANGUE);
  const derniers = choisirDerniersBadges(obtenus, NOMBRE_DERNIERS).map((badge) => badges.find((b) => b.id === badge.id) ?? badge);
  const plusRecent = derniers[0];
  const reste = Math.max(0, BADGES.length - obtenus.length);
  const voirTout = () => router.push("/badges");

  return (
    <SectionPliable
      section="badges"
      titre={textesBadges.titre}
      sousTitre={derniers.length > 0 ? textesBadges.derniers(derniers.length) : undefined}
      resume={[
        reste > 0 ? textesBadges.encore(reste) : textesBadges.complete,
        ...(plusRecent ? [textesBadges.dernier(plusRecent.emoji, plusRecent.nom)] : []),
      ]}
      compteur={{ texte: `${obtenus.length}/${BADGES.length}`, lu: T.compteurLu(obtenus.length, BADGES.length) }}
    >
      {derniers.length > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={textesBadges.apercuLu(derniers.map((badge) => badge.nom))}
          accessibilityHint={textesBadges.indiceVoirTout}
          onPress={() => {
            vibrerLegerement();
            voirTout();
          }}
          className="active:opacity-70"
        >
          <View aria-hidden className="-m-1 flex-row flex-wrap">
            {derniers.map((badge) => (
              <CaseBadge key={badge.id} badge={badge} obtenu />
            ))}
          </View>
        </Pressable>
      ) : (
        <View className="flex-row items-center gap-3 rounded-carte border-2 border-dashed border-ligne p-4">
          <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-3xl">
            🛟
          </Text>
          <Text className="flex-1 font-texte text-sm leading-5 text-encre">{lierPonctuation(textesBadges.aucun)}</Text>
        </View>
      )}
      <BoutonContour libelle={textesBadges.voirTout} indice={textesBadges.indiceVoirTout} onPress={voirTout} />
    </SectionPliable>
  );
}
