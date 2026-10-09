import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Text, View } from "react-native";

import type { CarteLieu } from "@sos-miam/commun/types/carte";
import type { Lieu } from "@sos-miam/commun/types/lieu";
import { Bouton } from "~/composants/interface/Bouton";
import { ElementCarte } from "~/composants/lieux/ElementCarte";
import { filtrerCarteSelonAge } from "~/fonctions/lieux/filtrer-carte-selon-age";
import { direDeLieu } from "~/fonctions/visites/dire-de-lieu";

type Props = {
  lieu: Lieu;
  /** Âge de la personne (null s'il est inconnu) : sous 18 ans, l'alcool est retiré de la carte */
  age: number | null;
  /** La carte du lieu (utiliserCarteDuLieu : celle enregistrée par le lieu, sinon celle de la fiche) */
  carteDuLieu: CarteLieu | undefined;
};

// Pas plus de trois éléments sur la fiche : la carte complète est à un toucher
const NOMBRE_APERCU = 3;

/**
 * Bloc « La carte » de la fiche d'un lieu (« Les formules » pour une sortie) : ses spécialités, sinon ses premiers
 * éléments, et un bouton vers la carte complète. Rien du tout si le lieu n'a pas (encore) de carte.
 */
export function ApercuCarte({ lieu, age, carteDuLieu }: Props) {
  const router = useRouter();
  // Calculé une fois par carte et par âge, pas à chaque rendu
  const contenu = useMemo(() => {
    if (!carteDuLieu) return null;
    const elements = filtrerCarteSelonAge(carteDuLieu, age).sections.flatMap((section) => section.elements);
    if (elements.length === 0) return null;
    const signatures = elements.filter((element) => element.signature);
    return {
      apercu: (signatures.length > 0 ? signatures : elements).slice(0, NOMBRE_APERCU),
      nombre: elements.length,
      avecSignatures: signatures.length > 0,
    };
  }, [carteDuLieu, age]);
  if (!contenu) return null;

  const { apercu, nombre, avecSignatures } = contenu;
  const formules = lieu.type === "sortie";
  const titre = formules ? "Les formules" : "La carte";

  return (
    <View className="gap-3">
      <View className="gap-0.5">
        <Text accessibilityRole="header" accessibilityLabel={titre} className="font-titre-gras text-[22px] leading-7 text-encre">
          {formules ? "🎟️" : "🍽️"} {titre}
        </Text>
        <Text className="font-texte text-sm text-gris">{avecSignatures ? "Ce que la maison fait de mieux" : "Un petit avant-goût"}</Text>
      </View>

      <View className="rounded-carte border-2 border-encre bg-white px-5 py-1.5">
        {apercu.map((element, index) => (
          <ElementCarte key={`${index}-${element.nom}`} element={element} separe={index > 0} />
        ))}
      </View>

      <Bouton
        libelle={`${formules ? "Voir toutes les formules" : "Voir toute la carte"} (${nombre})`}
        variante="blanc"
        indice={`Ouvre ${formules ? "toutes les formules" : "la carte complète"} ${direDeLieu(lieu.nom)}, rangée par sections`}
        onPress={() => router.push({ pathname: "/lieu/[id]/carte", params: { id: String(lieu.id) } })}
      />
    </View>
  );
}
