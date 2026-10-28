import { useState } from "react";
import { AccessibilityInfo, Text, View } from "react-native";

import { MESSAGES_SERVICE } from "@sos-miam/commun/contenus/messages-services";
import { MAX_PARTICIPANTS_SORTIE } from "@sos-miam/commun/regles/potes";
import type { Sortie } from "@sos-miam/commun/types/potes";
import { Bouton } from "~/composants/interface/Bouton";
import { FeuilleBas } from "~/composants/interface/FeuilleBas";
import { ChoixParticipants } from "~/composants/potes/ChoixParticipants";
import { REFUS_LIMITATION } from "~/contenus/limitation-compte";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { listerPrenoms } from "~/fonctions/texte/lister-prenoms";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";

type Props = {
  visible: boolean;
  sortie: Sortie;
  onFermer: () => void;
  /** Les invitations sont parties : le message à annoncer en haut de l'écran */
  onInvites: (texte: string) => void;
};

/**
 * « Inviter d'autres potes » (l'organisateur seulement) : les potes de ta bande qui ne sont ni dans la sortie ni déjà invités,
 * dans la limite de 15 personnes en tout (toi et les invitations en attente compris) ; chacun reçoit « Tu viens ? ».
 */
export function FeuilleInviterSortie({ visible, sortie, onFermer, onInvites }: Props) {
  const { potes, inviterASortie } = utiliserCommunaute();
  const [choisis, setChoisis] = useState<string[]>([]);
  const [envoi, setEnvoi] = useState(false);
  const [souci, setSouci] = useState<string | null>(null);
  // À chaque ouverture, on repart d'une feuille vierge
  const [ouvert, setOuvert] = useState(visible);
  if (visible !== ouvert) {
    setOuvert(visible);
    if (visible) {
      setChoisis([]);
      setEnvoi(false);
      setSouci(null);
    }
  }

  const invites = sortie.invites ?? [];
  const possibles = potes.filter((p) => !sortie.participants.includes(p.id) && !invites.includes(p.id));
  const places = Math.max(0, MAX_PARTICIPANTS_SORTIE - sortie.participants.length - invites.length);

  async function inviter() {
    if (envoi || choisis.length === 0) return;
    setEnvoi(true);
    setSouci(null);
    const erreur = await inviterASortie(sortie.id, choisis);
    setEnvoi(false);
    if (erreur) {
      const texte = erreur === "compte-limite" ? REFUS_LIMITATION.sortie : MESSAGES_SERVICE[erreur].texte;
      setSouci(texte);
      AccessibilityInfo.announceForAccessibility(texte);
      return;
    }
    const prenoms = listerPrenoms(potes.filter((p) => choisis.includes(p.id)).map((p) => p.prenom));
    onInvites(`📨 C'est envoyé : ${prenoms} ${choisis.length > 1 ? "reçoivent" : "reçoit"} « Tu viens ? »`);
  }

  return (
    <FeuilleBas
      visible={visible}
      titre="Inviter d'autres potes"
      sousTitre={`Plus on est de fous, plus on mange. ${MAX_PARTICIPANTS_SORTIE} personnes au plus, toi compris.`}
      onFermer={onFermer}
      pied={
        <>
          {souci ? (
            <Text className="overflow-hidden rounded-2xl bg-rose-alerte px-4 py-2.5 font-texte-semi text-sm leading-5 text-rouge-texte">{lierPonctuation(souci)}</Text>
          ) : null}
          {possibles.length > 0 && places > 0 ? (
            <Bouton
              libelle={envoi ? "Un instant…" : choisis.length > 0 ? `Inviter (${choisis.length})` : "Inviter"}
              desactive={envoi || choisis.length === 0}
              indice="Chacun reçoit « Tu viens ? »"
              onPress={() => void inviter()}
            />
          ) : null}
          <Bouton libelle={possibles.length > 0 && places > 0 ? "Annuler" : "Fermer"} variante="blanc" onPress={onFermer} />
        </>
      }
    >
      {places === 0 ? (
        <View className="items-center gap-2 rounded-carte border-2 border-dashed border-ligne px-6 py-6">
          <Text className="text-center font-texte text-base leading-6 text-gris">
            {lierPonctuation(`La sortie affiche complet : ${MAX_PARTICIPANTS_SORTIE} personnes, invitations en attente comprises. Retire quelqu'un pour faire de la place.`)}
          </Text>
        </View>
      ) : possibles.length === 0 && potes.length > 0 ? (
        <View className="items-center gap-2 rounded-carte border-2 border-dashed border-ligne px-6 py-6">
          <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-3xl">
            🙌
          </Text>
          <Text className="text-center font-texte text-base leading-6 text-gris">{lierPonctuation("Toute ta bande est déjà dans le coup !")}</Text>
        </View>
      ) : (
        <ChoixParticipants
          potes={possibles}
          choisis={choisis}
          max={places}
          indiceMax={`${MAX_PARTICIPANTS_SORTIE} personnes au plus par sortie, toi compris`}
          onBasculer={(id) => {
            setSouci(null);
            setChoisis((avant) => (avant.includes(id) ? avant.filter((x) => x !== id) : [...avant, id]));
          }}
        />
      )}
    </FeuilleBas>
  );
}
