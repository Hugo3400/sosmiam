import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { Pressable, Text, View } from "react-native";

import type { Pote } from "@sos-miam/commun/types/potes";
import { RondPote } from "~/composants/potes/RondPote";
import { BoutonSuivreProfil } from "~/composants/suivi/BoutonSuivreProfil";
import { deplacerFocusLecteurEcran } from "~/fonctions/interaction/deplacer-focus-lecteur-ecran";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { eliderDe } from "~/fonctions/texte/elider-de";

/** En attente ; acceptée à l'instant (« … te suit maintenant », avec « Suivre » pour lui rendre la pareille) ; refusée à l'instant */
export type IssueDemande = "attente" | "acceptee" | "refusee";

type Props = {
  pote: Pote;
  /** Une demande acceptée ou refusée pendant la visite garde sa ligne (la réponse à la place des boutons) : rien ne saute sous le doigt */
  issue: IssueDemande;
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
 * Une demande d'abonnement : l'avatar, le prénom et le @pseudo (touchés, ils ouvrent son profil : on voit qui demande avant de
 * répondre), et deux boutons, « Accepter » et « Refuser ». Une fois acceptée, la ligne devient « Jade te suit maintenant » et
 * VoiceOver s'y pose : juste après vient le bouton « Suivre ». Refusée, elle le dit à la place des boutons, et VoiceOver s'y pose aussi.
 */
export function LigneDemandeSuivi({ pote, issue, derniere, onAccepter, onRefuser, onAnnoncer }: Props) {
  const router = useRouter();
  const etat = useRef<View>(null);
  // Un seul geste par demande : un double toucher n'accepte pas puis refuse
  const traitee = useRef(false);
  const issueAuDepart = useRef(issue);

  useEffect(() => {
    if (issue === "attente") {
      // De nouveau en attente (la personne a redemandé) : les boutons reviennent
      traitee.current = false;
      return;
    }
    if (issue === issueAuDepart.current) return;
    const minuterie = setTimeout(() => deplacerFocusLecteurEcran(etat.current), DELAI_FOCUS);
    return () => clearTimeout(minuterie);
  }, [issue]);

  const ouvrirProfil = () => {
    vibrerLegerement();
    router.push({ pathname: "/potes/profil/[id]", params: { id: pote.id } });
  };

  function choisir(action: () => void) {
    if (traitee.current) return;
    traitee.current = true;
    vibrerLegerement();
    action();
  }

  return (
    <View className={`flex-row items-center gap-3 px-3 py-3 ${derniere ? "" : "border-b border-ligne"}`}>
      {/* Même geste que le prénom, à côté : VoiceOver, lui, ne s'arrête que sur le prénom */}
      <Pressable accessible={false} importantForAccessibility="no-hide-descendants" onPress={ouvrirProfil} className="active:opacity-70">
        <RondPote pote={pote} taille={TAILLE_ROND} />
      </Pressable>
      {issue === "acceptee" ? (
        <>
          <Pressable
            ref={etat}
            accessibilityRole="button"
            accessibilityLabel={`${pote.prenom} te suit maintenant`}
            accessibilityHint="Ouvre son profil"
            onPress={ouvrirProfil}
            className="flex-1 active:opacity-70"
          >
            <Text className="font-texte-gras text-[15px] leading-5 text-encre">{pote.prenom} te suit maintenant</Text>
            <Text numberOfLines={1} className="font-texte text-[13px] text-gris">
              @{pote.pseudo}
            </Text>
          </Pressable>
          <BoutonSuivreProfil cle={`personne:${pote.id}`} nom={pote.prenom} emoji={pote.avatar} onAnnoncer={onAnnoncer} taille="compact" />
        </>
      ) : issue === "refusee" ? (
        <Pressable
          ref={etat}
          accessibilityRole="button"
          accessibilityLabel={`Demande ${eliderDe(pote.prenom)} refusée, en toute discrétion`}
          accessibilityHint="Ouvre son profil"
          onPress={ouvrirProfil}
          className="flex-1 active:opacity-70"
        >
          <Text className="font-texte-gras text-[15px] leading-5 text-encre">{pote.prenom}</Text>
          <Text className="font-texte text-[13px] leading-5 text-gris">Demande refusée, en toute discrétion 🤫</Text>
        </Pressable>
      ) : (
        <View className="flex-1 gap-2">
          <Pressable
            ref={etat}
            accessibilityRole="button"
            accessibilityLabel={`${pote.prenom}, ${pote.pseudo}, veut te suivre`}
            accessibilityHint="Ouvre son profil"
            onPress={ouvrirProfil}
            className="active:opacity-70"
          >
            <Text className="font-texte-gras text-[15px] leading-5 text-encre">{pote.prenom}</Text>
            <Text numberOfLines={1} className="font-texte text-[13px] text-gris">
              @{pote.pseudo} · veut te suivre
            </Text>
          </Pressable>
          <View className="flex-row flex-wrap gap-2">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Accepter la demande ${eliderDe(pote.prenom)}`}
              accessibilityHint="Ça ne te fait pas suivre en retour : tu choisiras juste après"
              hitSlop={6}
              onPress={() => choisir(onAccepter)}
              className="h-9 min-w-24 flex-row items-center justify-center rounded-full border-2 border-encre bg-jaune px-4 active:opacity-70"
            >
              <Text className="font-texte-gras text-[13px] text-encre">Accepter</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Refuser la demande ${eliderDe(pote.prenom)}`}
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
