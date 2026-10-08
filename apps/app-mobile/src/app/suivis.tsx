import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { calculerAge } from "@sos-miam/commun/regles/calculer-age";
import { Annonce } from "~/composants/interface/Annonce";
import { LigneSuivi } from "~/composants/suivi/LigneSuivi";
import { lieuxExemples } from "~/contenus/lieux-exemples";
import { filtrerLieuxSelonAge } from "~/fonctions/lieux/filtrer-lieux-selon-age";
import { listerSuivisAffichables } from "~/fonctions/suivi/lister-suivis-affichables";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserActivite } from "~/hooks/utiliser-activite";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import couleurs from "~/theme/couleurs";

type LigneAffichee = {
  cle: string;
  emoji: string;
  nom: string;
  sousTitre: string;
  degrade?: [string, string];
  indice: string;
  ouvrir: () => void;
};

/**
 * « Tu suis » (depuis l'onglet Profil) : les lieux et les créateurs que tu suis, du plus récent au plus ancien. Toucher une
 * ligne ouvre sa fiche ; « Suivi » demande confirmation avant de ne plus suivre. La liste est figée à l'ouverture : une
 * ligne qu'on ne suit plus reste là avec « Suivre », pour se raviser, et ne disparaît qu'à la prochaine visite.
 */
export default function Suivis() {
  const router = useRouter();
  const marges = useSafeAreaInsets();
  const { profil } = utiliserProfil();
  const activite = utiliserActivite();
  const [annonce, setAnnonce] = useState<{ texte: string; numero: number } | null>(null);
  const finAnnonce = useCallback(() => setAnnonce(null), []);
  const annoncer = useCallback((texte: string) => setAnnonce({ texte, numero: Date.now() }), []);

  // Les suivis du moment où l'écran s'ouvre (ou dès que l'activité du téléphone est relue)
  const [cles, setCles] = useState<readonly string[] | null>(() => (activite.chargee ? activite.suivis : null));
  useEffect(() => {
    if (cles === null && activite.chargee) setCles(activite.suivis);
  }, [cles, activite.chargee, activite.suivis]);

  const revenir = () => (router.canGoBack() ? router.back() : router.replace("/profil"));

  // Seulement ce qui existe encore et que ton âge autorise (comme dans le fil)
  const lieux = filtrerLieuxSelonAge(lieuxExemples, profil ? calculerAge(profil.dateNaissance) : null);
  const suivis = listerSuivisAffichables(cles ?? [], lieux);

  const lignesLieux: LigneAffichee[] = suivis.flatMap((suivi) => {
    if (suivi.type !== "lieu") return [];
    const { cle, lieu } = suivi;
    return [
      {
        cle,
        emoji: lieu.emoji,
        nom: lieu.nom,
        sousTitre: `${lieu.info} · ${lieu.quartier}, ${lieu.ville}`,
        degrade: lieu.couleurs,
        indice: "Ouvre la fiche du lieu",
        ouvrir: () => router.push({ pathname: "/lieu/[id]", params: { id: String(lieu.id) } }),
      },
    ];
  });

  const lignesCreateurs: LigneAffichee[] = suivis.flatMap((suivi) => {
    if (suivi.type !== "createur") return [];
    const { cle, pseudo } = suivi;
    // Comme sur sa page : sans ce qui est masqué ni les lieux que ton âge écarte
    const visibles = suivi.publications.filter((p) => !activite.estMasquee(p.id) && lieux.some((l) => l.id === p.lieuId)).length;
    return [
      {
        cle,
        emoji: "🎬",
        nom: `@${pseudo}`,
        sousTitre: `Créateur · ${visibles} publication${visibles > 1 ? "s" : ""}`,
        indice: "Ouvre sa page",
        ouvrir: () => router.push({ pathname: "/createur/[pseudo]", params: { pseudo } }),
      },
    ];
  });

  const sections = [
    { cle: "lieux", emoji: "🍽️", titre: "Lieux", lignes: lignesLieux },
    { cle: "createurs", emoji: "🎬", titre: "Créateurs", lignes: lignesCreateurs },
  ].filter((s) => s.lignes.length > 0);

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
        <View className="gap-1">
          <Text accessibilityRole="header" className="font-titre text-3xl text-encre">
            Tu suis
          </Text>
          {sections.length > 0 ? (
            <Text className="font-texte text-base leading-6 text-gris">
              {lierPonctuation("Leurs nouveautés passent en tête de ton fil. Tu as changé d'avis ? Touche « Suivi » : personne ne se vexe.")}
            </Text>
          ) : null}
        </View>

        {cles === null ? null : sections.length === 0 ? (
          <View className="items-center gap-2 rounded-carte border-2 border-dashed border-ligne px-6 py-8">
            <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-4xl">
              🔔
            </Text>
            <Text className="text-center font-titre-gras text-lg text-encre">Tu ne suis personne… pour l'instant.</Text>
            <Text className="text-center font-texte text-base leading-6 text-gris">
              {lierPonctuation("Touche « Suivre » sur une fiche ou une vidéo qui te plaît : ses nouveautés passeront en tête de ton fil.")}
            </Text>
          </View>
        ) : (
          sections.map((section) => {
            // Ceux que tu suis encore : une ligne qu'on ne suit plus reste affichée, sans compter
            const nombre = section.lignes.filter((l) => activite.estSuivi(l.cle)).length;
            return (
              <View key={section.cle} className="gap-3">
                <Text accessibilityRole="header" accessibilityLabel={`${section.titre}, ${nombre}`} className="font-titre-gras text-xl text-encre">
                  {section.emoji} {section.titre} ({nombre})
                </Text>
                <View className="overflow-hidden rounded-carte border-2 border-encre bg-white">
                  {section.lignes.map((ligne, i) => (
                    <LigneSuivi
                      key={ligne.cle}
                      cle={ligne.cle}
                      emoji={ligne.emoji}
                      nom={ligne.nom}
                      sousTitre={ligne.sousTitre}
                      degrade={ligne.degrade}
                      indice={ligne.indice}
                      derniere={i === section.lignes.length - 1}
                      onOuvrir={ligne.ouvrir}
                      onAnnoncer={annoncer}
                    />
                  ))}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <Annonce annonce={annonce} haut={marges.top + 60} onFin={finAnnonce} />
    </SafeAreaView>
  );
}
