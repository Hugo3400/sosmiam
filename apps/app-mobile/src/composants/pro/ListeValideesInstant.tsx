import { Pressable, Text, View } from "react-native";

import type { ValidationRecente } from "@sos-miam/commun/types/comptoir";
import { EmojiOuMiami } from "~/composants/profil/EmojiOuMiami";
import { EtiquettesReglement } from "~/composants/visites/EtiquettesReglement";
import { TEXTES_DEMANDES_COMPTOIR_PAR_LANGUE } from "~/contenus/textes-demandes-comptoir";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { decrireReglementLangue } from "~/fonctions/langue/decrire-reglement-langue";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  validees: ValidationRecente[];
  maintenant: Date;
  /** Une validation faite par erreur : on l'annule (motif à choisir ensuite), tant que les 15 minutes ne sont pas passées */
  onAnnuler: (visiteId: number) => void;
};

const MINUTE_MS = 60_000;

/** « Validées à l'instant » : les dernières visites validées, qu'on peut encore annuler pendant 15 minutes. */
export function ListeValideesInstant({ validees, maintenant, onAnnuler }: Props) {
  const { langue } = utiliserLangue();
  const T = utiliserTextes(TEXTES_DEMANDES_COMPTOIR_PAR_LANGUE).validees;
  if (validees.length === 0) return null;
  return (
    <View className="gap-3">
      <Text accessibilityRole="header" className="font-titre-gras text-xl text-encre">
        {T.titre}
      </Text>
      {validees.map((v) => {
        const nom = v.initialeNom ? `${v.prenom} ${v.initialeNom}.` : v.prenom;
        const resteMin = Math.max(0, Math.ceil((Date.parse(v.annulableJusqua) - maintenant.getTime()) / MINUTE_MS));
        const reste = resteMin <= 1 ? T.moinsDUneMinute : T.encoreMinutes(resteMin);
        return (
          <View key={v.visiteId} className="min-h-16 flex-row items-center gap-3 rounded-2xl border-2 border-ligne bg-carte px-3.5 py-2.5">
            <View accessible accessibilityLabel={T.lu(nom, T.modesLu[v.mode], decrireReglementLangue(v.reglement, "lieu", langue).titre, reste)} className="flex-1 flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-jaune">
                <EmojiOuMiami valeur={v.avatar} taille={40} className="text-lg" />
              </View>
              <View className="flex-1">
                <Text numberOfLines={1} className="font-texte-gras text-[15px] text-encre">
                  ✓ {nom}
                </Text>
                <Text className="font-texte text-[13px] leading-[18px] text-gris">{T.ligne(T.modes[v.mode], reste)}</Text>
                <View className="mt-1.5">
                  <EtiquettesReglement reglement={v.reglement} pour="lieu" taille="petite" />
                </View>
              </View>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={T.annulerLu(nom)}
              accessibilityHint={T.annulerIndice}
              onPress={() => {
                vibrerLegerement();
                onAnnuler(v.visiteId);
              }}
              className="min-h-11 justify-center rounded-full border-2 border-encre bg-carte px-4 active:opacity-80"
            >
              <Text className="font-texte-gras text-sm text-encre">{T.annuler}</Text>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}
