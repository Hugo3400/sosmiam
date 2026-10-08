import { Text, View } from "react-native";

import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { formaterCodeLu } from "~/fonctions/visites/formater-code-lu";

type Props = {
  /** Le code à montrer (4 chiffres pour une addition) */
  code: string;
  /** Comme le voit l'équipe du lieu : « Léa M. » */
  prenom: string;
  /** L'emoji de l'avatar (jamais une photo : le lieu ne voit que l'emoji) */
  avatar: string;
  /** Ce qu'on en fait : « Montre ce code au moment de payer » */
  legende: string;
  /** « grand » sur l'écran d'une visite ; « moyen » dans une carte ou une liste */
  taille?: "grand" | "moyen";
};

const TAILLES = {
  grand: { case: 76, police: 52, interligne: 62, avatar: "h-10 w-10", emoji: "text-xl", prenom: "text-lg" },
  moyen: { case: 54, police: 34, interligne: 42, avatar: "h-8 w-8", emoji: "text-base", prenom: "text-base" },
} as const;

/**
 * Le code de rapprochement, façon ticket : chaque chiffre dans sa case jaune, très grand, avec l'emoji et le prénom que voit
 * l'équipe à côté du même code. VoiceOver lit tout d'un bloc, le code chiffre par chiffre (« 4, 8, 2, 1 »).
 */
export function CodeRapprochement({ code, prenom, avatar, legende, taille = "grand" }: Props) {
  const t = TAILLES[taille];
  const chiffres = Array.from(code);
  return (
    <View className="relative self-stretch">
      <View className="absolute inset-0 translate-x-1.5 translate-y-1.5 rounded-carte bg-encre" />
      <View
        accessible
        accessibilityLabel={`${legende}. Code ${formaterCodeLu(code)}. Au nom de ${prenom}.`}
        className={`items-center rounded-carte border-2 border-encre bg-white ${taille === "grand" ? "px-4 py-5" : "px-3 py-4"}`}
      >
        <Text className="text-center font-texte-semi text-sm text-gris">{lierPonctuation(legende)}</Text>
        <View className="mt-3 flex-row justify-center gap-2 self-stretch">
          {chiffres.map((chiffre, i) => (
            <View
              key={`${i}-${chiffre}`}
              style={{ maxWidth: t.case, aspectRatio: 0.8 }}
              className="flex-1 items-center justify-center rounded-2xl border-2 border-encre bg-jaune"
            >
              {/* Déjà énormes : ils grossissent un peu avec la taille du texte, sans jamais sortir de leur case */}
              <Text maxFontSizeMultiplier={1.2} style={{ fontSize: t.police, lineHeight: t.interligne }} className="font-titre text-encre">
                {chiffre}
              </Text>
            </View>
          ))}
        </View>
        <View className="mt-4 flex-row items-center gap-2">
          <View className={`${t.avatar} items-center justify-center rounded-full border-2 border-encre bg-jaune-clair`}>
            <Text className={t.emoji}>{avatar}</Text>
          </View>
          <Text className={`font-texte-gras ${t.prenom} text-encre`}>{prenom}</Text>
        </View>
      </View>
    </View>
  );
}
