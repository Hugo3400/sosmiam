import { useState } from "react";
import { AccessibilityInfo, Text, View } from "react-native";

import { MESSAGES_SERVICE_PAR_LANGUE } from "@sos-miam/commun/contenus/messages-services";
import { MAX_PARTICIPANTS_SORTIE } from "@sos-miam/commun/regles/potes";
import type { Sortie } from "@sos-miam/commun/types/potes";
import { Bouton } from "~/composants/interface/Bouton";
import { FeuilleBas } from "~/composants/interface/FeuilleBas";
import { ChoixParticipants } from "~/composants/potes/ChoixParticipants";
import { REFUS_LIMITATION_PAR_LANGUE } from "~/contenus/limitation-compte";
import { TEXTES_CHOIX_SORTIE_PAR_LANGUE } from "~/contenus/textes-choix-sortie";
import { listerPrenomsLangue } from "~/fonctions/langue/lister-prenoms-langue";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";

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
  const { langue } = utiliserLangue();
  const T = utiliserTextes(TEXTES_CHOIX_SORTIE_PAR_LANGUE).inviter;
  const R = utiliserTextes(REFUS_LIMITATION_PAR_LANGUE);
  const messagesService = utiliserTextes(MESSAGES_SERVICE_PAR_LANGUE);
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
      const texte = erreur === "compte-limite" ? R.sortie : messagesService[erreur].texte;
      setSouci(texte);
      AccessibilityInfo.announceForAccessibility(texte);
      return;
    }
    const prenoms = listerPrenomsLangue(potes.filter((p) => choisis.includes(p.id)).map((p) => p.prenom), langue);
    onInvites(T.envoye(prenoms, choisis.length));
  }

  return (
    <FeuilleBas
      visible={visible}
      titre={T.titre}
      sousTitre={T.sousTitre}
      onFermer={onFermer}
      pied={
        <>
          {souci ? (
            <Text className="overflow-hidden rounded-2xl bg-rose-alerte px-4 py-2.5 font-texte-semi text-sm leading-5 text-rouge-texte">{lierPonctuation(souci)}</Text>
          ) : null}
          {possibles.length > 0 && places > 0 ? (
            <Bouton
              libelle={envoi ? T.unInstant : choisis.length > 0 ? T.inviterNombre(choisis.length) : T.inviter}
              desactive={envoi || choisis.length === 0}
              indice={T.indiceInviter}
              onPress={() => void inviter()}
            />
          ) : null}
          <Bouton libelle={possibles.length > 0 && places > 0 ? T.annuler : T.fermer} variante="blanc" onPress={onFermer} />
        </>
      }
    >
      {places === 0 ? (
        <View className="items-center gap-2 rounded-carte border-2 border-dashed border-ligne px-6 py-6">
          <Text className="text-center font-texte text-base leading-6 text-gris">
            {lierPonctuation(T.complet)}
          </Text>
        </View>
      ) : possibles.length === 0 && potes.length > 0 ? (
        <View className="items-center gap-2 rounded-carte border-2 border-dashed border-ligne px-6 py-6">
          <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-3xl">
            🙌
          </Text>
          <Text className="text-center font-texte text-base leading-6 text-gris">{lierPonctuation(T.toutLeMonde)}</Text>
        </View>
      ) : (
        <ChoixParticipants
          potes={possibles}
          choisis={choisis}
          max={places}
          indiceMax={T.indiceMax}
          onBasculer={(id) => {
            setSouci(null);
            setChoisis((avant) => (avant.includes(id) ? avant.filter((x) => x !== id) : [...avant, id]));
          }}
        />
      )}
    </FeuilleBas>
  );
}
