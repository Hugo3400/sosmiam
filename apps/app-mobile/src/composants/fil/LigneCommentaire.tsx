import { Ionicons } from "@expo/vector-icons";
import { useRef } from "react";
import { Pressable, Text, View } from "react-native";

import { ID_MOI } from "@sos-miam/commun/regles/potes";
import type { Commentaire } from "@sos-miam/commun/types/commentaires";
import type { Lieu } from "@sos-miam/commun/types/lieu";
import { RondPote } from "~/composants/potes/RondPote";
import { TexteAvecMentions } from "~/composants/fil/TexteAvecMentions";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { formaterNombreCourt } from "~/fonctions/texte/formater-nombre-court";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import couleurs from "~/theme/couleurs";

type Props = {
  commentaire: Commentaire;
  /** Lieu de la publication : c'est lui qui parle quand l'auteur est « lieu » */
  lieu: Pick<Lieu, "nom" | "emoji">;
  /** Réponse sous un commentaire : un peu en retrait, avatar plus petit */
  reponse: boolean;
  /** Heure de référence pour « il y a 5 min » (rafraîchie par la feuille) */
  maintenant: number;
  onRepondre: (commentaire: Commentaire) => void;
  /** J'aime (ou le retirer) ; sans compte, la feuille propose d'en créer un */
  onAimer: (commentaire: Commentaire) => void;
  /** Modifier, supprimer, signaler, bloquer ; « declencheur » est ce qui a ouvert le menu, où le lecteur d'écran revient ensuite */
  onOptions: (commentaire: Commentaire, declencheur: View | null) => void;
};

const MOIS_COURTS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];

// « il y a 5 min » à l'écran, « il y a 5 minutes » pour VoiceOver
function formaterIlYa(dateIso: string, maintenant: number, long: boolean): string {
  const minutes = Math.floor((maintenant - Date.parse(dateIso)) / 60_000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} ${long ? (minutes > 1 ? "minutes" : "minute") : "min"}`;
  const heures = Math.floor(minutes / 60);
  if (heures < 24) return `il y a ${heures} ${long ? (heures > 1 ? "heures" : "heure") : "h"}`;
  const jours = Math.floor(heures / 24);
  if (jours === 1) return "hier";
  if (jours < 7) return `il y a ${jours} ${long ? "jours" : "j"}`;
  if (jours < 28) return `il y a ${Math.floor(jours / 7)} ${long ? (jours >= 14 ? "semaines" : "semaine") : "sem."}`;
  const date = new Date(dateIso);
  return `le ${date.getDate()} ${MOIS_COURTS[date.getMonth()]}`;
}

/** Un commentaire sous une publication : avatar, prénom et @pseudo (ou le lieu, avec son badge), texte, date, « Répondre » et J'aime. */
export function LigneCommentaire({ commentaire, lieu, reponse, maintenant, onRepondre, onAimer, onOptions }: Props) {
  const { trouverPote } = utiliserCommunaute();
  const estLieu = commentaire.auteur === "lieu";
  const pote = estLieu ? null : trouverPote(commentaire.auteur);
  const estMoi = commentaire.auteur === ID_MOI;
  const nom = estLieu ? lieu.nom : (pote?.prenom ?? "Quelqu'un");
  const pseudo = pote?.pseudo ? `@${pote.pseudo}` : null;
  const aime = commentaire.jaimes.includes(ID_MOI);
  const nombreJaimes = commentaire.jaimes.length;
  const modifie = !!commentaire.modifieLe;
  const masque = !!commentaire.masqueParLieu && estMoi;
  const taille = reponse ? 30 : 40;
  const zoneTexte = useRef<View>(null);
  const boutonOptions = useRef<View>(null);

  const description = [
    estLieu ? `${nom}, le lieu` : `${nom}${estMoi ? ", toi" : ""}${pseudo ? `, ${pseudo}` : ""}`,
    commentaire.texte,
    `${formaterIlYa(commentaire.date, maintenant, true)}${modifie ? ", modifié" : ""}`,
    masque ? "Masqué par le lieu : toi seul le vois, le temps que l'équipe le relise" : null,
  ].filter(Boolean).join(". ");

  return (
    <View className={`flex-row gap-3 ${reponse ? "ml-[52px] py-1.5" : "py-2"} ${estLieu && !reponse ? "-mx-2 rounded-carte bg-jaune-clair px-2" : ""}`}>
      {pote ? (
        // Masqué par le lieu : seul l'avatar s'estompe, le texte reste bien lisible
        <View className={masque ? "opacity-50" : ""}>
          <RondPote pote={pote} taille={taille} />
        </View>
      ) : (
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={{ width: taille, height: taille, borderRadius: taille / 2 }}
          className={`items-center justify-center border-2 border-encre ${estLieu ? "bg-jaune" : "bg-white"}`}
        >
          <Text allowFontScaling={false} style={{ fontSize: taille * 0.5, lineHeight: taille * 0.64 }}>
            {estLieu ? lieu.emoji : "🙂"}
          </Text>
        </View>
      )}

      <View className="flex-1">
        {/* Appui long : les options, comme le bouton « ⋯ » plus bas (VoiceOver passe par ce bouton) */}
        <Pressable
          ref={zoneTexte}
          accessible
          accessibilityLabel={description}
          onLongPress={() => {
            vibrerLegerement();
            onOptions(commentaire, zoneTexte.current);
          }}
          delayLongPress={350}
          // Masqué par le lieu : un cadre en pointillés plutôt qu'un texte pâli (il doit rester lisible)
          className={masque ? "rounded-xl border-2 border-dashed border-gris/60 px-2 py-1.5" : ""}
        >
          <View className="flex-row flex-wrap items-center gap-x-1.5 gap-y-0.5">
            <Text numberOfLines={1} className="font-texte-gras text-sm text-encre">
              {nom}
            </Text>
            {estLieu ? (
              <Text className="overflow-hidden rounded-full border border-encre bg-jaune px-2 py-0.5 font-texte-gras text-[11px] text-encre">Le lieu</Text>
            ) : null}
            {pseudo ? (
              <Text numberOfLines={1} className="shrink font-texte text-[13px] text-gris">
                {pseudo}
              </Text>
            ) : null}
          </View>
          <TexteAvecMentions texte={commentaire.texte} className="mt-0.5" />
          {masque ? <Text className="mt-1 font-texte-semi text-xs leading-4 text-gris">🙈 Masqué par le lieu : toi seul le vois, le temps que l'équipe le relise.</Text> : null}
        </Pressable>

        <View className="flex-row items-center">
          <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="font-texte text-[13px] text-gris">
            {formaterIlYa(commentaire.date, maintenant, false)}
            {modifie ? " · (modifié)" : ""}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Répondre à ${nom}`}
            onPress={() => onRepondre(commentaire)}
            className="ml-2 min-h-11 justify-center px-2 active:opacity-60"
          >
            <Text className="font-texte-semi text-[13px] text-gris">Répondre</Text>
          </Pressable>
          <Pressable
            ref={boutonOptions}
            accessibilityRole="button"
            accessibilityLabel={estMoi ? "Options de ton commentaire : modifier, supprimer" : `Options du commentaire de ${nom} : signaler${estLieu ? "" : ", bloquer"}`}
            onPress={() => onOptions(commentaire, boutonOptions.current)}
            className="min-h-11 min-w-11 items-center justify-center active:opacity-60"
          >
            <Ionicons name="ellipsis-horizontal" size={16} color={couleurs.gris} />
          </Pressable>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={aime ? `Retirer ton J'aime, ${nombreJaimes} J'aime` : `J'aime ce commentaire${nombreJaimes > 0 ? `, ${nombreJaimes} J'aime` : ""}`}
        accessibilityState={{ selected: aime }}
        onPress={() => {
          vibrerLegerement();
          onAimer(commentaire);
        }}
        className="min-h-11 min-w-11 items-center pt-1 active:scale-90"
      >
        <Ionicons name={aime ? "heart" : "heart-outline"} size={reponse ? 18 : 20} color={aime ? couleurs.tomate : couleurs.gris} />
        {nombreJaimes > 0 ? <Text className={`font-texte-semi text-xs ${aime ? "text-rouge-texte" : "text-gris"}`}>{formaterNombreCourt(nombreJaimes)}</Text> : null}
      </Pressable>
    </View>
  );
}
