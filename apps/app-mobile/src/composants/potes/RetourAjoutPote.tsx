import { useRouter } from "expo-router";
import { useEffect } from "react";
import { AccessibilityInfo, Text, View } from "react-native";

import type { Pote } from "@sos-miam/commun/types/potes";
import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { ResultatAjoutBande } from "~/hooks/utiliser-communaute";
import { Bouton } from "~/composants/interface/Bouton";
import { RondPote } from "~/composants/potes/RondPote";
import { CARTE_REFUS_LIMITATION_PAR_LANGUE, REFUS_LIMITATION_PAR_LANGUE } from "~/contenus/limitation-compte";
import { TEXTES_AJOUT_POTE_PAR_LANGUE, type TEXTES_AJOUT_POTE } from "~/contenus/textes-ajout-pote";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";

/** Ce qui s'est passé après un scan ou un texte collé (lien d'invitation, ou pseudo seul) */
export type RetourAjout = ResultatAjoutBande | { type: "pas-invitation" };

type Props = {
  retour: RetourAjout;
};

type TextesRetour = Traduction<typeof TEXTES_AJOUT_POTE>["retour"];

const decrire = (retour: RetourAjout, T: TextesRetour, limitation: { emoji: string; titre: string; detail: string }): { emoji: string; titre: string; detail: string } => {
  switch (retour.type) {
    case "ajoute":
      return { emoji: "🎉", titre: T.ajoute.titre(retour.pote.prenom), detail: T.ajoute.detail };
    case "deja":
      return { emoji: "😄", titre: T.deja.titre(retour.pote.prenom), detail: T.deja.detail };
    case "demande":
      return retour.pote
        ? { emoji: "📨", titre: T.demande.titre(retour.pote.prenom), detail: T.demande.detail }
        : { emoji: "📨", titre: T.demandeSansPote.titre, detail: T.demandeSansPote.detail };
    case "bloque":
      return { emoji: "🚫", titre: T.bloque.titre(retour.pote.prenom), detail: T.bloque.detail };
    case "introuvable":
      return { emoji: "🔍", titre: T.introuvable.titre(retour.pseudo), detail: T.introuvable.detail };
    case "demandes-fermees":
      return {
        emoji: "🔒",
        titre: retour.pote ? T.demandesFermees.titre(retour.pote.prenom) : T.demandesFermees.titreSansPote,
        detail: T.demandesFermees.detail,
      };
    case "lien-change":
      return { emoji: "🔄", titre: T.lienChange.titre, detail: T.lienChange.detail };
    case "invitation-invalide":
      return { emoji: "🔗", titre: T.invitationInvalide.titre, detail: T.invitationInvalide.detail };
    case "erreur":
      // Compte limité : pas une panne, rien à réessayer (l'annonce de toute l'app dit où lire le pourquoi)
      if (retour.erreur === "compte-limite") return limitation;
      return { emoji: "😕", titre: T.erreur.titre, detail: T.erreur.detail };
    case "pas-invitation":
      return { emoji: "🤔", titre: T.pasInvitation.titre, detail: T.pasInvitation.detail };
    case "toi":
      return { emoji: "🪞", titre: T.toi.titre, detail: T.toi.detail };
  }
};

// Les emoji restent à l'écran mais ne sont pas lus (VoiceOver dirait leur nom)
const EMOJI = /[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu;

/** La réponse après un scan ou un texte collé : ajouté, déjà là, bloqué, introuvable… annoncée au lecteur d'écran, avec « Voir son profil » quand on connaît la personne. */
export function RetourAjoutPote({ retour }: Props) {
  const router = useRouter();
  const T = utiliserTextes(TEXTES_AJOUT_POTE_PAR_LANGUE).retour;
  const CARTE_REFUS = utiliserTextes(CARTE_REFUS_LIMITATION_PAR_LANGUE);
  const REFUS = utiliserTextes(REFUS_LIMITATION_PAR_LANGUE);
  const { emoji, titre, detail } = decrire(retour, T, { emoji: CARTE_REFUS.emoji, titre: CARTE_REFUS.titreAjout, detail: REFUS.bande });
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
          libelle={T.voirProfil}
          variante="blanc"
          petit
          indice={T.voirProfilIndice(pote.prenom)}
          onPress={() => router.push({ pathname: "/potes/profil/[id]", params: { id: pote.id } })}
        />
      ) : null}
    </View>
  );
}
