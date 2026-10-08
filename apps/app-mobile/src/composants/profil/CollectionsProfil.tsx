import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View, type ImageSourcePropType } from "react-native";

import type { Lieu } from "@sos-miam/commun/types/lieu";
import { VignetteCollection } from "~/composants/profil/VignetteCollection";
import { lieuxExemples } from "~/contenus/lieux-exemples";
import { publicationsExemples } from "~/contenus/publications-exemples";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { filtrerLieuxSelonAge } from "~/fonctions/lieux/filtrer-lieux-selon-age";
import { trouverVignetteLieu } from "~/fonctions/publications/trouver-vignette-lieu";
import { trouverVignettePublication } from "~/fonctions/publications/trouver-vignette-publication";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  /** Lieux gardés (🔖), du plus récent au plus ancien */
  gardes: number[];
  /** Publications aimées (❤️), de la plus récente à la plus ancienne */
  jaimes: string[];
  age: number;
};

type Onglet = "gardes" | "jaimes";
type Vignette = { cle: string; lieu: Lieu; image: ImageSourcePropType | null; libelle: string };

/** Tes adresses gardées et tes publications aimées, en deux onglets et en grille de 3 colonnes. */
export function CollectionsProfil({ gardes, jaimes, age }: Props) {
  const router = useRouter();
  const [onglet, setOnglet] = useState<Onglet>("gardes");
  // Seulement les lieux qui existent encore et que ton âge autorise
  const lieux = filtrerLieuxSelonAge(lieuxExemples, age);

  const vignettesGardes: Vignette[] = gardes.flatMap((id) => {
    const lieu = lieux.find((l) => l.id === id);
    if (!lieu) return [];
    return [{ cle: `lieu-${id}`, lieu, image: trouverVignetteLieu(id, publicationsExemples), libelle: `${lieu.nom}, ${lieu.quartier}, ${lieu.ville}` }];
  });
  const vignettesJaimes: Vignette[] = jaimes.flatMap((idPublication) => {
    const publication = publicationsExemples.find((p) => p.id === idPublication);
    const lieu = publication ? lieux.find((l) => l.id === publication.lieuId) : undefined;
    if (!publication || !lieu) return [];
    const image = trouverVignettePublication(publication) ?? trouverVignetteLieu(lieu.id, publicationsExemples);
    return [{ cle: publication.id, lieu, image, libelle: `Publication aimée de ${lieu.nom}, ${lieu.quartier}` }];
  });

  const onglets = [
    { cle: "gardes" as const, emoji: "🔖", nom: "Gardés", nombre: vignettesGardes.length },
    { cle: "jaimes" as const, emoji: "❤️", nom: "J'aime", nombre: vignettesJaimes.length },
  ];
  const vignettes = onglet === "gardes" ? vignettesGardes : vignettesJaimes;
  const vide =
    onglet === "gardes"
      ? { emoji: "🔖", texte: "Touche 🔖 dans le fil pour garder une adresse. Ton futur toi affamé te dira merci." }
      : { emoji: "❤️", texte: "Double-touche une vidéo pour l'aimer : tes coups de cœur t'attendront ici." };

  return (
    <View className="gap-3">
      <Text accessibilityRole="header" className="font-titre-gras text-xl text-encre">Ta collection</Text>
      <View accessibilityRole="tablist" className="flex-row border-b-2 border-ligne">
        {onglets.map((o) => {
          const actif = o.cle === onglet;
          return (
            <Pressable
              key={o.cle}
              accessibilityRole="tab"
              accessibilityLabel={`${o.nom}, ${o.nombre}`}
              accessibilityState={{ selected: actif }}
              onPress={() => {
                vibrerLegerement();
                setOnglet(o.cle);
              }}
              className={`-mb-0.5 min-h-11 flex-1 items-center justify-center border-b-2 py-2 active:opacity-70 ${actif ? "border-encre" : "border-transparent"}`}
            >
              <Text className={`font-texte-gras text-base ${actif ? "text-encre" : "text-gris"}`}>
                {o.emoji} {o.nom} ({o.nombre})
              </Text>
            </Pressable>
          );
        })}
      </View>

      {vignettes.length === 0 ? (
        <View className="items-center gap-2 rounded-carte border-2 border-dashed border-ligne px-6 py-8">
          <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-4xl">{vide.emoji}</Text>
          <Text className="text-center font-texte text-base leading-6 text-gris">{lierPonctuation(vide.texte)}</Text>
        </View>
      ) : (
        <View className="-mx-0.5 flex-row flex-wrap">
          {vignettes.map((v) => (
            <VignetteCollection
              key={v.cle}
              lieu={v.lieu}
              image={v.image}
              libelle={v.libelle}
              onPress={() => router.push({ pathname: "/lieu/[id]", params: { id: String(v.lieu.id) } })}
            />
          ))}
        </View>
      )}
    </View>
  );
}
