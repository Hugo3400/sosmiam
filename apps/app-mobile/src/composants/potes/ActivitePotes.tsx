import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import type { Lieu } from "@sos-miam/commun/types/lieu";
import type { ActivitePote, Pote } from "@sos-miam/commun/types/potes";
import { VignetteLieu } from "~/composants/explorer/VignetteLieu";
import { RondPote } from "~/composants/potes/RondPote";
import { publicationsExemples } from "~/contenus/publications-exemples";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { trouverVignetteLieu } from "~/fonctions/publications/trouver-vignette-lieu";
import { utiliserActivite } from "~/hooks/utiliser-activite";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";

type Props = {
  /** Lieux que tu peux voir (sans les bars sous 18 ans), par identifiant */
  lieux: ReadonlyMap<number, Lieu>;
};

type Ligne = { activite: ActivitePote; pote: Pote; lieu: Lieu | null };

const NOMBRE_VISIBLE = 5;
const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

/** « à l'instant », « il y a 5 min », « il y a 3 h », « hier », « il y a 4 jours », « le 12 septembre » */
const formaterIlYa = (iso: string, maintenant: number) => {
  const date = new Date(iso);
  const minutes = Math.max(0, Math.floor((maintenant - date.getTime()) / 60_000));
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const heures = Math.floor(minutes / 60);
  if (heures < 24) return `il y a ${heures} h`;
  const jours = Math.floor(heures / 24);
  if (jours === 1) return "hier";
  if (jours < 7) return `il y a ${jours} jours`;
  return `le ${date.getDate() === 1 ? "1er" : date.getDate()} ${MOIS[date.getMonth()]}`;
};

/** Ce qu'a fait le pote, en morceaux (le gras pour ce qui compte), et l'emoji posé sur son avatar */
const decrire = ({ type, detail }: ActivitePote, lieu: Lieu | null): { emoji: string; morceaux: { texte: string; gras?: boolean }[] } => {
  const nomLieu = { texte: lieu?.nom ?? "un lieu", gras: true };
  const entreGuillemets = { texte: `« ${detail ?? ""} »`, gras: true };
  switch (type) {
    case "rescousse":
      return { emoji: "🛟", morceaux: [{ texte: " a sauvé " }, nomLieu] };
    case "garde":
      return { emoji: "🔖", morceaux: [{ texte: " a gardé " }, nomLieu, { texte: " pour plus tard" }] };
    case "badge":
      return { emoji: "🏅", morceaux: [{ texte: " a décroché le badge " }, entreGuillemets] };
    case "palier":
      return { emoji: "🎖️", morceaux: [{ texte: " a atteint le palier " }, { texte: detail ?? "suivant", gras: true }] };
    case "liste":
      return { emoji: "📋", morceaux: [{ texte: " a créé la liste " }, entreGuillemets] };
    case "sortie":
      return { emoji: "🎉", morceaux: detail ? [{ texte: " organise " }, entreGuillemets] : [{ texte: " organise une sortie" }] };
  }
};

/** Ce que fait ta bande : rescousses, adresses gardées, badges, listes. Toucher un lieu ouvre sa fiche, sinon le profil du pote. */
export function ActivitePotes({ lieux }: Props) {
  const router = useRouter();
  const { activites, trouverPote } = utiliserCommunaute();
  const { estMasquee } = utiliserActivite();
  const [tout, setTout] = useState(false);
  const maintenant = Date.now();
  const publications = publicationsExemples.filter((p) => !estMasquee(p.id));

  // Seulement ce que tu peux voir : pas de bar sous 18 ans, pas de lieu disparu
  const lignes = activites.flatMap((activite): Ligne[] => {
    const pote = trouverPote(activite.pote);
    const lieu = activite.lieuId !== undefined ? (lieux.get(activite.lieuId) ?? null) : null;
    if (!pote || (activite.lieuId !== undefined && !lieu)) return [];
    if ((activite.type === "rescousse" || activite.type === "garde") && !lieu) return [];
    return [{ activite, pote, lieu }];
  });
  const affichees = tout ? lignes : lignes.slice(0, NOMBRE_VISIBLE);

  return (
    <View className="gap-3">
      <View>
        <Text accessibilityRole="header" className="font-titre-gras text-xl text-encre">
          Quoi de neuf dans ta bande
        </Text>
        <Text className="font-texte text-sm text-gris">Les dernières bonnes actions de tes potes.</Text>
      </View>

      {lignes.length === 0 ? (
        <View className="items-center gap-2 rounded-carte border-2 border-dashed border-ligne px-6 py-6">
          <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-3xl">
            🦗
          </Text>
          <Text className="text-center font-texte text-base leading-6 text-gris">
            Calme plat pour l'instant. Montre l'exemple : une rescousse, et ta bande suivra.
          </Text>
        </View>
      ) : (
        <View className="overflow-hidden rounded-carte border-2 border-encre bg-white">
          {affichees.map(({ activite, pote, lieu }, i) => {
            const { emoji, morceaux } = decrire(activite, lieu);
            const quand = formaterIlYa(activite.date, maintenant);
            return (
              <Pressable
                key={activite.id}
                accessibilityRole="button"
                accessibilityLabel={`${pote.prenom}${morceaux.map((m) => m.texte).join("")}, ${quand}`}
                accessibilityHint={lieu ? "Ouvre la fiche du lieu" : `Ouvre le profil de ${pote.prenom}`}
                onPress={() => {
                  vibrerLegerement();
                  if (lieu) router.push({ pathname: "/lieu/[id]", params: { id: String(lieu.id) } });
                  else router.push({ pathname: "/potes/profil/[id]", params: { id: pote.id } });
                }}
                className={`min-h-16 flex-row items-center gap-3 px-4 py-3 active:opacity-70 ${i > 0 ? "border-t border-ligne" : ""}`}
              >
                <View>
                  <RondPote pote={pote} taille={40} />
                  <View className="absolute -bottom-1 -right-1 h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-creme">
                    <Text allowFontScaling={false} className="text-[11px]">
                      {emoji}
                    </Text>
                  </View>
                </View>
                <View className="flex-1 gap-0.5">
                  <Text className="font-texte text-[15px] leading-5 text-encre">
                    <Text className="font-texte-gras">{pote.prenom}</Text>
                    {morceaux.map((m, j) => (
                      <Text key={j} className={m.gras ? "font-texte-gras" : undefined}>
                        {m.texte}
                      </Text>
                    ))}
                  </Text>
                  <Text className="font-texte text-[13px] text-gris">{quand}</Text>
                </View>
                {lieu ? <VignetteLieu lieu={lieu} image={trouverVignetteLieu(lieu.id, publications)} hauteur={44} arrondi={10} /> : null}
              </Pressable>
            );
          })}
        </View>
      )}

      {lignes.length > NOMBRE_VISIBLE ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            vibrerLegerement();
            setTout(!tout);
          }}
          className="min-h-11 items-center justify-center self-center px-4 active:opacity-70"
        >
          <Text className="font-texte-gras text-[15px] text-encre underline">{tout ? "Voir moins" : "Voir plus"}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
