import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { CALENDRIER_PAR_LANGUE } from "@sos-miam/commun/contenus/calendrier";
import { calculerClassement } from "@sos-miam/commun/fonctions/potes/calculer-classement";
import { RondPote } from "~/composants/potes/RondPote";
import { TEXTES_BANDE_ACTIVITE_PAR_LANGUE } from "~/contenus/textes-bande-activite";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { retirerEmoji } from "~/fonctions/texte/retirer-emoji";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import { utiliserVoitEnEntier } from "~/hooks/utiliser-voit-en-entier";

const MEDAILLES = ["🥇", "🥈", "🥉"];

/**
 * Le classement du mois entre toi et ta bande (points du mois, puis rescousses) ; ta ligne est mise en avant. Seulement les potes
 * dont tu vois le profil en entier : les points d'un compte privé ajouté par son pseudo restent cachés, comme sur son profil.
 */
export function ClassementPotes() {
  const router = useRouter();
  const T = utiliserTextes(TEXTES_BANDE_ACTIVITE_PAR_LANGUE).classement;
  const { mois: nomsMois } = utiliserTextes(CALENDRIER_PAR_LANGUE);
  const { potes, moi } = utiliserCommunaute();
  const voitEnEntier = utiliserVoitEnEntier();
  if (!voitEnEntier) return null;
  const classement = calculerClassement([...potes.filter((p) => voitEnEntier(p.id)), moi], moi.id);
  const mois = nomsMois[new Date().getMonth()] ?? "";
  const titre = T.titre(mois);
  const seul = classement.length <= 1;
  const sousTitre = seul ? T.seul : T.sousTitre;

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

      <View className="overflow-hidden rounded-carte border-2 border-encre bg-carte">
        {classement.map(({ personne: pote, rang, estMoi }, i) => {
          const exAequo = classement.some((autre) => autre.rang === rang && autre.personne.id !== pote.id);
          const nom = estMoi ? T.toi : pote.prenom;
          const lu = [exAequo ? T.rangExAequo(rang) : T.rang(rang), nom, T.points(pote.pointsDuMois), T.rescousses(pote.rescoussesDuMois)].join(", ");
          return (
            <Pressable
              key={pote.id}
              accessibilityRole="button"
              accessibilityLabel={lu}
              accessibilityHint={estMoi ? T.indiceMoi : T.indicePote(pote.prenom)}
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
                  🛟 {T.rescousses(pote.rescoussesDuMois)}
                </Text>
              </View>
              <Text className="font-titre-gras text-lg text-encre">
                {pote.pointsDuMois}
                <Text className="font-texte-semi text-sm text-gris">{T.pts}</Text>
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
