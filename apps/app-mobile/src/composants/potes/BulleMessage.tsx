import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, Text, View } from "react-native";

import type { MessageSortie, Pote } from "@sos-miam/commun/types/potes";
import { PauseMessageLimite } from "~/composants/chat/PauseMessageLimite";
import { TexteMessageChat } from "~/composants/chat/TexteMessageChat";
import { RondPote } from "~/composants/potes/RondPote";
import { TEXTES_DISCUSSION_SORTIE_PAR_LANGUE } from "~/contenus/textes-discussion-sortie";
import { TEXTES_MESSAGES_PAR_LANGUE } from "~/contenus/textes-messages";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  texte: string;
  /** Qui l'a écrit (null si on ne le connaît plus) */
  auteur: Pote | null;
  deMoi: boolean;
  /** Heure, déjà écrite : « 14h32 » */
  heure: string;
  /** Premier message d'une série du même auteur : son avatar et son prénom au-dessus */
  debutSerie: boolean;
  /** Menu du message (signaler, bloquer), par appui long ou par « ⋯ » ; absent pour tes messages */
  onOptions?: () => void;
  /** Compte connecté : « envoi » (parti, pas encore confirmé), « echec » (pas parti), ou un message qui n'est plus visible */
  etat?: MessageSortie["etat"];
  /** Un de tes messages qui n'est pas parti : le renvoyer */
  onRenvoyer?: () => void;
  /** Pas parti parce que ton compte est limité : ni « Réessaie » ni renvoi, la ligne ouvre le pourquoi */
  enPause?: boolean;
  /** Un de tes messages en pause : le retirer de l'écran */
  onRetirer?: () => void;
  pseudos?: ReadonlySet<string>;
  mentionne?: boolean;
};

const TAILLE_AVATAR = 32;
const ETATS_CACHES = new Set<MessageSortie["etat"]>(["supprime", "masque", "retire", "illisible"]);

/**
 * Un message de la discussion d'une sortie : les tiens à droite en jaune, ceux des potes à gauche avec leur avatar et leur
 * prénom. Compte connecté : « Envoi… » le temps qu'il parte, « Pas parti. Touche pour réessayer. » s'il n'est pas parti.
 */
export function BulleMessage({ texte, auteur, deMoi, heure, debutSerie, onOptions, etat, onRenvoyer, enPause = false, onRetirer, pseudos, mentionne = false }: Props) {
  const couleurs = utiliserCouleurs();
  const T = utiliserTextes(TEXTES_DISCUSSION_SORTIE_PAR_LANGUE).bulle;
  const TM = utiliserTextes(TEXTES_MESSAGES_PAR_LANGUE);
  // Supprimé, masqué, retiré par la modération ou illisible : le texte dit ce qu'il en est, en discret
  const cache = ETATS_CACHES.has(etat);
  const texteBulle = cache ? (
    <Text className="font-texte text-sm italic text-gris">{lierPonctuation(texte)}</Text>
  ) : (
    <TexteMessageChat texte={texte} pseudos={pseudos} deMoi={deMoi && etat !== "echec"} />
  );

  if (deMoi) {
    const echec = etat === "echec";
    return (
      <View className={`max-w-[85%] items-end self-end ${debutSerie ? "mt-3" : "mt-1"}`}>
        <View accessible accessibilityLabel={`${T.toiLu(heure, texte)}${etat === "envoi" ? T.enCoursLu : ""}`} className="items-end">
          <View
            className={`rounded-2xl rounded-br-md border-2 px-3.5 py-2.5 ${
              cache ? "border-dashed border-gris/50 bg-carte/60" : echec ? "border-rouge-texte bg-jaune-clair" : `border-encre bg-jaune ${etat === "envoi" ? "opacity-70" : ""}`
            }`}
          >
            {texteBulle}
          </View>
          {etat === "envoi" || echec ? null : <Text className="mt-0.5 font-texte text-[11px] text-gris">{heure}</Text>}
          {etat === "envoi" ? (
            <Text accessibilityLiveRegion="polite" className="mt-0.5 font-texte text-[11px] text-gris">
              {T.envoi}
            </Text>
          ) : null}
        </View>
        {echec && enPause ? (
          <PauseMessageLimite onRetirer={onRetirer} />
        ) : echec ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={T.pasParti}
            onPress={() => {
              vibrerLegerement();
              onRenvoyer?.();
            }}
            hitSlop={{ top: 4, bottom: 4 }}
            className="mt-0.5 min-h-8 flex-row items-center gap-1 active:opacity-70"
          >
            <Ionicons name="refresh" size={14} color={couleurs["rouge-texte"]} />
            <Text className="font-texte-semi text-[12px] text-rouge-texte">{lierPonctuation(T.pasParti)}</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  const prenom = auteur?.prenom ?? T.quelquUn;
  return (
    <View className={`max-w-[92%] flex-row items-start gap-1.5 self-start ${debutSerie ? "mt-3" : "mt-1"}`}>
      <View style={{ width: TAILLE_AVATAR }} className={debutSerie ? "pt-5" : ""}>
        {debutSerie && auteur ? <RondPote pote={auteur} taille={TAILLE_AVATAR} /> : null}
      </View>
      <Pressable
        accessible
        accessibilityLabel={T.messageLu(`${prenom}, ${heure}${mentionne ? `, ${TM.mentionne}` : ""}`, texte)}
        onLongPress={
          onOptions
            ? () => {
                vibrerLegerement();
                onOptions();
              }
            : undefined
        }
        delayLongPress={350}
        className="shrink active:opacity-80"
      >
        {debutSerie ? (
          <Text numberOfLines={1} className="mb-0.5 ml-1 font-texte-semi text-[13px] text-gris">
            {prenom}
          </Text>
        ) : null}
        <View className={`rounded-2xl rounded-tl-md border-2 px-3.5 py-2.5 ${cache ? "border-dashed border-gris/50 bg-carte/60" : "border-encre bg-carte"}`}>{texteBulle}</View>
        <Text className={`ml-1 mt-0.5 font-texte text-[11px] ${mentionne ? "font-texte-semi text-encre" : "text-gris"}`}>
          {mentionne ? `${heure} · ${TM.mentionne}` : heure}
        </Text>
      </Pressable>
      {onOptions ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={T.optionsLu(prenom)}
          accessibilityHint={T.indiceOptions}
          hitSlop={{ left: 4, right: 4 }}
          onPress={() => {
            vibrerLegerement();
            onOptions();
          }}
          className={`h-11 w-9 items-center justify-center active:opacity-60 ${debutSerie ? "mt-5" : ""}`}
        >
          <Ionicons name="ellipsis-horizontal" size={18} color={couleurs.gris} />
        </Pressable>
      ) : null}
    </View>
  );
}
