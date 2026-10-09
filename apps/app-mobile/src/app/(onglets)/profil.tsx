import { useBottomTabBarHeight } from "expo-router/tabs";
import { Alert, Linking, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { calculerAge } from "@sos-miam/commun/regles/calculer-age";
import { EcranInvite } from "~/composants/invite/EcranInvite";
import { BoueesSemaine } from "~/composants/profil/BoueesSemaine";
import { CartePalier } from "~/composants/profil/CartePalier";
import { ChiffresProfil } from "~/composants/profil/ChiffresProfil";
import { CollectionsProfil } from "~/composants/profil/CollectionsProfil";
import { EnTeteProfil } from "~/composants/profil/EnTeteProfil";
import { EntreeFidelite } from "~/composants/profil/EntreeFidelite";
import { EntreeSuivis } from "~/composants/profil/EntreeSuivis";
import { GrilleBadges } from "~/composants/profil/GrilleBadges";
import { ListeDefis } from "~/composants/profil/ListeDefis";
import { badges } from "~/contenus/badges";
import type { MesuresActivite } from "~/contenus/type-mesure-activite";
import { calculerPointsLocaux } from "~/fonctions/ambassadeur/calculer-points-locaux";
import { listerBadgesObtenus } from "~/fonctions/ambassadeur/lister-badges-obtenus";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { utiliserActivite } from "~/hooks/utiliser-activite";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import couleurs from "~/theme/couleurs";

/** Pages légales, les mêmes que dans les réglages : accessibles même sans compte */
const PAGES_LEGALES = [
  { titre: "Conditions d'utilisation", adresse: "https://sosmiam.fr/cgu" },
  { titre: "Confidentialité", adresse: "https://sosmiam.fr/confidentialite" },
  { titre: "Mentions légales", adresse: "https://sosmiam.fr/mentions-legales" },
] as const;

/** Ouvre une page légale du site ; si le téléphone n'y arrive pas, on le dit gentiment (Alert n'existe pas sur le web). */
function ouvrirPageLegale(adresse: string) {
  vibrerLegerement();
  Linking.openURL(adresse).catch(() => {
    if (Platform.OS !== "web") {
      Alert.alert("Oups, ça ne veut pas s'ouvrir", `Ton téléphone n'a pas réussi à ouvrir ce lien. Tu peux le retrouver sur ${adresse.replace("https://", "")}.`);
    }
  });
}

/**
 * Onglet « Profil » : toi, qui tu suis, ton palier Ambassadeur, tes bouées de la semaine, tes défis, tes badges et tes adresses. Tout est compté sur ce téléphone.
 * Sans compte, on montre ce qui t'attend, avec les pages légales (elles restent ouvertes à tout le monde).
 */
export default function Profil() {
  const { profil, avatar, invite } = utiliserProfil();
  const activite = utiliserActivite();
  // La barre d'onglets est posée par-dessus l'écran : la fin de la page passe au-dessus
  const hauteurBarreOnglets = useBottomTabBarHeight();

  if (invite) {
    return (
      <EcranInvite
        raison="profil"
        emoji="🙋"
        titre="Et toi, t'es qui ?"
        texte="Ici s'affiche tout ce que tu fais pour les lieux du coin. Ta mamie serait fière."
        avantages={[
          "Tes points et ton palier, de Curieux à Ambassadeur de quartier",
          "Tes badges et des défis à relever",
          "Tes lieux gardés pour plus tard",
          "Tes réglages (avatar, envies, notifications)",
        ]}
        enPlus={
          <View className="flex-row flex-wrap justify-center gap-x-5">
            {PAGES_LEGALES.map((page) => (
              <Pressable
                key={page.adresse}
                accessibilityRole="link"
                onPress={() => ouvrirPageLegale(page.adresse)}
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
  const mesures: MesuresActivite = { rescousses: activite.rescoussesDonnees, "premiers-sauvetages": activite.premiersSauvetages.length };
  const obtenus = listerBadgesObtenus(mesures);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: couleurs.creme }} edges={["top"]}>
      <ScrollView contentContainerClassName="gap-6 px-5 pt-4" contentContainerStyle={{ paddingBottom: hauteurBarreOnglets + 24 }}>
        <EnTeteProfil profil={profil} avatar={avatar} age={age} />
        <EntreeSuivis suivis={activite.suivis} age={age} />
        <EntreeFidelite />
        <CartePalier points={calculerPointsLocaux(mesures)} />
        <BoueesSemaine restantes={activite.restantes} />
        <ChiffresProfil
          lieuxSauves={activite.lieuxSauves.length}
          premiersSauvetages={activite.premiersSauvetages.length}
          badgesObtenus={obtenus.length}
          badgesTotal={badges.length}
        />
        <ListeDefis mesures={mesures} />
        <GrilleBadges obtenus={obtenus} />
        <CollectionsProfil gardes={activite.gardes} jaimes={activite.jaimes} age={age} />
      </ScrollView>
    </SafeAreaView>
  );
}
