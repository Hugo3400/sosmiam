import { Pressable, Text, View } from "react-native";

import { NumerosUrgence } from "~/composants/miam-safe/NumerosUrgence";
import { ecrireHeure } from "~/fonctions/dates/ecrire-heure";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
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

const SOUCI_EQUIPE = lierPonctuation("Le souci vient de l'équipe du lieu ? Appelle plutôt un proche ou les secours.");

const TEXTES_CHARTE: Record<Exclude<CharteLueMiamSafe, "signee">, string> = {
  "pas-signee": lierPonctuation(
    "Ce lieu n'a pas signé la charte Miam Safe : son équipe ne connaît peut-être pas Miam Safe, et l'alerte silencieuse n'y marche pas. L'écran lui dit quoi faire, en clair.",
  ),
  "en-cours": "On vérifie si ce lieu a signé la charte Miam Safe…",
  inconnue: "On n'a pas pu vérifier si ce lieu a signé la charte Miam Safe.",
};

function listerChoix(signee: boolean): Choix[] {
  return [
    { vue: "pote", emoji: "👋", titre: "Prévenir un pote", detail: "Une notification, et ta position pendant 1 h." },
    { vue: "comptoir", emoji: "🛎", titre: "Demander au comptoir", detail: signee ? "Une phrase à dire, ou un écran à montrer." : "Un écran à montrer à l'équipe." },
    ...(signee ? [{ vue: "alerte" as const, emoji: "🤫", titre: "Alerter le comptoir en silence", detail: "Si tu ne peux pas y aller." }] : []),
    { vue: "raconter", emoji: "✏️", titre: "Raconter ce qui s'est passé", detail: "Reste entre toi et notre équipe." },
  ];
}

function decrireSuivi(alerte: AlerteGardeeMiamSafe, aRelire: boolean): string {
  if (alerte.statut === "en-route") {
    return lierPonctuation(`Ton alerte au comptoir : l'équipe a répondu « On arrive » à ${ecrireHeure(new Date(alerte.reponduLe ?? alerte.envoyeeLe))}.`);
  }
  const debut = `Ton alerte au comptoir de ${ecrireHeure(new Date(alerte.envoyeeLe))}`;
  if (aRelire) return lierPonctuation(`${debut} : on regarde si l'équipe a répondu…`);
  if (alerte.statut === "sans-reponse") return lierPonctuation(`${debut} : l'équipe n'a pas encore répondu.`);
  if (alerte.telephones === 0) return lierPonctuation(`${debut} : aucun téléphone de l'équipe ne l'a reçue.`);
  return lierPonctuation(`${debut} est partie : on attend la réponse de l'équipe.`);
}

export function ChoixAideMiamSafe({ charte, alerte = null, aRelire = false, onChoisir }: Props) {
  const signee = charte === "signee";
  const suivi = alerte ? decrireSuivi(alerte, aRelire) : null;
  return (
    <View className="gap-4">
      <NumerosUrgence />
      {suivi ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={suivi}
          accessibilityHint="Ouvre le suivi de ton alerte"
          onPress={() => onChoisir("alerte")}
          className={`min-h-14 flex-row items-center gap-3 rounded-2xl border-2 border-encre px-4 py-3 active:opacity-80 ${alerte?.statut === "en-route" ? "bg-jaune" : "bg-jaune-clair"}`}
        >
          <Text className="text-lg">🤫</Text>
          <Text className={`shrink grow font-texte-semi text-sm leading-5 ${alerte?.statut === "en-route" ? "text-nuit" : "text-encre"}`}>{suivi}</Text>
          <Text className={`font-texte-gras text-sm ${alerte?.statut === "en-route" ? "text-nuit" : "text-encre"}`}>Voir</Text>
        </Pressable>
      ) : null}
      <View className="gap-2">
        {listerChoix(signee).map((c) => (
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
          {TEXTES_CHARTE[charte]}
        </Text>
      )}
      <Text className="text-center font-texte text-sm leading-5 text-gris">{SOUCI_EQUIPE}</Text>
    </View>
  );
}
