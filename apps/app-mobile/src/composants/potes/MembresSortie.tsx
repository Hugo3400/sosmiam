import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { MESSAGES_SERVICE } from "@sos-miam/commun/contenus/messages-services";
import { MAX_PARTICIPANTS_SORTIE } from "@sos-miam/commun/regles/potes";
import type { Pote, Sortie } from "@sos-miam/commun/types/potes";
import { Bouton } from "~/composants/interface/Bouton";
import { FeuilleConfirmation } from "~/composants/interface/FeuilleConfirmation";
import { FeuilleInviterSortie } from "~/composants/potes/FeuilleInviterSortie";
import { RondPote } from "~/composants/potes/RondPote";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import { utiliserMonId } from "~/hooks/utiliser-mon-id";

type Props = {
  sortie: Sortie;
  /** La sortie a commencé depuis un moment : on n'y invite plus personne */
  passee: boolean;
  /** Petit message en haut de l'écran (aussi lu par le lecteur d'écran) */
  onAnnoncer: (texte: string) => void;
};

type Membre = { pote: Pote; enAttente: boolean };

/**
 * « Qui vient ? » : les participants (l'organisateur en premier) puis les invités qui n'ont pas encore répondu, marqués « en
 * attente ». L'organisateur peut retirer quelqu'un (après confirmation, sans le prévenir) et inviter d'autres potes de sa bande.
 * Les personnes bloquées n'apparaissent pas.
 */
export function MembresSortie({ sortie, passee, onAnnoncer }: Props) {
  const { trouverPote, bloques, retirerParticipant } = utiliserCommunaute();
  const monId = utiliserMonId();
  const [aRetirer, setARetirer] = useState<Membre | null>(null);
  const [confirmationOuverte, setConfirmationOuverte] = useState(false);
  const [invitationOuverte, setInvitationOuverte] = useState(false);
  const organisateur = sortie.organisateur === monId;
  const bloquesIds = new Set(bloques.map((b) => b.id));
  const invites = sortie.invites ?? [];
  const complet = sortie.participants.length + invites.length >= MAX_PARTICIPANTS_SORTIE;

  const versMembre = (id: string, enAttente: boolean): Membre[] => {
    const pote = bloquesIds.has(id) ? null : trouverPote(id);
    return pote ? [{ pote, enAttente }] : [];
  };
  // L'organisateur en premier (s'il est encore de la sortie), puis les autres participants, puis les invitations en attente
  const participants = [sortie.organisateur, ...sortie.participants.filter((id) => id !== sortie.organisateur)].filter((id) => sortie.participants.includes(id));
  const membres = [
    ...participants.flatMap((id) => versMembre(id, false)),
    ...invites.filter((id) => !sortie.participants.includes(id)).flatMap((id) => versMembre(id, true)),
  ];

  async function retirer(membre: Membre) {
    const erreur = await retirerParticipant(sortie.id, membre.pote.id);
    if (erreur) onAnnoncer(MESSAGES_SERVICE[erreur].texte);
    else onAnnoncer(membre.enAttente ? `L'invitation de ${membre.pote.prenom} est retirée. En toute discrétion 🤫` : `${membre.pote.prenom} ne fait plus partie de la sortie. En toute discrétion 🤫`);
  }

  return (
    <View className="gap-3">
      <Text accessibilityRole="header" className="font-titre-gras text-xl text-encre">
        Qui vient ?
      </Text>
      <View className="overflow-hidden rounded-carte border-2 border-encre bg-white">
        {membres.map((m, i) => {
          const estMoi = m.pote.id === monId;
          const estOrganisateur = m.pote.id === sortie.organisateur && !m.enAttente;
          const etiquette = m.enAttente ? "En attente" : estOrganisateur ? "Organise" : null;
          return (
            <View key={m.pote.id} className={`min-h-14 flex-row items-center gap-3 px-3.5 py-2.5 ${i < membres.length - 1 ? "border-b border-ligne" : ""}`}>
              <View accessible accessibilityLabel={`${estMoi ? "Toi" : m.pote.prenom}${etiquette ? `, ${etiquette.toLowerCase()}` : ""}`} className="flex-1 flex-row items-center gap-3">
                <View className={m.enAttente ? "opacity-50" : ""}>
                  <RondPote pote={m.pote} taille={36} />
                </View>
                <View className="flex-1">
                  <Text numberOfLines={1} className="font-texte-gras text-base text-encre">
                    {estMoi ? "Toi" : m.pote.prenom}
                  </Text>
                  {m.pote.pseudo && !estMoi ? (
                    <Text numberOfLines={1} className="font-texte text-[13px] text-gris">
                      @{m.pote.pseudo}
                    </Text>
                  ) : null}
                </View>
                {etiquette ? (
                  <View className={`rounded-full px-2.5 py-1 ${m.enAttente ? "bg-ligne" : "bg-jaune"}`}>
                    <Text className="font-texte-semi text-[12px] text-encre">{etiquette}</Text>
                  </View>
                ) : null}
              </View>
              {organisateur && !estMoi ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Retirer ${m.pote.prenom}`}
                  accessibilityHint={m.enAttente ? "Son invitation disparaît, sans qu'on le prévienne" : "Sans le prévenir, après confirmation"}
                  hitSlop={6}
                  onPress={() => {
                    vibrerLegerement();
                    setARetirer(m);
                    setConfirmationOuverte(true);
                  }}
                  className="h-9 min-w-20 items-center justify-center rounded-full border-2 border-encre bg-white px-3 active:opacity-70"
                >
                  <Text className="font-texte-gras text-[13px] text-encre">Retirer</Text>
                </Pressable>
              ) : null}
            </View>
          );
        })}
      </View>

      {organisateur && !passee ? (
        <Bouton
          libelle={complet ? `Complet : ${MAX_PARTICIPANTS_SORTIE} personnes` : "Inviter d'autres potes"}
          variante="blanc"
          desactive={complet}
          indice={complet ? undefined : "Choisis des potes de ta bande à inviter"}
          onPress={() => setInvitationOuverte(true)}
        />
      ) : null}

      <FeuilleConfirmation
        visible={confirmationOuverte}
        emoji="👋"
        titre={aRetirer ? (aRetirer.enAttente ? `Retirer l'invitation de ${aRetirer.pote.prenom} ?` : `Retirer ${aRetirer.pote.prenom} de la sortie ?`) : ""}
        detail={
          aRetirer?.enAttente
            ? "Son « Tu viens ? » disparaît. On ne prévient personne."
            : "Plus de vote ni de discussion pour cette sortie. On ne prévient personne, et tu pourras toujours l'inviter de nouveau."
        }
        libelleConfirmer="Retirer"
        libelleRester="Finalement non"
        onConfirmer={() => {
          if (aRetirer) void retirer(aRetirer);
        }}
        onFermer={() => setConfirmationOuverte(false)}
      />

      <FeuilleInviterSortie
        visible={invitationOuverte}
        sortie={sortie}
        onFermer={() => setInvitationOuverte(false)}
        onInvites={(texte) => {
          setInvitationOuverte(false);
          onAnnoncer(texte);
        }}
      />
    </View>
  );
}
