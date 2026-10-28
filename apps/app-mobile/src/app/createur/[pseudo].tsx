import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { estPseudoValide } from "@sos-miam/commun/validation/est-pseudo-valide";
import { calculerAge } from "@sos-miam/commun/regles/calculer-age";
import { Annonce } from "~/composants/interface/Annonce";
import { BarreEtatTheme } from "~/composants/interface/BarreEtatTheme";
import { Bouton } from "~/composants/interface/Bouton";
import { VignetteCollection } from "~/composants/profil/VignetteCollection";
import { EcranReglage } from "~/composants/reglages/EcranReglage";
import { BoutonSuivreProfil } from "~/composants/suivi/BoutonSuivreProfil";
import { TEXTES_CREATEUR_PAR_LANGUE } from "~/contenus/textes-createur";
import { ecrireQuartierVille } from "~/fonctions/lieux/ecrire-quartier-ville";
import { filtrerLieuxSelonAge } from "~/fonctions/lieux/filtrer-lieux-selon-age";
import { calculerCleSuivi } from "~/fonctions/publications/calculer-cle-suivi";
import { trouverVignetteLieu } from "~/fonctions/publications/trouver-vignette-lieu";
import { trouverVignettePublication } from "~/fonctions/publications/trouver-vignette-publication";
import { formaterNombreCourtLangue } from "~/fonctions/langue/formater-nombre-court-langue";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserActivite } from "~/hooks/utiliser-activite";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserLieux } from "~/hooks/utiliser-lieux";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import { utiliserPublications } from "~/hooks/utiliser-publications";
import { utiliserTextes } from "~/hooks/utiliser-textes";

/**
 * La page d'un créateur (ouverte depuis son avatar dans le fil) : avatar 🎬, @pseudo, « Suivre » ou « Suivi », ses partenariats déclarés
 * (« Collaboration commerciale ») et ses publications, qui mènent à la fiche du lieu. Pseudo inconnu : un message et le retour.
 */
export default function PageCreateur() {
  const couleurs = utiliserCouleurs();
  const router = useRouter();
  const marges = useSafeAreaInsets();
  const { langue } = utiliserLangue();
  const T = utiliserTextes(TEXTES_CREATEUR_PAR_LANGUE);
  const { pseudo = "" } = useLocalSearchParams<{ pseudo: string }>();
  const { profil } = utiliserProfil();
  const activite = utiliserActivite();
  const { lieux: tousLesLieux } = utiliserLieux();
  const { publications: toutesLesPublications, pret } = utiliserPublications();
  const [annonce, setAnnonce] = useState<{ texte: string; numero: number } | null>(null);
  const finAnnonce = useCallback(() => setAnnonce(null), []);
  const annoncer = useCallback((texte: string) => setAnnonce({ texte, numero: Date.now() }), []);

  const revenir = () => (router.canGoBack() ? router.back() : router.replace("/"));
  const siennes = toutesLesPublications.filter((p) => p.auteur.type === "createur" && p.auteur.pseudo === pseudo);

  // Le fil n'est pas encore lu : rien plutôt qu'un « s'est éclipsé » d'une seconde
  if (siennes.length === 0 && !pret) return null;
  if (siennes.length === 0) {
    return (
      <EcranReglage
        titre={T.introuvableTitre}
        sousTitre={T.introuvable(estPseudoValide(pseudo) ? pseudo : null)}
      >
        <Bouton libelle={T.retour} variante="blanc" onPress={revenir} />
      </EcranReglage>
    );
  }

  const nom = `@${pseudo}`;
  const age = profil ? calculerAge(profil.dateNaissance) : null;
  const lieux = filtrerLieuxSelonAge(tousLesLieux, age);
  // Comme dans le fil : rien de masqué (« Pas intéressé », signalé), et pas de bar en visite sans compte
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
      <BarreEtatTheme />
      <View className="min-h-14 flex-row items-center px-5 pb-3 pt-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={T.retour}
          hitSlop={12}
          onPress={revenir}
          className="h-10 w-10 items-center justify-center rounded-full border-2 border-encre bg-carte active:opacity-80"
        >
          <Ionicons name="arrow-back" size={20} color={couleurs.encre} />
        </Pressable>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="gap-6 px-5 pb-10">
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
          <Text className="text-center font-texte text-base text-gris">{T.accroche}</Text>
          <Text accessibilityLabel={T.chiffresLu(publications.length, jaimes)} className="text-center font-texte-semi text-sm text-encre">
            {T.chiffres(publications.length, jaimes, formaterNombreCourtLangue(jaimes, langue))}
          </Text>
        </View>

        {/* « Suivre » suit tout de suite ; « Suivi » demande confirmation avant de ne plus suivre */}
        <BoutonSuivreProfil cle={cle} nom={nom} emoji="🎬" onAnnoncer={annoncer} taille="grand" />

        <View className="gap-3">
          <Text accessibilityRole="header" accessibilityLabel={T.partenariatsLu(partenariats.length)} className="font-titre-gras text-xl text-encre">
            {T.partenariats(partenariats.length)}
          </Text>
          <Text className="font-texte text-sm leading-5 text-gris">{lierPonctuation(T.aidePartenariats)}</Text>
          {partenariats.length === 0 ? (
            <View className="rounded-carte border-2 border-dashed border-ligne px-5 py-5">
              <Text className="text-center font-texte text-sm leading-5 text-gris">{T.aucunPartenariat}</Text>
            </View>
          ) : (
            partenariats.map((p) => (
              <View
                key={p.cle}
                accessible
                accessibilityLabel={T.partenariatLu(p.partenariat, p.lieu.nom)}
                className="flex-row items-center gap-3 rounded-carte border-2 border-encre bg-carte p-4"
              >
                <Text className="text-3xl">{p.lieu.emoji}</Text>
                <View className="flex-1 gap-1">
                  <Text className="self-start overflow-hidden rounded-md bg-jaune-clair px-2 py-0.5 font-texte-semi text-xs text-encre">
                    {T.partenariat(p.partenariat)}
                  </Text>
                  <Text className="font-texte-gras text-[15px] text-encre">{p.lieu.nom}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        <View className="gap-3">
          <Text accessibilityRole="header" accessibilityLabel={T.publicationsLu(publications.length)} className="font-titre-gras text-xl text-encre">
            {T.publications(publications.length)}
          </Text>
          {publications.length === 0 ? (
            <View className="rounded-carte border-2 border-dashed border-ligne px-5 py-5">
              <Text className="text-center font-texte text-sm leading-5 text-gris">{lierPonctuation(T.aucunePublication)}</Text>
            </View>
          ) : (
            <View className="-mx-0.5 flex-row flex-wrap">
              {publications.map(({ publication, lieu }) => (
                <VignetteCollection
                  key={publication.id}
                  lieu={lieu}
                  image={trouverVignettePublication(publication) ?? trouverVignetteLieu(lieu.id, siennes)}
                  libelle={T.vignette(nom, lieu.nom, ecrireQuartierVille(lieu))}
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
