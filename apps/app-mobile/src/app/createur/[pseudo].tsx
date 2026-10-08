import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { calculerAge } from "@sos-miam/commun/regles/calculer-age";
import { Annonce } from "~/composants/interface/Annonce";
import { Bouton } from "~/composants/interface/Bouton";
import { VignetteCollection } from "~/composants/profil/VignetteCollection";
import { EcranReglage } from "~/composants/reglages/EcranReglage";
import { BoutonSuivreProfil } from "~/composants/suivi/BoutonSuivreProfil";
import { lieuxExemples } from "~/contenus/lieux-exemples";
import { publicationsExemples } from "~/contenus/publications-exemples";
import { filtrerLieuxSelonAge } from "~/fonctions/lieux/filtrer-lieux-selon-age";
import { calculerCleSuivi } from "~/fonctions/publications/calculer-cle-suivi";
import { trouverVignetteLieu } from "~/fonctions/publications/trouver-vignette-lieu";
import { trouverVignettePublication } from "~/fonctions/publications/trouver-vignette-publication";
import { formaterNombreCourt } from "~/fonctions/texte/formater-nombre-court";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserActivite } from "~/hooks/utiliser-activite";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import couleurs from "~/theme/couleurs";

/**
 * La page d'un créateur (ouverte depuis son avatar dans le fil) : avatar 🎬, @pseudo, « Suivre » ou « Suivi », ses partenariats déclarés
 * (« Collaboration commerciale ») et ses publications, qui mènent à la fiche du lieu. Pseudo inconnu : un message et le retour.
 */
export default function PageCreateur() {
  const router = useRouter();
  const marges = useSafeAreaInsets();
  const { pseudo = "" } = useLocalSearchParams<{ pseudo: string }>();
  const { profil } = utiliserProfil();
  const activite = utiliserActivite();
  const [annonce, setAnnonce] = useState<{ texte: string; numero: number } | null>(null);
  const finAnnonce = useCallback(() => setAnnonce(null), []);
  const annoncer = useCallback((texte: string) => setAnnonce({ texte, numero: Date.now() }), []);

  const revenir = () => (router.canGoBack() ? router.back() : router.replace("/"));
  const siennes = publicationsExemples.filter((p) => p.auteur.type === "createur" && p.auteur.pseudo === pseudo);

  if (siennes.length === 0) {
    return (
      <EcranReglage
        titre="Ce créateur s'est éclipsé"
        sousTitre={`On ne trouve personne${pseudo ? ` qui s'appelle @${pseudo}` : ""} : le pseudo a peut-être changé, ou le lien s'est emmêlé les pinceaux.`}
      >
        <Bouton libelle="Retour" variante="blanc" onPress={revenir} />
      </EcranReglage>
    );
  }

  const nom = `@${pseudo}`;
  const age = profil ? calculerAge(profil.dateNaissance) : null;
  const lieux = filtrerLieuxSelonAge(lieuxExemples, age);
  // Comme dans le fil : rien de masqué (« Pas intéressé », signalé), et seulement les lieux que ton âge permet
  const publications = siennes.flatMap((publication) => {
    const lieu = lieux.find((l) => l.id === publication.lieuId);
    return lieu && !activite.estMasquee(publication.id) ? [{ publication, lieu }] : [];
  });
  const partenariats = publications.flatMap(({ publication, lieu }) =>
    publication.auteur.type === "createur" && publication.auteur.partenariat ? [{ cle: publication.id, lieu, partenariat: publication.auteur.partenariat }] : [],
  );
  const jaimes = publications.reduce((total, { publication }) => total + publication.jaimes, 0);
  const cle = calculerCleSuivi(siennes[0].auteur, siennes[0].lieuId);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: couleurs.creme }} edges={["top", "bottom"]}>
      <StatusBar style="dark" />
      <View className="min-h-14 flex-row items-center px-5 pb-3 pt-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retour"
          hitSlop={12}
          onPress={revenir}
          className="h-10 w-10 items-center justify-center rounded-full border-2 border-encre bg-white active:opacity-80"
        >
          <Ionicons name="arrow-back" size={20} color={couleurs.encre} />
        </Pressable>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="gap-6 px-5 pb-10">
        <View className="flex-row items-center gap-2.5 rounded-2xl border-2 border-dashed border-gris/40 bg-white/70 px-3.5 py-2.5">
          <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-lg">
            🧪
          </Text>
          <Text className="flex-1 font-texte text-[13px] leading-5 text-gris">
            <Text className="font-texte-gras text-encre">Créateurs d'exemple</Text>
            {lierPonctuation(" : les vrais arriveront avec les comptes.")}
          </Text>
        </View>

        <View className="items-center gap-1 pt-2">
          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            className="mb-2 h-24 w-24 items-center justify-center rounded-full border-2 border-encre bg-jaune"
          >
            <Text className="text-5xl">🎬</Text>
          </View>
          <Text accessibilityRole="header" className="text-center font-titre text-3xl text-encre">
            {nom}
          </Text>
          <Text className="text-center font-texte text-base text-gris">Raconte ses bonnes adresses en vidéo</Text>
          <Text
            accessibilityLabel={`${publications.length} publication${publications.length > 1 ? "s" : ""}, ${jaimes} J'aime`}
            className="text-center font-texte-semi text-sm text-encre"
          >
            {publications.length} publication{publications.length > 1 ? "s" : ""} · {formaterNombreCourt(jaimes)} J'aime
          </Text>
        </View>

        {/* « Suivre » suit tout de suite ; « Suivi » demande confirmation avant de ne plus suivre */}
        <BoutonSuivreProfil cle={cle} nom={nom} emoji="🎬" onAnnoncer={annoncer} taille="grand" />

        <View className="gap-3">
          <Text accessibilityRole="header" accessibilityLabel={`Partenariats déclarés, ${partenariats.length}`} className="font-titre-gras text-xl text-encre">
            🤝 Partenariats déclarés ({partenariats.length})
          </Text>
          <Text className="font-texte text-sm leading-5 text-gris">
            {lierPonctuation("Quand un lieu offre ou paie quelque chose, c'est écrit noir sur blanc : « Collaboration commerciale ».")}
          </Text>
          {partenariats.length === 0 ? (
            <View className="rounded-carte border-2 border-dashed border-ligne px-5 py-5">
              <Text className="text-center font-texte text-sm leading-5 text-gris">Aucune collaboration commerciale déclarée sur ses publications.</Text>
            </View>
          ) : (
            partenariats.map((p) => (
              <View
                key={p.cle}
                accessible
                accessibilityLabel={`Collaboration commerciale : ${p.partenariat}, avec ${p.lieu.nom}`}
                className="flex-row items-center gap-3 rounded-carte border-2 border-encre bg-white p-4"
              >
                <Text className="text-3xl">{p.lieu.emoji}</Text>
                <View className="flex-1 gap-1">
                  <Text className="self-start overflow-hidden rounded-md bg-jaune-clair px-2 py-0.5 font-texte-semi text-xs text-encre">
                    Collaboration commerciale · {p.partenariat}
                  </Text>
                  <Text className="font-texte-gras text-[15px] text-encre">{p.lieu.nom}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        <View className="gap-3">
          <Text accessibilityRole="header" accessibilityLabel={`Ses publications, ${publications.length}`} className="font-titre-gras text-xl text-encre">
            🎬 Ses publications ({publications.length})
          </Text>
          {publications.length === 0 ? (
            <View className="rounded-carte border-2 border-dashed border-ligne px-5 py-5">
              <Text className="text-center font-texte text-sm leading-5 text-gris">{lierPonctuation("Rien à te montrer ici pour l'instant : ses prochaines pépites arrivent !")}</Text>
            </View>
          ) : (
            <View className="-mx-0.5 flex-row flex-wrap">
              {publications.map(({ publication, lieu }) => (
                <VignetteCollection
                  key={publication.id}
                  lieu={lieu}
                  image={trouverVignettePublication(publication) ?? trouverVignetteLieu(lieu.id, siennes)}
                  libelle={`Publication de ${nom} sur ${lieu.nom}, ${lieu.quartier}`}
                  onPress={() => router.push({ pathname: "/lieu/[id]", params: { id: String(lieu.id) } })}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <Annonce annonce={annonce} haut={marges.top + 60} onFin={finAnnonce} />
    </SafeAreaView>
  );
}
