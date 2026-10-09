import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import type { DemandeComptoir } from "@sos-miam/commun/types/comptoir";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { decrireAttente } from "~/fonctions/pro/decrire-attente";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import couleurs from "~/theme/couleurs";

type Props = {
  demande: DemandeComptoir;
  maintenant: Date;
  /** Addition : marquer réglée */
  onRegler: () => void;
  /** Addition : refuser (motif à choisir ensuite) */
  onRefuser: () => void;
  /** Récompense : la remettre au client */
  onOffrir: () => void;
};

/** Un bouton de 48 pt au moins, comme tous les gestes du mode pro (on les fait souvent debout, plateau à la main) */
function BoutonCarte({ libelle, libelleLu, plein, icone, onPress }: { libelle: string; libelleLu: string; plein: boolean; icone?: "checkmark" | "gift"; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={libelleLu}
      onPress={() => {
        vibrerLegerement();
        onPress();
      }}
      className={`min-h-12 flex-1 flex-row items-center justify-center gap-2 rounded-full border-2 border-encre px-4 active:opacity-80 ${plein ? "bg-jaune" : "bg-white"}`}
    >
      {icone ? <Ionicons name={icone} size={18} color={couleurs.encre} /> : null}
      <Text className="font-texte-gras text-base text-encre">{libelle}</Text>
    </Pressable>
  );
}

/**
 * Une demande en attente au comptoir : qui (prénom, initiale, emoji), depuis quand, le code à comparer avec celui que
 * montre le client, et les gestes. Une addition se marque réglée ou se refuse ; une récompense s'offre.
 */
export function CarteDemandeComptoir({ demande, maintenant, onRegler, onRefuser, onOffrir }: Props) {
  const nom = demande.initialeNom ? `${demande.prenom} ${demande.initialeNom}.` : demande.prenom;
  const attente = decrireAttente(demande.depuis, maintenant);
  const recompense = demande.type === "recompense";
  const detail = recompense
    ? `Récompense : ${demande.recompense ?? "sa récompense"}`
    : `Addition · ${demande.tamponsIci} tampon${demande.tamponsIci > 1 ? "s" : ""} ici`;
  const codeLu = demande.code.split("").join(", ");

  return (
    <View className={`gap-4 rounded-carte border-2 border-encre p-4 ${recompense ? "bg-jaune-clair" : "bg-white"}`}>
      <View accessible accessibilityLabel={`${nom}, ${attente}. ${detail}. Code : ${codeLu}`} className="gap-3">
        <View className="flex-row items-center gap-3">
          <View className="h-12 w-12 items-center justify-center rounded-full border-2 border-encre bg-creme">
            <Text className="text-2xl">{demande.avatar}</Text>
          </View>
          <View className="flex-1 gap-0.5">
            <Text numberOfLines={1} className="font-texte-gras text-lg text-encre">
              {nom}
            </Text>
            <Text numberOfLines={1} className="font-texte-semi text-sm text-gris">
              {recompense ? "🎁 " : ""}
              {lierPonctuation(detail)}
            </Text>
          </View>
          <Text className="font-texte text-sm text-gris">{attente}</Text>
        </View>
        <View className="flex-row justify-center gap-2">
          {demande.code.split("").map((chiffre, i) => (
            <View key={i} className="h-14 w-12 items-center justify-center rounded-xl border-2 border-encre bg-creme">
              <Text className="font-titre text-[30px] text-encre">{chiffre}</Text>
            </View>
          ))}
        </View>
      </View>
      {recompense ? (
        <View className="flex-row">
          <BoutonCarte libelle="Offrir" libelleLu={`Offrir la récompense de ${nom}`} plein icone="gift" onPress={onOffrir} />
        </View>
      ) : (
        <View className="flex-row gap-3">
          <BoutonCarte libelle="Réglée" libelleLu={`Addition de ${nom} réglée`} plein icone="checkmark" onPress={onRegler} />
          <BoutonCarte libelle="Refuser" libelleLu={`Refuser l'addition de ${nom}`} plein={false} onPress={onRefuser} />
        </View>
      )}
    </View>
  );
}
