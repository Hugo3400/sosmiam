import { useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";

import type { Pote } from "@sos-miam/commun/types/potes";
import { deplacerFocusLecteurEcran } from "~/fonctions/interaction/deplacer-focus-lecteur-ecran";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { eliderDe } from "~/fonctions/texte/elider-de";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { retirerEmoji } from "~/fonctions/texte/retirer-emoji";
import { utiliserCompteRequis } from "~/hooks/utiliser-compte-requis";
import { utiliserSuivisPersonnes } from "~/hooks/utiliser-suivis-personnes";

type Props = {
  /** La personne dont on regarde le profil */
  pote: Pote;
};

/** Ce qu'est devenue la demande touchée pendant la visite du profil (la bande reste, avec la réponse, jusqu'au départ) */
type Issue = "acceptee" | "refusee" | "perimee";

// Le temps que la bande se redessine avant d'y poser VoiceOver
const DELAI_FOCUS = 250;

/**
 * « Jade veut te suivre », en haut des actions de son profil, avec « Accepter » et « Refuser » : on voit qui demande avant de
 * répondre (la même demande que dans Notifications). Une fois la réponse donnée, la bande garde sa place et la dit, et VoiceOver
 * s'y pose (sinon il se perdrait avec les boutons disparus). Rien si elle ne t'a rien demandé. Répondre demande un compte.
 */
export function BandeDemandeRecue({ pote }: Props) {
  const suivis = utiliserSuivisPersonnes();
  const exiger = utiliserCompteRequis();
  const [issue, setIssue] = useState<Issue | null>(null);
  const reponse = useRef<View>(null);
  // Un seul geste par demande : un double toucher n'accepte pas puis refuse
  const traitee = useRef(false);
  const demandeRecue = suivis.relationAvec(pote.id)?.demandeRecue === true;

  useEffect(() => {
    if (!issue) return;
    const minuterie = setTimeout(() => deplacerFocusLecteurEcran(reponse.current), DELAI_FOCUS);
    return () => clearTimeout(minuterie);
  }, [issue]);

  if (!issue && !demandeRecue) return null;

  function choisir(action: "accepter" | "refuser") {
    if (traitee.current) return;
    vibrerLegerement();
    if (!exiger("suivre")) return;
    traitee.current = true;
    if (action === "refuser") {
      suivis.refuserDemande(pote.id);
      setIssue("refusee");
    } else setIssue(suivis.accepterDemande(pote.id) ? "acceptee" : "perimee");
  }

  if (issue) {
    const texte =
      issue === "acceptee"
        ? `${pote.prenom} te suit maintenant 👋`
        : issue === "refusee"
          ? "Demande refusée, en toute discrétion 🤫"
          : "Cette demande n'est plus valable.";
    return (
      <View ref={reponse} accessible accessibilityLabel={retirerEmoji(texte)} className="rounded-carte border-2 border-dashed border-encre/40 bg-white/70 px-4 py-3">
        <Text className="text-center font-texte-semi text-sm leading-5 text-encre">{lierPonctuation(texte)}</Text>
      </View>
    );
  }

  return (
    <View className="gap-3 rounded-carte border-2 border-encre bg-jaune-clair p-4">
      <View accessible accessibilityLabel={`${pote.prenom} veut te suivre. Accepter ne te fait pas suivre en retour.`} className="flex-row items-center gap-3">
        <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-2xl">
          📨
        </Text>
        <View className="flex-1">
          <Text className="font-texte-gras text-base text-encre">{`${pote.prenom} veut te suivre`}</Text>
          <Text className="font-texte text-[13px] leading-5 text-gris">{lierPonctuation("Accepter ne te fait pas suivre en retour : tu choisiras juste après.")}</Text>
        </View>
      </View>
      <View className="flex-row flex-wrap gap-3">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Accepter la demande ${eliderDe(pote.prenom)}`}
          accessibilityHint={`${pote.prenom} verra ton profil en entier`}
          onPress={() => choisir("accepter")}
          className="min-h-11 min-w-28 flex-1 items-center justify-center rounded-full border-2 border-encre bg-jaune px-4 active:opacity-70"
        >
          <Text className="font-texte-gras text-[15px] text-encre">Accepter</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Refuser la demande ${eliderDe(pote.prenom)}`}
          accessibilityHint="En toute discrétion : personne n'est prévenu"
          onPress={() => choisir("refuser")}
          className="min-h-11 min-w-28 flex-1 items-center justify-center rounded-full border-2 border-encre bg-white px-4 active:opacity-70"
        >
          <Text className="font-texte-gras text-[15px] text-encre">Refuser</Text>
        </Pressable>
      </View>
    </View>
  );
}
