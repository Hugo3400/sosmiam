import { useRouter } from "expo-router";
import { useBottomTabBarHeight } from "expo-router/tabs";
import { Alert, Linking, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { calculerAge } from "@sos-miam/commun/regles/calculer-age";
import { EcranInvite } from "~/composants/invite/EcranInvite";
import { AnnonceProfil } from "~/composants/profil/AnnonceProfil";
import { ApercuBadges } from "~/composants/profil/ApercuBadges";
import { BoutonContour } from "~/composants/profil/BoutonContour";
import { CollectionsProfil } from "~/composants/profil/CollectionsProfil";
import { EnTeteProfil } from "~/composants/profil/EnTeteProfil";
import { EspacesProfil } from "~/composants/profil/EspacesProfil";
import { ListeDefis } from "~/composants/profil/ListeDefis";
import { RaccourcisProfil } from "~/composants/profil/RaccourcisProfil";
import { SectionPalier } from "~/composants/profil/SectionPalier";
import { BADGES_VISIBLES } from "~/contenus/badges-visibles";
import { TEXTES_ONGLETS_PRINCIPAUX_PAR_LANGUE } from "~/contenus/textes-onglets-principaux";
import { TEXTES_PROFIL_PAR_LANGUE } from "~/contenus/textes-profil";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { listerBadgesDuCompte } from "~/fonctions/profil/lister-badges-du-compte";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserActivite } from "~/hooks/utiliser-activite";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import { utiliserSession } from "~/hooks/utiliser-session";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type TextesLienRate = { lienRateTitre: string; lienRate: (adresse: string) => string };

/** Ouvre une page légale du site ; si le téléphone n'y arrive pas, on le dit gentiment (Alert n'existe pas sur le web). */
function ouvrirPageLegale(adresse: string, textes: TextesLienRate) {
  vibrerLegerement();
  Linking.openURL(adresse).catch(() => {
    if (Platform.OS !== "web") {
      Alert.alert(textes.lienRateTitre, textes.lienRate(adresse.replace("https://", "")));
    }
  });
}

/**
 * Onglet « Profil » : toi, qui tu suis, ton palier Ambassadeur, tes bouées de la semaine, tes défis, tes badges et tes adresses.
 * Avec un compte, points, palier, défis et badges sont ceux du serveur.
 * Sans compte, on montre ce qui t'attend, avec les pages légales (elles restent ouvertes à tout le monde).
 */
export default function Profil() {
  const couleurs = utiliserCouleurs();
  const router = useRouter();
  const T = utiliserTextes(TEXTES_ONGLETS_PRINCIPAUX_PAR_LANGUE).profil;
  const TP = utiliserTextes(TEXTES_PROFIL_PAR_LANGUE);
  const { profil, avatar, invite } = utiliserProfil();
  const activite = utiliserActivite();
  const { connecte, compte } = utiliserSession();
  // La barre d'onglets est posée par-dessus l'écran : la fin de la page passe au-dessus
  const hauteurBarreOnglets = useBottomTabBarHeight();

  if (invite) {
    return (
      <EcranInvite
        raison="profil"
        emoji="🙋"
        titre={T.titre}
        texte={T.texte}
        avantages={[...T.avantages]}
        enPlus={
          <View className="flex-row flex-wrap justify-center gap-x-5">
            {T.pagesLegales.map((page) => (
              <Pressable
                key={page.adresse}
                accessibilityRole="link"
                onPress={() => ouvrirPageLegale(page.adresse, T)}
                className="min-h-11 justify-center active:opacity-70"
              >
                <Text className="font-texte text-sm text-gris underline">{page.titre}</Text>
              </Pressable>
            ))}
          </View>
        }
      />
    );
  }
  if (!profil) return null;

  const age = calculerAge(profil.dateNaissance);
  // null : le compte n'est pas encore relu (hors ligne), ou sa session a expiré : on ne montre pas de faux chiffres
  const ambassadeur = compte ? { points: compte.points, obtenus: listerBadgesDuCompte(compte.badges) } : null;
  // Bouées et défis attendent l'activité : cachés tant qu'elle n'est pas connue (pas relue, ou session expirée)
  const activiteConnue = connecte && activite.chargee;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: couleurs.creme }} edges={["top"]}>
      <ScrollView contentContainerClassName="gap-6 px-5 pt-4" contentContainerStyle={{ paddingBottom: hauteurBarreOnglets + 24 }}>
        <EnTeteProfil profil={profil} avatar={avatar} age={age} />
        {/* Pseudo remplacé par l'équipe, pseudo jamais parti de ce téléphone, prénom gelé : une annonce douce, une fois */}
        <AnnonceProfil />
        <BoutonContour
          libelle={TP.modifier}
          indice={TP.indiceModifier}
          icone="pencil"
          fond="blanc"
          grand
          onPress={() => router.push("/reglages/profil")}
        />
        <EspacesProfil />
        <RaccourcisProfil />
        {ambassadeur ? (
          <SectionPalier
            points={ambassadeur.points}
            lieuxSauves={activite.lieuxSauves.length}
            premiersSauvetages={activite.premiersSauvetages.length}
            badgesObtenus={ambassadeur.obtenus.length}
            badgesTotal={BADGES_VISIBLES.length}
            restantes={activiteConnue ? activite.restantes : null}
          />
        ) : (
          <View className="flex-row items-center gap-3 rounded-carte border-2 border-encre bg-carte p-5">
            <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-3xl">
              {connecte ? "📶" : "🔑"}
            </Text>
            <Text className="flex-1 font-texte-semi text-base text-encre">
              {lierPonctuation(
                connecte ? T.horsLigne : T.connecteToi,
              )}
            </Text>
          </View>
        )}
        {activiteConnue ? <ListeDefis /> : null}
        {ambassadeur ? <ApercuBadges obtenus={ambassadeur.obtenus} /> : null}
        <CollectionsProfil gardes={activite.gardes} jaimes={activite.jaimes} />
      </ScrollView>
    </SafeAreaView>
  );
}
