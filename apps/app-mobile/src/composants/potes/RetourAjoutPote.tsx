import { useRouter } from "expo-router";
import { useEffect } from "react";
import { AccessibilityInfo, Text, View } from "react-native";

import type { Pote } from "@sos-miam/commun/types/potes";
import type { ResultatAjoutBande } from "~/hooks/utiliser-communaute";
import { Bouton } from "~/composants/interface/Bouton";
import { RondPote } from "~/composants/potes/RondPote";
import { CARTE_REFUS_LIMITATION, REFUS_LIMITATION } from "~/contenus/limitation-compte";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

/** Ce qui s'est passé après un scan ou un texte collé (lien d'invitation, ou pseudo seul) */
export type RetourAjout = ResultatAjoutBande | { type: "pas-invitation" };

type Props = {
  retour: RetourAjout;
};

const decrire = (retour: RetourAjout): { emoji: string; titre: string; detail: string } => {
  switch (retour.type) {
    case "ajoute":
      return { emoji: "🎉", titre: `${retour.pote.prenom} a rejoint ta bande !`, detail: "Vous pouvez maintenant organiser des sorties et vous envoyer des lieux." };
    case "deja":
      return { emoji: "😄", titre: `${retour.pote.prenom} est déjà dans ta bande`, detail: "On ne peut pas l'ajouter deux fois, même un pote en or." };
    case "demande":
      return retour.pote
        ? { emoji: "📨", titre: `Demande envoyée à ${retour.pote.prenom}`, detail: "Dès qu'elle est acceptée, vous êtes dans la même bande. Avec son lien ou son QR code, c'est immédiat !" }
        : { emoji: "📨", titre: "Demande envoyée", detail: "Dès qu'elle est acceptée, vous êtes dans la même bande." };
    case "bloque":
      return { emoji: "🚫", titre: `Tu as bloqué ${retour.pote.prenom}`, detail: "Tant que cette personne est bloquée, elle ne rejoint pas ta bande. Tu peux changer d'avis depuis son profil." };
    case "introuvable":
      return { emoji: "🔍", titre: `On ne trouve pas @${retour.pseudo}`, detail: "Vérifie l'orthographe, ou demande-lui plutôt son lien ou son QR code (dans Potes, « Ajouter un pote »)." };
    case "demandes-fermees":
      return {
        emoji: "🔒",
        titre: retour.pote ? `${retour.pote.prenom} ne reçoit pas de demandes` : "Cette personne ne reçoit pas de demandes",
        detail: "Elle a choisi qu'on ne la trouve pas par son pseudo. Pour rejoindre sa bande, demande-lui son lien ou son QR code !",
      };
    case "lien-change":
      return { emoji: "🔄", titre: "Ce lien a changé", detail: "Ton pote a changé de pseudo depuis : demande-lui son nouveau lien, ou son QR code." };
    case "invitation-invalide":
      return { emoji: "🔗", titre: "Ce lien ne marche plus", detail: "Ton pote a peut-être changé son lien. Demande-lui le nouveau, ou son QR code : c'est réglé en 2 secondes." };
    case "erreur":
      // Compte limité : pas une panne, rien à réessayer (l'annonce de toute l'app dit où lire le pourquoi)
      if (retour.erreur === "compte-limite") return { emoji: CARTE_REFUS_LIMITATION.emoji, titre: CARTE_REFUS_LIMITATION.titreAjout, detail: REFUS_LIMITATION.bande };
      return { emoji: "😕", titre: "Ça n'a pas marché cette fois", detail: "Réessaie dans un instant. Si ça continue, demande à ton pote de te remontrer son QR code." };
    case "pas-invitation":
      return { emoji: "🤔", titre: "Ce n'est pas une invitation SOS Miam", detail: "Demande à ton pote son QR code, dans Potes puis « Ajouter un pote ». Ou colle son lien, il commence par sosmiam.fr/invitation/." };
    case "toi":
      return { emoji: "🪞", titre: "Hé, mais c'est toi !", detail: "Joli, mais tu fais déjà partie de ta bande. Montre plutôt ton QR code à un pote." };
  }
};

// Les emoji restent à l'écran mais ne sont pas lus (VoiceOver dirait leur nom)
const EMOJI = /[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu;

/** La réponse après un scan ou un texte collé : ajouté, déjà là, bloqué, introuvable… annoncée au lecteur d'écran, avec « Voir son profil » quand on connaît la personne. */
export function RetourAjoutPote({ retour }: Props) {
  const router = useRouter();
  const { emoji, titre, detail } = decrire(retour);
  const pote = "pote" in retour ? retour.pote : null;
  const reussi = retour.type === "ajoute" || retour.type === "demande";

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(`${titre}. ${detail}`.replace(EMOJI, "").replace(/\s+/g, " ").trim());
  }, [retour, titre, detail]);

  return (
    <View className={`gap-3 rounded-2xl border-2 px-4 py-4 ${reussi ? "border-encre bg-jaune-clair" : "border-ligne bg-carte"}`}>
      <View className="flex-row items-center gap-3">
        {pote ? (
          <RondPote pote={pote} taille={48} />
        ) : (
          <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-3xl">
            {emoji}
          </Text>
        )}
        <View className="flex-1">
          {/* L'emoji reste à l'écran, le lecteur d'écran lit le titre seul */}
          <Text accessibilityLabel={titre} className="font-texte-gras text-base text-encre">
            {pote ? `${emoji} ` : ""}
            {titre}
          </Text>
          <Text className="font-texte text-sm leading-5 text-gris">{lierPonctuation(detail)}</Text>
        </View>
      </View>
      {pote ? (
        <Bouton
          libelle="Voir son profil"
          variante="blanc"
          petit
          indice={`Ouvre le profil de ${pote.prenom}`}
          onPress={() => router.push({ pathname: "/potes/profil/[id]", params: { id: pote.id } })}
        />
      ) : null}
    </View>
  );
}
