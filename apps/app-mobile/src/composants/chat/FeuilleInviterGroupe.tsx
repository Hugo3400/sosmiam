import { useState } from "react";
import { AccessibilityInfo, Text, View } from "react-native";

import { MAX_PARTICIPANTS_GROUPE } from "@sos-miam/commun/regles/chat";
import { Bouton } from "~/composants/interface/Bouton";
import { FeuilleBas } from "~/composants/interface/FeuilleBas";
import { ChoixParticipants } from "~/composants/potes/ChoixParticipants";
import { REFUS_LIMITATION_PAR_LANGUE } from "~/contenus/limitation-compte";
import { TEXTES_CHAT_LISTE_PAR_LANGUE } from "~/contenus/textes-chat-liste";
import { TEXTES_INFOS_GROUPE_PAR_LANGUE } from "~/contenus/textes-infos-groupe";
import type { ConversationEnrichie } from "~/contenus/type-discussion-chat";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { listerPrenomsLangue } from "~/fonctions/langue/lister-prenoms-langue";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import { utiliserConversations } from "~/hooks/utiliser-conversations";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  visible: boolean;
  conversation: ConversationEnrichie;
  onFermer: () => void;
  onInvites: (texte: string) => void;
};

export function FeuilleInviterGroupe({ visible, conversation, onFermer, onInvites }: Props) {
  const { langue } = utiliserLangue();
  const T = utiliserTextes(TEXTES_INFOS_GROUPE_PAR_LANGUE);
  const T_LISTE = utiliserTextes(TEXTES_CHAT_LISTE_PAR_LANGUE);
  const T_REFUS = utiliserTextes(REFUS_LIMITATION_PAR_LANGUE);
  const { potes } = utiliserCommunaute();
  const { inviterAuGroupe, peutDiscuterAvec } = utiliserConversations();
  const [choisis, setChoisis] = useState<string[]>([]);
  const [envoi, setEnvoi] = useState(false);
  const [souci, setSouci] = useState<string | null>(null);
  const [ouverte, setOuverte] = useState(visible);
  if (visible !== ouverte) {
    setOuverte(visible);
    if (visible) {
      setChoisis([]);
      setEnvoi(false);
      setSouci(null);
    }
  }

  const invites = conversation.invites ?? [];
  const possibles = potes.filter((p) => peutDiscuterAvec(p.id) && !conversation.participants.includes(p.id) && !invites.includes(p.id));
  const places = Math.max(0, MAX_PARTICIPANTS_GROUPE - conversation.participants.length - invites.length);

  async function inviter() {
    if (envoi || choisis.length === 0) return;
    setEnvoi(true);
    setSouci(null);
    const resultat = await inviterAuGroupe(conversation.id, choisis);
    setEnvoi(false);
    if (resultat !== "ok") {
      const texte = resultat === "plein" ? T.groupePlein : resultat === "interdit" ? T.reserveAdmins : resultat === "compte-limite" ? T_REFUS.groupe : T.reseau;
      setSouci(texte);
      AccessibilityInfo.announceForAccessibility(texte);
      return;
    }
    const prenoms = listerPrenomsLangue(potes.filter((p) => choisis.includes(p.id)).map((p) => p.prenom), langue);
    onInvites(T.invitesEnvoyees(prenoms, choisis.length));
  }

  return (
    <FeuilleBas
      visible={visible}
      titre={T.inviterTitre}
      sousTitre={T.inviterSousTitre(MAX_PARTICIPANTS_GROUPE)}
      onFermer={onFermer}
      pied={
        <>
          {souci ? (
            <Text className="overflow-hidden rounded-2xl bg-rose-alerte px-4 py-2.5 font-texte-semi text-sm leading-5 text-rouge-texte">{lierPonctuation(souci)}</Text>
          ) : null}
          {possibles.length > 0 && places > 0 ? (
            <Bouton
              libelle={envoi ? T_LISTE.unInstant : T.inviter(choisis.length)}
              desactive={envoi || choisis.length === 0}
              indice={T.inviterIndiceCompte}
              onPress={() => void inviter()}
            />
          ) : null}
          <Bouton libelle={possibles.length > 0 && places > 0 ? T_LISTE.annuler : T_LISTE.fermer} variante="blanc" onPress={onFermer} />
        </>
      }
    >
      {places === 0 ? (
        <View className="items-center gap-2 rounded-carte border-2 border-dashed border-ligne px-6 py-6">
          <Text className="text-center font-texte text-base leading-6 text-gris">{lierPonctuation(T.groupePlein)}</Text>
        </View>
      ) : possibles.length === 0 && potes.length > 0 ? (
        <View className="items-center gap-2 rounded-carte border-2 border-dashed border-ligne px-6 py-6">
          <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-3xl">
            🙌
          </Text>
          <Text className="text-center font-texte text-base leading-6 text-gris">{lierPonctuation(T.personneAInviter)}</Text>
        </View>
      ) : (
        <ChoixParticipants
          potes={possibles}
          choisis={choisis}
          max={places}
          indiceMax={T.groupePlein}
          onBasculer={(id) => {
            setSouci(null);
            setChoisis((avant) => (avant.includes(id) ? avant.filter((x) => x !== id) : [...avant, id]));
          }}
        />
      )}
    </FeuilleBas>
  );
}
