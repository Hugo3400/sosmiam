import { useState } from "react";
import { AccessibilityInfo, Text, View } from "react-native";

import { LONGUEUR_MAX_TITRE_GROUPE } from "@sos-miam/commun/regles/chat";
import { Bouton } from "~/composants/interface/Bouton";
import { ChampTexte } from "~/composants/interface/ChampTexte";
import { FeuilleBas } from "~/composants/interface/FeuilleBas";
import { ChoixEmojiSortie } from "~/composants/potes/ChoixEmojiSortie";
import { REFUS_LIMITATION } from "~/contenus/limitation-compte";
import { TEXTES_INFOS_GROUPE as T } from "~/contenus/textes-infos-groupe";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserConversations } from "~/hooks/utiliser-conversations";

type Props = {
  visible: boolean;
  conversationId: string;
  titre: string;
  emoji: string;
  onFermer: () => void;
  onRenomme: (texte: string) => void;
};

export function FeuilleRenommerGroupe({ visible, conversationId, titre, emoji, onFermer, onRenomme }: Props) {
  const { renommerGroupe } = utiliserConversations();
  const [nom, setNom] = useState(titre);
  const [choisi, setChoisi] = useState(emoji);
  const [erreur, setErreur] = useState<string | null>(null);
  const [souci, setSouci] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [ouverte, setOuverte] = useState(visible);
  if (visible !== ouverte) {
    setOuverte(visible);
    if (visible) {
      setNom(titre);
      setChoisi(emoji);
      setErreur(null);
      setSouci(null);
      setEnvoi(false);
    }
  }

  async function enregistrer() {
    if (envoi) return;
    setEnvoi(true);
    const resultat = await renommerGroupe(conversationId, nom, choisi);
    setEnvoi(false);
    if (resultat === "ok") return onRenomme(T.renomme);
    if (resultat === "titre") return setErreur(T.titreRefuse);
    const texte = resultat === "interdit" ? T.reserveAdmins : resultat === "compte-limite" ? REFUS_LIMITATION.groupe : T.reseau;
    setSouci(texte);
    AccessibilityInfo.announceForAccessibility(texte);
  }

  return (
    <FeuilleBas
      visible={visible}
      titre={T.renommer}
      onFermer={onFermer}
      pied={
        <>
          {souci ? (
            <Text className="overflow-hidden rounded-2xl bg-rose-alerte px-4 py-2.5 font-texte-semi text-sm leading-5 text-rouge-texte">{lierPonctuation(souci)}</Text>
          ) : null}
          <Bouton libelle={envoi ? "Un instant…" : T.enregistrer} desactive={envoi || nom.trim() === ""} onPress={() => void enregistrer()} />
          <Bouton libelle="Annuler" variante="blanc" onPress={onFermer} />
        </>
      }
    >
      <View className="gap-4">
        <ChampTexte
          libelle={T.nom}
          valeur={nom}
          onChangeTexte={(texte) => {
            setNom(texte);
            if (erreur) setErreur(null);
          }}
          maxLength={LONGUEUR_MAX_TITRE_GROUPE}
          returnKeyType="done"
          aide={`${nom.length}/${LONGUEUR_MAX_TITRE_GROUPE} caractères`}
          erreur={erreur}
        />
        <ChoixEmojiSortie choisi={choisi} onChoisir={setChoisi} libelle={T.emoji} />
      </View>
    </FeuilleBas>
  );
}
