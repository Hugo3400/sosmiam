import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { COMMENTAIRE_ACTUS_MAX } from "@sos-miam/commun/regles/actus";
import type { Traduction } from "@sos-miam/commun/types/traduction";
import { Bouton } from "~/composants/interface/Bouton";
import { ChampTexte } from "~/composants/interface/ChampTexte";
import type { TEXTES_ACTUS } from "~/contenus/textes-actus";

type Props = {
  reponseA: string | null;
  T: Traduction<typeof TEXTES_ACTUS>["article"]["commenter"];
  onAnnulerReponse: () => void;
  onEnvoyer: (texte: string) => Promise<string | null>;
};

export function ChampCommentaireActus({ reponseA, T, onAnnulerReponse, onEnvoyer }: Props) {
  const [texte, setTexte] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [refus, setRefus] = useState<string | null>(null);

  async function envoyer() {
    if (texte.trim().length === 0 || enCours) return;
    setEnCours(true);
    const erreur = await onEnvoyer(texte.trim());
    setEnCours(false);
    setRefus(erreur);
    if (!erreur) setTexte("");
  }

  return (
    <View className="gap-2">
      {reponseA ? (
        <View className="flex-row items-center justify-between">
          <Text className="font-texte-semi text-sm text-encre">{T.reponseA(reponseA)}</Text>
          <Pressable accessibilityRole="button" hitSlop={8} onPress={onAnnulerReponse} className="min-h-11 justify-center active:opacity-70">
            <Text className="font-texte-gras text-sm text-encre underline">{T.annuler}</Text>
          </Pressable>
        </View>
      ) : null}
      <ChampTexte
        libelle={T.champ}
        valeur={texte}
        onChangeTexte={(t) => {
          setTexte(t);
          setRefus(null);
        }}
        placeholder={T.placeholder}
        multiline
        textAlignVertical="top"
        maxLength={COMMENTAIRE_ACTUS_MAX}
        hauteurMin={88}
        aide={T.compteur(texte.length, COMMENTAIRE_ACTUS_MAX)}
        erreur={refus}
      />
      <Bouton libelle={enCours ? T.envoi : T.publier} petit className="self-end" desactive={enCours || texte.trim().length === 0} onPress={() => void envoyer()} />
    </View>
  );
}
