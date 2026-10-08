import { Pressable, Text, View } from "react-native";

import { ID_MOI } from "@sos-miam/commun/regles/potes";
import type { ListePartagee, Pote } from "@sos-miam/commun/types/potes";
import { Bouton } from "~/composants/interface/Bouton";
import { RondPote } from "~/composants/potes/RondPote";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  liste: ListePartagee;
  /** L'auteur de la liste (toi : identifiant « moi »), ou null s'il n'est plus connu */
  auteur: Pote | null;
  /** Abonnés connus et pas bloqués (toi compris si tu la suis) */
  abonnes: Pote[];
  /** Nombre d'adresses que tu vois (sans les bars avant 18 ans) */
  nombreLieux: number;
  /** Vrai si tu suis la liste ; null pour ta propre liste (on ne suit pas sa liste) */
  suivie: boolean | null;
  onBasculerSuivi: () => void;
  onOuvrirAuteur: (id: string) => void;
};

const TAILLE_EMOJI = 88;
// Avatars d'abonnés montrés en pile, le reste est compté dans la phrase
const MAX_AVATARS = 4;

/** « toi, Léa et Tom » ; au-delà de 3, « toi, Léa et 3 autres » */
function nommerAbonnes(abonnes: Pote[]): string {
  const noms = abonnes.map((p) => (p.id === ID_MOI ? "toi" : p.prenom));
  if (noms.length <= 3) return noms.length > 1 ? `${noms.slice(0, -1).join(", ")} et ${noms.at(-1)}` : noms[0];
  return `${noms.slice(0, 2).join(", ")} et ${noms.length - 2} autres`;
}

/** Le haut d'une liste partagée : son emoji, son titre, sa description, qui l'a faite, qui la suit, et le bouton pour la suivre. */
export function EnTeteListe({ liste, auteur, abonnes, nombreLieux, suivie, onBasculerSuivi, onOuvrirAuteur }: Props) {
  const estAMoi = liste.auteur === ID_MOI;
  // Toi d'abord, puis les autres dans l'ordre de la liste
  const abonnesRanges = [...abonnes].sort((a, b) => Number(b.id === ID_MOI) - Number(a.id === ID_MOI));
  const phraseAbonnes = abonnesRanges.length === 0 ? "Personne ne la suit encore" : `Suivie par ${nommerAbonnes(abonnesRanges)}`;
  const adresses = `${nombreLieux} adresse${nombreLieux > 1 ? "s" : ""}`;

  return (
    <View className="items-center gap-3">
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{ width: TAILLE_EMOJI, height: TAILLE_EMOJI }}
        className="items-center justify-center rounded-3xl border-2 border-encre bg-jaune-clair"
      >
        {/* Taille fixe : l'emoji reste dans sa case même avec un grand texte dans les réglages du téléphone */}
        <Text allowFontScaling={false} style={{ fontSize: 46, lineHeight: 58 }}>
          {liste.emoji}
        </Text>
      </View>

      <Text accessibilityRole="header" className="text-center font-titre text-3xl text-encre">
        {liste.titre}
      </Text>
      {liste.description ? (
        <Text className="text-center font-texte text-base leading-6 text-gris">{lierPonctuation(liste.description)}</Text>
      ) : null}

      {auteur ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={estAMoi ? "Liste faite par toi" : `Liste de ${auteur.prenom}, @${auteur.pseudo}`}
          accessibilityHint={estAMoi ? "Ouvre ton profil de pote" : `Ouvre le profil de ${auteur.prenom}`}
          onPress={() => {
            vibrerLegerement();
            onOuvrirAuteur(auteur.id);
          }}
          className="min-h-11 flex-row items-center gap-2 rounded-full border-2 border-encre bg-white py-1 pl-1 pr-4 active:opacity-70"
        >
          <RondPote pote={auteur} taille={32} />
          <Text className="font-texte-semi text-[15px] text-encre">{estAMoi ? "Par toi" : `Par ${auteur.prenom}`}</Text>
          {!estAMoi && auteur.pseudo ? <Text className="font-texte text-sm text-gris">@{auteur.pseudo}</Text> : null}
        </Pressable>
      ) : null}

      <View accessible accessibilityLabel={`${adresses}. ${phraseAbonnes}.`} className="flex-row flex-wrap items-center justify-center gap-x-2 gap-y-1">
        <Text className="font-texte-moyen text-sm text-gris">📍 {adresses}</Text>
        <Text className="font-texte text-sm text-gris">·</Text>
        {abonnesRanges.length > 0 ? (
          <View className="flex-row pl-1.5">
            {abonnesRanges.slice(0, MAX_AVATARS).map((p) => (
              <View key={p.id} className="-ml-1.5">
                <RondPote pote={p} taille={24} />
              </View>
            ))}
          </View>
        ) : null}
        <Text className="font-texte-moyen text-sm text-gris">{phraseAbonnes}</Text>
      </View>

      {suivie !== null ? (
        <Bouton
          libelle={suivie ? "Ne plus suivre" : "Suivre la liste"}
          variante={suivie ? "blanc" : "jaune"}
          petit
          indice={suivie ? "Tu arrêtes de suivre cette liste" : "Tu pourras aussi y ajouter tes adresses"}
          onPress={onBasculerSuivi}
          className="mt-1"
        />
      ) : null}
    </View>
  );
}
