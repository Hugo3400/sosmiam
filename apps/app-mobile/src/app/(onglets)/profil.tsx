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

/**
 * Les badges du compte (donnés par l'API) tels que le catalogue de l'app les nomme. « Première rescousse » n'est pas encore
 * donné par l'API : il se lit dans ton activité, telle que l'API la rend.
 */
function listerBadgesDuCompte(badgesCompte: string[], rescoussesDonnees: number): string[] {
  const ids = new Set(badgesCompte.map((id) => (id === "deniche-par-toi" ? "deniche" : id)));
  if (rescoussesDonnees > 0) ids.add("premiere-rescousse");
  return badges.filter((b) => ids.has(b.id)).map((b) => b.id);
}

/**
 * Onglet « Profil » : toi, qui tu suis, ton palier Ambassadeur, tes bouées de la semaine, tes défis, tes badges et tes adresses.
 * Avec un compte, points, palier et badges sont ceux du serveur ; en démo, ils sont comptés sur ce téléphone.
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
      ? { points: compte.points, obtenus: listerBadgesDuCompte(compte.badges, activite.rescoussesDonnees) }
      : null;

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
                  : "Reconnecte-toi à ton compte pour retrouver tes points, ton palier et tes badges.",
              )}
            </Text>
          </View>
        )}
        <BoueesSemaine restantes={activite.restantes} />
        {ambassadeur ? (
          <ChiffresProfil
            lieuxSauves={activite.lieuxSauves.length}
            premiersSauvetages={activite.premiersSauvetages.length}
            badgesObtenus={ambassadeur.obtenus.length}
            badgesTotal={badges.length}
          />
        ) : null}
        <ListeDefis mesures={mesures} />
        {ambassadeur ? <GrilleBadges obtenus={ambassadeur.obtenus} /> : null}
        <CollectionsProfil gardes={activite.gardes} jaimes={activite.jaimes} age={age} />
      </ScrollView>
    </SafeAreaView>
  );
}
