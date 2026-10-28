import { Text, View } from "react-native";

import type { DemandeComptoir } from "@sos-miam/commun/types/comptoir";
import { BoutonCarteComptoir } from "~/composants/pro/BoutonCarteComptoir";
import { EmojiOuMiami } from "~/composants/profil/EmojiOuMiami";
import { TEXTES_DEMANDES_COMPTOIR_PAR_LANGUE } from "~/contenus/textes-demandes-comptoir";
import { decrireAttente } from "~/fonctions/pro/decrire-attente";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";

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

/**
 * Une demande en attente au comptoir : qui (prénom, initiale, emoji), depuis quand, le code à comparer avec celui que
 * montre le client, et les gestes. Une addition se marque réglée ou se refuse ; une récompense s'offre.
 */
export function CarteDemandeComptoir({ demande, maintenant, onRegler, onRefuser, onOffrir }: Props) {
  const { langue } = utiliserLangue();
  const T = utiliserTextes(TEXTES_DEMANDES_COMPTOIR_PAR_LANGUE);
  const nom = demande.initialeNom ? `${demande.prenom} ${demande.initialeNom}.` : demande.prenom;
  const attente = decrireAttente(demande.depuis, langue, maintenant);
  const recompense = demande.type === "recompense";
  const detail = recompense ? T.recompense(demande.recompense ?? T.saRecompense) : T.addition(demande.tamponsIci);
  const codeLu = demande.code.split("").join(", ");

  return (
    <View className={`gap-4 rounded-carte border-2 border-encre p-4 ${recompense ? "bg-jaune-clair" : "bg-carte"}`}>
      <View accessible accessibilityLabel={T.demandeLu(nom, attente, detail, codeLu)} className="gap-3">
        <View className="flex-row items-start gap-3">
          <View className="h-12 w-12 items-center justify-center rounded-full border-2 border-encre bg-creme">
            <EmojiOuMiami valeur={demande.avatar} taille={44} className="text-2xl" />
          </View>
          <View className="flex-1 gap-0.5">
            <View className="flex-row items-baseline gap-2">
              <Text numberOfLines={1} className="flex-1 font-texte-gras text-lg text-encre">
                {nom}
              </Text>
              <Text className="font-texte text-sm text-gris">{attente}</Text>
            </View>
            {/* Jamais coupé : la récompense entière, ou le nombre de tampons */}
            <Text className="font-texte-semi text-sm leading-5 text-gris">
              {recompense ? "🎁 " : ""}
              {lierPonctuation(detail)}
            </Text>
          </View>
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
          <BoutonCarteComptoir libelle={T.offrir} libelleLu={T.offrirLu(nom)} plein icone="gift" onPress={onOffrir} />
        </View>
      ) : (
        <View className="flex-row gap-3">
          <BoutonCarteComptoir libelle={T.reglee} libelleLu={T.regleeLu(nom)} plein icone="checkmark" onPress={onRegler} />
          <BoutonCarteComptoir libelle={T.refuser} libelleLu={T.refuserLu(nom)} plein={false} onPress={onRefuser} />
        </View>
      )}
    </View>
  );
}
