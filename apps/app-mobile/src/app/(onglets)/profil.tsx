import { useBottomTabBarHeight } from "expo-router/tabs";
import { Alert, Linking, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BADGES } from "@sos-miam/commun/contenus/badges";
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
import type { MesuresActivite } from "~/contenus/type-mesure-activite";
import { calculerPointsLocaux } from "~/fonctions/ambassadeur/calculer-points-locaux";
import { listerBadgesObtenus } from "~/fonctions/ambassadeur/lister-badges-obtenus";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserActivite } from "~/hooks/utiliser-activite";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import { utiliserSession } from "~/hooks/utiliser-session";
import { DEMO_VISITES_ACTIVE } from "~/services/demo/demo-visites-active";
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

/** Les badges du compte, tous donnés par le serveur, dans l'ordre du catalogue partagé (un badge inconnu de l'app est laissé de côté). */
function listerBadgesDuCompte(badgesCompte: string[]): string[] {
  return BADGES.filter((b) => badgesCompte.includes(b.id)).map((b) => b.id);
}

/**
 * Onglet « Profil » : toi, qui tu suis, ton palier Ambassadeur, tes bouées de la semaine, tes défis, tes badges et tes adresses.
 * Avec un compte, points, palier, défis et badges sont ceux du serveur ; en démo, ils sont comptés sur ce téléphone.
 * Sans compte, on montre ce qui t'attend, avec les pages légales (elles restent ouvertes à tout le monde).
 */
export default function Profil() {
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
  // null : le compte n'est pas encore relu (hors ligne), ou sa session a expiré : on ne montre pas de faux chiffres
  const ambassadeur = DEMO_VISITES_ACTIVE
    ? { points: calculerPointsLocaux(mesures), obtenus: listerBadgesObtenus(mesures) }
    : compte
      ? { points: compte.points, obtenus: listerBadgesDuCompte(compte.badges) }
      : null;
  // Bouées et défis attendent l'activité : cachés tant qu'elle n'est pas connue (pas relue, ou session expirée)
  const activiteConnue = DEMO_VISITES_ACTIVE || (connecte && activite.chargee);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: couleurs.creme }} edges={["top"]}>
      <ScrollView contentContainerClassName="gap-6 px-5 pt-4" contentContainerStyle={{ paddingBottom: hauteurBarreOnglets + 24 }}>
        <EnTeteProfil profil={profil} avatar={avatar} age={age} />
        <EntreeSuivis suivis={activite.suivis} age={age} />
        <EntreeFidelite />
        {ambassadeur ? (
          <CartePalier points={ambassadeur.points} />
        ) : (
          <View className="flex-row items-center gap-3 rounded-carte border-2 border-encre bg-white p-5">
            <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-3xl">
              {connecte ? "📶" : "🔑"}
            </Text>
            <Text className="flex-1 font-texte-semi text-base text-encre">
              {lierPonctuation(
                connecte
                  ? "Tes points, ton palier et tes badges arrivent dès que le réseau revient. Ils t'attendent bien au chaud !"
                  : "Connecte-toi à ton compte pour retrouver tes points, ton palier et tes badges.",
              )}
            </Text>
          </View>
        )}
        {activiteConnue ? <BoueesSemaine restantes={activite.restantes} /> : null}
        {ambassadeur ? (
          <ChiffresProfil
            lieuxSauves={activite.lieuxSauves.length}
            premiersSauvetages={activite.premiersSauvetages.length}
            badgesObtenus={ambassadeur.obtenus.length}
            badgesTotal={BADGES.length}
          />
        ) : null}
        {activiteConnue ? <ListeDefis /> : null}
        {ambassadeur ? <GrilleBadges obtenus={ambassadeur.obtenus} demo={DEMO_VISITES_ACTIVE} /> : null}
        <CollectionsProfil gardes={activite.gardes} jaimes={activite.jaimes} age={age} />
      </ScrollView>
    </SafeAreaView>
  );
}
