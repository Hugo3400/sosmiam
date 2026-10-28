import { Text, View } from "react-native";

import { Jauge } from "~/composants/interface/Jauge";
import { TEXTES_CARTE_DEFI_PAR_LANGUE } from "~/contenus/textes-profil-defis";
import type { DefiAffiche } from "~/contenus/type-defi-affiche";
import { ecrireDateLongueLangue } from "~/fonctions/langue/ecrire-date-longue-langue";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  /** Un défi du serveur (utiliserDefis) */
  defi: DefiAffiche;
};

/**
 * Un défi : ce qu'il faut faire, où tu en es, ce qu'il rapporte et jusqu'à quand. En cours : la jauge ; à venir : le jour où
 * il commence ; réussi : en jaune, avec les points gagnés. Lu d'un seul bloc par le lecteur d'écran.
 */
export function CarteDefi({ defi }: Props) {
  const T = utiliserTextes(TEXTES_CARTE_DEFI_PAR_LANGUE);
  const { langue } = utiliserLangue();
  const reussi = defi.etat === "reussi";
  // Sans jauge : pas encore commencé
  const aVenir = !reussi && defi.etat === "a-venir";
  const enAttente = !reussi && !aVenir && defi.attente !== null;
  const fait = reussi ? defi.objectif : Math.min(defi.fait, defi.objectif);
  const debut = ecrireDateLongueLangue(defi.debut, langue);
  const fin = defi.fin ? ecrireDateLongueLangue(defi.fin, langue) : null;
  // « +1 pt », « +30 pts » ; à 0 point, ni « +0 » ni « gagnés » : juste la gloire
  const gain = defi.points > 0 ? T.gain(defi.points) : T.pourLaGloire;
  const gainLu = defi.points === 0 ? T.gainLuSansPoints : reussi ? T.pointsGagnes(defi.points) : T.pointsAGagner(defi.points);

  const pastille = reussi
    ? defi.points > 0
      ? T.pastilleGagnes(defi.points, gain)
      : T.pastilleGloire
    : aVenir
      ? T.pastilleDes(debut, gain)
      : enAttente
        ? T.pastilleAVenir(gain)
        : T.pastilleJusquau(gain, fin);
  const note = aVenir ? T.noteAVenir(debut, fin) : enAttente ? defi.attente : null;
  const lu = [
    defi.titre,
    defi.texte,
    reussi ? T.reussiLu : aVenir || enAttente ? T.aVenirLu : T.avanceeLu(fait, defi.objectif),
    `${gainLu}${!reussi && fin && !aVenir && !enAttente ? T.jusquauLu(fin) : ""}`,
    note,
  ]
    .filter(Boolean)
    .join(". ");

  return (
    <View accessible accessibilityLabel={lu} className={`gap-3 rounded-carte border-2 border-encre p-4 ${reussi ? "bg-jaune-clair" : "bg-carte"}`}>
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
          <Text className="font-texte-gras text-sm text-encre">{reussi ? T.reussi : `${fait}/${defi.objectif}`}</Text>
        </View>
      )}

      <View className="self-start rounded-full bg-jaune px-3 py-1">
        <Text className="font-texte-semi text-[13px] text-nuit">{pastille}</Text>
      </View>
      {note ? <Text className="font-texte text-[13px] leading-5 text-gris">{lierPonctuation(note)}</Text> : null}
    </View>
  );
}
