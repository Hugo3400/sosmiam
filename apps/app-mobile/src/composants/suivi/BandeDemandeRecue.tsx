import { useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";

import type { Pote } from "@sos-miam/commun/types/potes";
import { TEXTES_SUIVI_PAR_LANGUE } from "~/contenus/textes-suivi";
import { deplacerFocusLecteurEcran } from "~/fonctions/interaction/deplacer-focus-lecteur-ecran";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { retirerEmoji } from "~/fonctions/texte/retirer-emoji";
import { utiliserCompteRequis } from "~/hooks/utiliser-compte-requis";
import { utiliserSuivisPersonnes } from "~/hooks/utiliser-suivis-personnes";
import { utiliserTextes } from "~/hooks/utiliser-textes";

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
  const T = utiliserTextes(TEXTES_SUIVI_PAR_LANGUE).demandeRecue;
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
    const texte = issue === "acceptee" ? T.teSuit(pote.prenom) : issue === "refusee" ? T.refusee : T.perimee;
    return (
      <View ref={reponse} accessible accessibilityLabel={retirerEmoji(texte)} className="rounded-carte border-2 border-dashed border-encre/40 bg-carte/70 px-4 py-3">
        <Text className="text-center font-texte-semi text-sm leading-5 text-encre">{lierPonctuation(texte)}</Text>
      </View>
    );
  }

  return (
    <View className="gap-3 rounded-carte border-2 border-encre bg-jaune-clair p-4">
      <View accessible accessibilityLabel={T.veutSuivreLu(pote.prenom)} className="flex-row items-center gap-3">
        <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-2xl">
          📨
        </Text>
        <View className="flex-1">
          <Text className="font-texte-gras text-base text-encre">{T.veutSuivre(pote.prenom)}</Text>
          <Text className="font-texte text-[13px] leading-5 text-gris">{lierPonctuation(T.explication)}</Text>
        </View>
      </View>
      <View className="flex-row flex-wrap gap-3">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={T.accepterLu(pote.prenom)}
          accessibilityHint={T.indiceAccepter(pote.prenom)}
          onPress={() => choisir("accepter")}
          className="min-h-11 min-w-28 flex-1 items-center justify-center rounded-full border-2 border-encre bg-jaune px-4 active:opacity-70"
        >
          <Text className="font-texte-gras text-[15px] text-nuit">{T.accepter}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={T.refuserLu(pote.prenom)}
          accessibilityHint={T.indiceRefuser}
          onPress={() => choisir("refuser")}
          className="min-h-11 min-w-28 flex-1 items-center justify-center rounded-full border-2 border-encre bg-carte px-4 active:opacity-70"
        >
          <Text className="font-texte-gras text-[15px] text-encre">{T.refuser}</Text>
        </Pressable>
      </View>
    </View>
  );
}
