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
import { TEXTES_PROFIL } from "~/contenus/textes-profil";
import type { MesuresActivite } from "~/contenus/type-mesure-activite";
import { calculerPointsLocaux } from "~/fonctions/ambassadeur/calculer-points-locaux";
import { listerBadgesObtenus } from "~/fonctions/ambassadeur/lister-badges-obtenus";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { listerBadgesDuCompte } from "~/fonctions/profil/lister-badges-du-compte";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserActivite } from "~/hooks/utiliser-activite";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import { utiliserSession } from "~/hooks/utiliser-session";
import { utiliserVisites } from "~/hooks/utiliser-visites";
import { DEMO_VISITES_ACTIVE } from "~/services/demo/demo-visites-active";

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
 * Onglet « Profil » : toi, qui tu suis, ton palier Ambassadeur, tes bouées de la semaine, tes défis, tes badges et tes adresses.
 * Avec un compte, points, palier, défis et badges sont ceux du serveur ; en démo, ils sont comptés sur ce téléphone.
 * Sans compte, on montre ce qui t'attend, avec les pages légales (elles restent ouvertes à tout le monde).
 */
export default function Profil() {
  const couleurs = utiliserCouleurs();
  const router = useRouter();
  const { profil, avatar, invite } = utiliserProfil();
  const activite = utiliserActivite();
  const { points: pointsVisites } = utiliserVisites();
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
          "Tes paramètres (avatar, envies, notifications)",
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
    ? { points: calculerPointsLocaux(mesures) + pointsVisites, obtenus: listerBadgesObtenus(mesures) }
    : compte
      ? { points: compte.points, obtenus: listerBadgesDuCompte(compte.badges) }
      : null;
  // Bouées et défis attendent l'activité : cachés tant qu'elle n'est pas connue (pas relue, ou session expirée)
  const activiteConnue = DEMO_VISITES_ACTIVE || (connecte && activite.chargee);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: couleurs.creme }} edges={["top"]}>
      <ScrollView contentContainerClassName="gap-6 px-5 pt-4" contentContainerStyle={{ paddingBottom: hauteurBarreOnglets + 24 }}>
        <EnTeteProfil profil={profil} avatar={avatar} age={age} />
        {/* Pseudo remplacé par l'équipe, pseudo jamais parti de ce téléphone, prénom gelé : une annonce douce, une fois */}
        <AnnonceProfil />
        <BoutonContour
          libelle={TEXTES_PROFIL.modifier}
          indice={TEXTES_PROFIL.indiceModifier}
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
                connecte
                  ? "Tes points, ton palier et tes badges arrivent dès que le réseau revient. Ils t'attendent bien au chaud !"
                  : "Connecte-toi à ton compte pour retrouver tes points, ton palier et tes badges.",
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
