import { useEffect, useRef } from "react";
import { Pressable, Text, View } from "react-native";

import type { Pote } from "@sos-miam/commun/types/potes";
import { RondPote } from "~/composants/potes/RondPote";
import { BoutonSuivreProfil } from "~/composants/suivi/BoutonSuivreProfil";
import { deplacerFocusLecteurEcran } from "~/fonctions/interaction/deplacer-focus-lecteur-ecran";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";

type Props = {
  pote: Pote;
  /** Demande acceptée à l'instant : la ligne reste, « … te suit maintenant », avec « Suivre » pour lui rendre la pareille */
  acceptee: boolean;
  /** Dernière ligne de la carte : pas de trait dessous */
  derniere: boolean;
  onAccepter: () => void;
  onRefuser: () => void;
  /** Pour le bouton Suivre de la ligne acceptée (« 🔔 Tu suis maintenant … ! ») */
  onAnnoncer: (texte: string) => void;
};

const TAILLE_ROND = 44;
// Le temps que la ligne se redessine avant d'y poser VoiceOver
const DELAI_FOCUS = 250;

/**
 * Une demande d'abonnement : l'avatar, le prénom et le @pseudo, et deux boutons, « Accepter » et « Refuser ». Une fois
 * acceptée, la ligne devient « Jade te suit maintenant » et VoiceOver s'y pose : juste après vient le bouton « Suivre ».
 */
export function LigneDemandeSuivi({ pote, acceptee, derniere, onAccepter, onRefuser, onAnnoncer }: Props) {
  const etat = useRef<View>(null);
  // Un seul geste par demande : un double toucher n'accepte pas puis refuse
  const traitee = useRef(false);
  const accepteeAuDepart = useRef(acceptee);

  useEffect(() => {
    if (!acceptee || accepteeAuDepart.current) return;
    const minuterie = setTimeout(() => deplacerFocusLecteurEcran(etat.current), DELAI_FOCUS);
    return () => clearTimeout(minuterie);
  }, [acceptee]);

  function choisir(action: () => void) {
    if (traitee.current) return;
    traitee.current = true;
    vibrerLegerement();
    action();
  }

  return (
    <View className={`flex-row items-center gap-3 px-3 py-3 ${derniere ? "" : "border-b border-ligne"}`}>
      <RondPote pote={pote} taille={TAILLE_ROND} />
      {acceptee ? (
        <>
          <View ref={etat} accessible accessibilityLabel={`${pote.prenom} te suit maintenant`} className="flex-1">
            <Text className="font-texte-gras text-[15px] leading-5 text-encre">{pote.prenom} te suit maintenant</Text>
            <Text numberOfLines={1} className="font-texte text-[13px] text-gris">
              @{pote.pseudo}
            </Text>
          </View>
          <BoutonSuivreProfil cle={`personne:${pote.id}`} nom={pote.prenom} emoji={pote.avatar} onAnnoncer={onAnnoncer} taille="compact" />
        </>
      ) : (
        <View className="flex-1 gap-2">
          <View accessible accessibilityLabel={`${pote.prenom}, ${pote.pseudo}, veut te suivre`}>
            <Text className="font-texte-gras text-[15px] leading-5 text-encre">{pote.prenom}</Text>
            <Text numberOfLines={1} className="font-texte text-[13px] text-gris">
              @{pote.pseudo} · veut te suivre
            </Text>
          </View>
          <View className="flex-row flex-wrap gap-2">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Accepter la demande de ${pote.prenom}`}
              accessibilityHint="Ça ne te fait pas suivre en retour : tu choisiras juste après"
              hitSlop={6}
              onPress={() => choisir(onAccepter)}
              className="h-9 min-w-24 flex-row items-center justify-center rounded-full border-2 border-encre bg-jaune px-4 active:opacity-70"
            >
              <Text className="font-texte-gras text-[13px] text-encre">Accepter</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Refuser la demande de ${pote.prenom}`}
              accessibilityHint="En toute discrétion : personne n'est prévenu"
              hitSlop={6}
              onPress={() => choisir(onRefuser)}
              className="h-9 min-w-24 flex-row items-center justify-center rounded-full border-2 border-encre bg-white px-4 active:opacity-70"
            >
              <Text className="font-texte-gras text-[13px] text-encre">Refuser</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}
