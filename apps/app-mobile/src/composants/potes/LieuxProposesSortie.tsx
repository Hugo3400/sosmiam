import Ionicons from "@expo/vector-icons/Ionicons";
import { Keyboard, Pressable, Text, View } from "react-native";

import type { Lieu } from "@sos-miam/commun/types/lieu";
import { VignetteLieu } from "~/composants/explorer/VignetteLieu";
import { Bouton } from "~/composants/interface/Bouton";
import { TEXTES_VOTE_SORTIE_PAR_LANGUE } from "~/contenus/textes-vote-sortie";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { formaterDistanceLangue } from "~/fonctions/langue/formater-distance-langue";
import { calculerKmLieu } from "~/fonctions/lieux/calculer-km-lieu";
import { trouverVignetteLieu } from "~/fonctions/publications/trouver-vignette-lieu";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { retirerEmoji } from "~/fonctions/texte/retirer-emoji";
import { utiliserActivite } from "~/hooks/utiliser-activite";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserPointDeDepart } from "~/hooks/utiliser-point-de-depart";
import { utiliserPublications } from "~/hooks/utiliser-publications";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  /** Lieux proposés au départ, dans l'ordre où ils ont été choisis */
  lieux: Lieu[];
  /** Nombre de lieux au plus */
  max: number;
  onAjouter: () => void;
  onRetirer: (lieuId: number) => void;
  erreur?: string | null;
};

/** Les lieux proposés au départ d'une nouvelle sortie : la liste (avec de quoi en retirer) et « Ajouter un lieu ». */
export function LieuxProposesSortie({ lieux, max, onAjouter, onRetirer, erreur }: Props) {
  const couleurs = utiliserCouleurs();
  const { langue } = utiliserLangue();
  const T = utiliserTextes(TEXTES_VOTE_SORTIE_PAR_LANGUE).lieuxProposes;
  const { estMasquee } = utiliserActivite();
  const { publications: toutesLesPublications } = utiliserPublications();
  const depart = utiliserPointDeDepart();
  const publications = toutesLesPublications.filter((p) => !estMasquee(p.id));
  const complet = lieux.length >= max;

  return (
    <View className="gap-3">
      {lieux.length > 0 ? (
        <View>
          {lieux.map((lieu) => {
            // Distance inconnue (lieu pas encore placé) : sa ville à la place, jamais « 0 km »
            const km = calculerKmLieu(lieu, depart);
            const distance = km === null ? null : formaterDistanceLangue(km, langue);
            return (
              <View key={lieu.id} className="min-h-14 flex-row items-center gap-3 border-b border-ligne py-2">
                <View accessible accessibilityLabel={`${lieu.nom}, ${lieu.info}, ${distance ? T.aDistance(distance) : lieu.ville}`} className="flex-1 flex-row items-center gap-3">
                  <VignetteLieu lieu={lieu} image={trouverVignetteLieu(lieu.id, publications)} hauteur={44} arrondi={12} />
                  <View className="flex-1">
                    <Text numberOfLines={1} className="font-texte-gras text-base text-encre">
                      {lieu.nom}
                    </Text>
                    <Text numberOfLines={1} className="font-texte text-sm text-gris">
                      {lieu.info} · {distance ?? lieu.ville}
                    </Text>
                  </View>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={T.retirer(lieu.nom)}
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
            {lierPonctuation(T.vide)}
          </Text>
        </View>
      )}

      {erreur ? (
        <Text accessibilityLabel={retirerEmoji(erreur)} className="font-texte text-sm leading-5 text-rouge-texte">
          {lierPonctuation(erreur)}
        </Text>
      ) : null}

      <Bouton
        libelle={complet ? T.maximum(max) : lieux.length === 0 ? T.choisir : T.ajouter}
        variante="blanc"
        petit
        desactive={complet}
        indice={complet ? undefined : T.ajouterIndice}
        onPress={() => {
          // Le clavier du titre resterait ouvert par-dessus la liste des lieux : on le range avant
          Keyboard.dismiss();
          onAjouter();
        }}
      />
    </View>
  );
}
