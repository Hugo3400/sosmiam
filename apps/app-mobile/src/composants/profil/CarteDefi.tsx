import { Text, View } from "react-native";

import { Jauge } from "~/composants/interface/Jauge";
import type { DefiAffiche } from "~/contenus/type-defi-affiche";
import { formaterDateLongue } from "~/fonctions/dates/formater-date-longue";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  /** Un défi du serveur, ou un défi d'exemple de la démo (utiliserDefis) */
  defi: DefiAffiche;
};

/** Un défi à 0 point se joue pour la gloire */
const POUR_LA_GLOIRE = "Pour la gloire";

/**
 * Un défi : ce qu'il faut faire, où tu en es, ce qu'il rapporte et jusqu'à quand. En cours : la jauge ; à venir : le jour où
 * il commence ; réussi : en jaune, avec les points gagnés. Lu d'un seul bloc par le lecteur d'écran.
 */
export function CarteDefi({ defi }: Props) {
  const reussi = defi.etat === "reussi";
  // Sans jauge : pas encore commencé, ou défi d'exemple que la démo ne sait pas compter
  const aVenir = !reussi && defi.etat === "a-venir";
  const enAttente = !reussi && !aVenir && defi.attente !== null;
  const fait = reussi ? defi.objectif : Math.min(defi.fait, defi.objectif);
  const debut = formaterDateLongue(defi.debut);
  const fin = defi.fin ? formaterDateLongue(defi.fin) : null;
  // « +1 pt », « +30 pts » ; à 0 point, ni « +0 » ni « gagnés » : juste la gloire
  const un = defi.points === 1;
  const gain = defi.points > 0 ? `+${defi.points} ${un ? "pt" : "pts"}` : POUR_LA_GLOIRE;
  const gainLu =
    defi.points === 0
      ? `${POUR_LA_GLOIRE}, sans points`
      : `${defi.points} ${un ? "point" : "points"} ${reussi ? (un ? "gagné" : "gagnés") : "à gagner"}`;

  const pastille = reussi
    ? defi.points > 0
      ? `${gain} ${un ? "gagné" : "gagnés"}`
      : `${POUR_LA_GLOIRE} 🏆`
    : aVenir
      ? `⏳ Dès le ${debut} · ${gain}`
      : enAttente
        ? `⏳ À venir · ${gain}`
        : `${gain}${fin ? ` · jusqu'au ${fin}` : ""}`;
  const note = aVenir
    ? `Ça commence le ${debut}${fin ? ` et ça dure jusqu'au ${fin}` : ""}. Échauffe tes papilles !`
    : enAttente
      ? defi.attente
      : null;
  const lu = [
    defi.titre,
    defi.texte,
    reussi ? "Défi réussi" : aVenir || enAttente ? "À venir" : `Avancée : ${fait} sur ${defi.objectif}`,
    `${gainLu}${!reussi && fin && !aVenir && !enAttente ? `, jusqu'au ${fin}` : ""}`,
    note,
  ]
    .filter(Boolean)
    .join(". ");

  return (
    <View accessible accessibilityLabel={lu} className={`gap-3 rounded-carte border-2 border-encre p-4 ${reussi ? "bg-jaune-clair" : "bg-white"}`}>
      <View className="flex-row gap-3">
        <Text className="text-3xl">{defi.emoji}</Text>
        <View className="flex-1 gap-0.5">
          <Text className="font-texte-gras text-base text-encre">{defi.titre}</Text>
          <Text className="font-texte text-sm leading-5 text-gris">{lierPonctuation(defi.texte)}</Text>
        </View>
      </View>

      {aVenir || enAttente ? null : (
        <View className="flex-row items-center gap-3">
          <Jauge avancee={fait / defi.objectif} className="flex-1" />
          <Text className="font-texte-gras text-sm text-encre">{reussi ? "Réussi ✅" : `${fait}/${defi.objectif}`}</Text>
        </View>
      )}

      <View className="self-start rounded-full bg-jaune px-3 py-1">
        <Text className="font-texte-semi text-[13px] text-encre">{pastille}</Text>
      </View>
      {note ? <Text className="font-texte text-[13px] leading-5 text-gris">{lierPonctuation(note)}</Text> : null}
    </View>
  );
}
