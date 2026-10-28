import { Pressable, Text, View } from "react-native";

import type { Langue } from "@sos-miam/commun/regles/langues";
import type { Traduction } from "@sos-miam/commun/types/traduction";
import { NumerosUrgence } from "~/composants/miam-safe/NumerosUrgence";
import { TEXTES_MIAM_SAFE_AIDE_PAR_LANGUE, type TEXTES_MIAM_SAFE_AIDE } from "~/contenus/textes-miam-safe-aide";
import { ecrireHeureLangue } from "~/fonctions/langue/ecrire-heure-langue";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import type { AlerteGardeeMiamSafe } from "~/services/memoire-alertes-miam-safe";

export type VueAideMiamSafe = "pote" | "comptoir" | "alerte" | "raconter";

export type CharteLueMiamSafe = "signee" | "pas-signee" | "en-cours" | "inconnue";

type Props = {
  charte: CharteLueMiamSafe;
  alerte?: AlerteGardeeMiamSafe | null;
  aRelire?: boolean;
  onChoisir: (vue: VueAideMiamSafe) => void;
};

type Choix = { vue: VueAideMiamSafe; emoji: string; titre: string; detail: string };

type Textes = Traduction<typeof TEXTES_MIAM_SAFE_AIDE>;

function listerChoix(signee: boolean, T: Textes): Choix[] {
  return [
    { vue: "pote", emoji: "👋", titre: T.choix.pote.titre, detail: T.choix.pote.detail },
    { vue: "comptoir", emoji: "🛎", titre: T.choix.comptoir.titre, detail: signee ? T.choix.comptoir.detailSignee : T.choix.comptoir.detail },
    ...(signee ? [{ vue: "alerte" as const, emoji: "🤫", titre: T.choix.alerte.titre, detail: T.choix.alerte.detail }] : []),
    { vue: "raconter", emoji: "✏️", titre: T.choix.raconter.titre, detail: T.choix.raconter.detail },
  ];
}

function decrireSuivi(alerte: AlerteGardeeMiamSafe, aRelire: boolean, T: Textes, langue: Langue): string {
  if (alerte.statut === "en-route") {
    return lierPonctuation(T.suivi.enRoute(ecrireHeureLangue(new Date(alerte.reponduLe ?? alerte.envoyeeLe), langue)));
  }
  const debut = T.suivi.debut(ecrireHeureLangue(new Date(alerte.envoyeeLe), langue));
  if (aRelire) return lierPonctuation(T.suivi.relecture(debut));
  if (alerte.statut === "sans-reponse") return lierPonctuation(T.suivi.sansReponse(debut));
  if (alerte.telephones === 0) return lierPonctuation(T.suivi.aucunTelephone(debut));
  return lierPonctuation(T.suivi.partie(debut));
}

export function ChoixAideMiamSafe({ charte, alerte = null, aRelire = false, onChoisir }: Props) {
  const T = utiliserTextes(TEXTES_MIAM_SAFE_AIDE_PAR_LANGUE);
  const { langue } = utiliserLangue();
  const signee = charte === "signee";
  const suivi = alerte ? decrireSuivi(alerte, aRelire, T, langue) : null;
  return (
    <View className="gap-4">
      <NumerosUrgence />
      {suivi ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={suivi}
          accessibilityHint={T.suiviIndice}
          onPress={() => onChoisir("alerte")}
          className={`min-h-14 flex-row items-center gap-3 rounded-2xl border-2 border-encre px-4 py-3 active:opacity-80 ${alerte?.statut === "en-route" ? "bg-jaune" : "bg-jaune-clair"}`}
        >
          <Text className="text-lg">🤫</Text>
          <Text className={`shrink grow font-texte-semi text-sm leading-5 ${alerte?.statut === "en-route" ? "text-nuit" : "text-encre"}`}>{suivi}</Text>
          <Text className={`font-texte-gras text-sm ${alerte?.statut === "en-route" ? "text-nuit" : "text-encre"}`}>{T.voir}</Text>
        </Pressable>
      ) : null}
      <View className="gap-2">
        {listerChoix(signee, T).map((c) => (
          <Pressable
            key={c.vue}
            accessibilityRole="button"
            accessibilityLabel={`${c.titre}. ${c.detail}`}
            onPress={() => onChoisir(c.vue)}
            className="min-h-14 flex-row items-center gap-3 rounded-2xl border-2 border-encre bg-carte px-4 py-3 active:opacity-80"
          >
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-jaune-clair">
              <Text className="text-lg">{c.emoji}</Text>
            </View>
            <View className="shrink grow gap-0.5">
              <Text className="font-texte-gras text-base text-encre">{c.titre}</Text>
              <Text className="font-texte text-sm text-gris">{c.detail}</Text>
            </View>
          </Pressable>
        ))}
      </View>
      {signee ? null : (
        <Text accessibilityLiveRegion="polite" className="text-center font-texte text-sm leading-5 text-gris">
          {lierPonctuation(T.charte[charte])}
        </Text>
      )}
      <Text className="text-center font-texte text-sm leading-5 text-gris">{lierPonctuation(T.souciEquipeLieu)}</Text>
    </View>
  );
}
