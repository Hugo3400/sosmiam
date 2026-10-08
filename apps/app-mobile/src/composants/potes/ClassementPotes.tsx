import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { RondPote } from "~/composants/potes/RondPote";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { retirerEmoji } from "~/fonctions/texte/retirer-emoji";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";

const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const MEDAILLES = ["🥇", "🥈", "🥉"];

/** « 1er », « 2e », « 3e » */
const ordinal = (rang: number) => (rang === 1 ? "1er" : `${rang}e`);

/** Le classement du mois entre toi et ta bande (points du mois, puis rescousses) ; ta ligne est mise en avant. */
export function ClassementPotes() {
  const router = useRouter();
  const { classement } = utiliserCommunaute();
  const mois = MOIS[new Date().getMonth()];
  // « d'octobre », « de mars »
  const titre = `Classement ${/^[aeiouyéè]/.test(mois) ? "d'" : "de "}${mois}`;
  const seul = classement.length <= 1;
  const sousTitre = seul ? "Ajoute des potes : c'est plus drôle avec quelqu'un à dépasser 😏" : "Les points gagnés ce mois-ci, entre toi et ta bande.";

  return (
    <View className="gap-3">
      <View>
        <Text accessibilityRole="header" className="font-titre-gras text-xl text-encre">
          {titre}
        </Text>
        <Text accessibilityLabel={retirerEmoji(sousTitre)} className="font-texte text-sm text-gris">
          {lierPonctuation(sousTitre)}
        </Text>
      </View>

      <View className="overflow-hidden rounded-carte border-2 border-encre bg-white">
        {classement.map(({ pote, rang, estMoi }, i) => {
          const exAequo = classement.some((autre) => autre.rang === rang && autre.pote.id !== pote.id);
          const nom = estMoi ? "Toi" : pote.prenom;
          const lu = [
            `${ordinal(rang)}${exAequo ? " ex æquo" : ""}`,
            nom,
            `${pote.pointsDuMois} point${pote.pointsDuMois > 1 ? "s" : ""} ce mois-ci`,
            `${pote.rescoussesDuMois} rescousse${pote.rescoussesDuMois > 1 ? "s" : ""}`,
          ].join(", ");
          return (
            <Pressable
              key={pote.id}
              accessibilityRole="button"
              accessibilityLabel={lu}
              accessibilityHint={estMoi ? "Ouvre ton profil de pote" : `Ouvre le profil de ${pote.prenom}`}
              onPress={() => {
                vibrerLegerement();
                router.push({ pathname: "/potes/profil/[id]", params: { id: pote.id } });
              }}
              className={`min-h-14 flex-row items-center gap-3 px-4 py-2.5 active:opacity-70 ${i > 0 ? "border-t border-ligne" : ""} ${estMoi ? "bg-jaune-clair" : ""}`}
            >
              <View className="w-8 items-center">
                {rang <= MEDAILLES.length ? (
                  <Text allowFontScaling={false} className="text-2xl">
                    {MEDAILLES[rang - 1]}
                  </Text>
                ) : (
                  <Text className="font-titre-gras text-lg text-gris">{rang}</Text>
                )}
              </View>
              <RondPote pote={pote} taille={36} />
              <View className="flex-1">
                <Text numberOfLines={1} className={`text-base text-encre ${estMoi ? "font-texte-gras" : "font-texte-semi"}`}>
                  {nom}
                </Text>
                <Text numberOfLines={1} className="font-texte text-[13px] text-gris">
                  🛟 {pote.rescoussesDuMois} rescousse{pote.rescoussesDuMois > 1 ? "s" : ""}
                </Text>
              </View>
              <Text className="font-titre-gras text-lg text-encre">
                {pote.pointsDuMois}
                <Text className="font-texte-semi text-sm text-gris">{"\u00a0pts"}</Text>
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
