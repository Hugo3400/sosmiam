import { useState } from "react";
import { AccessibilityInfo, Text, View } from "react-native";

import { MAX_PARTICIPANTS_GROUPE } from "@sos-miam/commun/regles/chat";
import { Bouton } from "~/composants/interface/Bouton";
import { FeuilleBas } from "~/composants/interface/FeuilleBas";
import { ChoixParticipants } from "~/composants/potes/ChoixParticipants";
import { REFUS_LIMITATION } from "~/contenus/limitation-compte";
import { TEXTES_INFOS_GROUPE as T } from "~/contenus/textes-infos-groupe";
import type { ConversationEnrichie } from "~/contenus/type-discussion-chat";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { listerPrenoms } from "~/fonctions/texte/lister-prenoms";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import { utiliserConversations } from "~/hooks/utiliser-conversations";

type Props = {
  visible: boolean;
  conversation: ConversationEnrichie;
  onFermer: () => void;
  onInvites: (texte: string) => void;
};

export function FeuilleInviterGroupe({ visible, conversation, onFermer, onInvites }: Props) {
  const { potes } = utiliserCommunaute();
  const { inviterAuGroupe, peutDiscuterAvec, source } = utiliserConversations();
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
  const demo = source !== "compte";

  async function inviter() {
    if (envoi || choisis.length === 0) return;
    setEnvoi(true);
    setSouci(null);
    const resultat = await inviterAuGroupe(conversation.id, choisis);
    setEnvoi(false);
    if (resultat !== "ok") {
      const texte = resultat === "plein" ? T.groupePlein : resultat === "interdit" ? T.reserveAdmins : resultat === "compte-limite" ? REFUS_LIMITATION.groupe : T.reseau;
      setSouci(texte);
      AccessibilityInfo.announceForAccessibility(texte);
      return;
    }
    const prenoms = listerPrenoms(potes.filter((p) => choisis.includes(p.id)).map((p) => p.prenom));
    onInvites(demo ? T.invitesRejoignent(prenoms, choisis.length) : T.invitesEnvoyees(prenoms, choisis.length));
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
              libelle={envoi ? "Un instant…" : T.inviter(choisis.length)}
              desactive={envoi || choisis.length === 0}
              indice={demo ? T.inviterIndiceDemo : T.inviterIndiceCompte}
              onPress={() => void inviter()}
            />
          ) : null}
          <Bouton libelle={possibles.length > 0 && places > 0 ? "Annuler" : "Fermer"} variante="blanc" onPress={onFermer} />
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
