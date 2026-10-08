import { useRouter } from "expo-router";
import { useEffect } from "react";
import { AccessibilityInfo, Text, View } from "react-native";

import type { Pote } from "@sos-miam/commun/types/potes";
import { Bouton } from "~/composants/interface/Bouton";
import { RondPote } from "~/composants/potes/RondPote";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

/** Ce qui s'est passé après un scan ou un texte collé (lien d'invitation, ou pseudo seul) */
export type RetourAjout =
  | { type: "ajoute" | "deja" | "bloque"; pote: Pote }
  | { type: "mineur"; pote: Pote; moyen: "lien" | "qr" | "pseudo" }
  | { type: "introuvable"; pseudo: string }
  | { type: "pas-invitation" }
  | { type: "toi" };

type Props = {
  retour: RetourAjout;
};

const decrire = (retour: RetourAjout): { emoji: string; titre: string; detail: string } => {
  switch (retour.type) {
    case "ajoute":
      return { emoji: "🎉", titre: `${retour.pote.prenom} a rejoint ta bande !`, detail: "Vous pouvez maintenant organiser des sorties et vous envoyer des lieux." };
    case "deja":
      return { emoji: "😄", titre: `${retour.pote.prenom} est déjà dans ta bande`, detail: "On ne peut pas l'ajouter deux fois, même un pote en or." };
    case "bloque":
      return { emoji: "🚫", titre: `Tu as bloqué ${retour.pote.prenom}`, detail: "Tant que cette personne est bloquée, elle ne rejoint pas ta bande. Tu peux changer d'avis depuis son profil." };
    // Démo : un adulte n'ajoute aucun mineur, quel que soit le moyen, tant que l'API ne vérifie pas les invitations
    case "mineur":
      return retour.moyen === "pseudo"
        ? { emoji: "🔐", titre: "Pas par le pseudo", detail: "Cette personne ne s'ajoute pas par son pseudo. Avec les comptes, ce sera par son lien ou son QR code, donnés en main propre." }
        : { emoji: "🔐", titre: "Pas encore possible", detail: "Cette invitation devra d'abord être vérifiée par SOS Miam, et ça arrive avec les comptes. Patience, ça vaut le coup !" };
    case "introuvable":
      return { emoji: "🔍", titre: `On ne trouve pas @${retour.pseudo}`, detail: "La démo ne connaît que des potes d'exemple : tes vrais potes arriveront avec les comptes." };
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
  const pote = "pote" in retour && retour.type !== "mineur" ? retour.pote : null;

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(`${titre}. ${detail}`.replace(EMOJI, "").replace(/\s+/g, " ").trim());
  }, [retour, titre, detail]);

  return (
    <View className={`gap-3 rounded-2xl border-2 px-4 py-4 ${retour.type === "ajoute" ? "border-encre bg-jaune-clair" : "border-ligne bg-white"}`}>
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
