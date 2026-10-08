import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import type { Lieu } from "@sos-miam/commun/types/lieu";
import { VignetteLieu } from "~/composants/explorer/VignetteLieu";
import { Bouton } from "~/composants/interface/Bouton";
import { publicationsExemples } from "~/contenus/publications-exemples";
import { formaterDistance } from "~/fonctions/geo/formater-distance";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { calculerKmLieu } from "~/fonctions/lieux/calculer-km-lieu";
import { trouverVignetteLieu } from "~/fonctions/publications/trouver-vignette-lieu";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserActivite } from "~/hooks/utiliser-activite";
import { utiliserPointDeDepart } from "~/hooks/utiliser-point-de-depart";
import couleurs from "~/theme/couleurs";

type Props = {
  /** Lieux proposés au départ, dans l'ordre où ils ont été choisis */
  lieux: Lieu[];
  /** Nombre de lieux au plus */
  max: number;
  onAjouter: () => void;
  onRetirer: (lieuId: number) => void;
  /** Petite phrase au-dessus du bouton (ex. pas de bar avec un mineur) */
  note?: string | null;
  erreur?: string | null;
};

/** Les lieux proposés au départ d'une nouvelle sortie : la liste (avec de quoi en retirer) et « Ajouter un lieu ». */
export function LieuxProposesSortie({ lieux, max, onAjouter, onRetirer, note, erreur }: Props) {
  const { estMasquee } = utiliserActivite();
  const depart = utiliserPointDeDepart();
  const publications = publicationsExemples.filter((p) => !estMasquee(p.id));
  const complet = lieux.length >= max;

  return (
    <View className="gap-3">
      {lieux.length > 0 ? (
        <View>
          {lieux.map((lieu) => {
            const distance = formaterDistance(calculerKmLieu(lieu, depart));
            return (
              <View key={lieu.id} className="min-h-14 flex-row items-center gap-3 border-b border-ligne py-2">
                <View accessible accessibilityLabel={`${lieu.nom}, ${lieu.info}, à ${distance}`} className="flex-1 flex-row items-center gap-3">
                  <VignetteLieu lieu={lieu} image={trouverVignetteLieu(lieu.id, publications)} hauteur={44} arrondi={12} />
                  <View className="flex-1">
                    <Text numberOfLines={1} className="font-texte-gras text-base text-encre">
                      {lieu.nom}
                    </Text>
                    <Text numberOfLines={1} className="font-texte text-sm text-gris">
                      {lieu.info} · {distance}
                    </Text>
                  </View>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Retirer ${lieu.nom}`}
                  onPress={() => {
                    vibrerLegerement();
                    onRetirer(lieu.id);
                  }}
                  className="h-11 w-11 items-center justify-center rounded-full active:opacity-60"
                >
                  <Ionicons name="close-circle-outline" size={24} color={couleurs.gris} />
                </Pressable>
              </View>
            );
          })}
        </View>
      ) : (
        <View className="items-center rounded-carte border-2 border-dashed border-ligne px-6 py-5">
          <Text className="text-center font-texte text-base leading-6 text-gris">
            {lierPonctuation("Propose au moins un lieu pour lancer le vote. Tes potes pourront en ajouter d'autres.")}
          </Text>
        </View>
      )}

      {note ? <Text className="font-texte text-sm leading-5 text-gris">{lierPonctuation(note)}</Text> : null}
      {erreur ? (
        <Text className="font-texte text-sm leading-5 text-rouge-texte">
          {lierPonctuation(erreur)}
        </Text>
      ) : null}

      <Bouton
        libelle={complet ? `${max} lieux, c'est le maximum` : lieux.length === 0 ? "Choisir un lieu" : "Ajouter un lieu"}
        variante="blanc"
        petit
        desactive={complet}
        indice={complet ? undefined : "Ouvre la liste des lieux, avec une recherche"}
        onPress={onAjouter}
      />
    </View>
  );
}
