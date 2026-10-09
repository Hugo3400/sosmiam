import { Pressable, Text, View } from "react-native";

import { decrireReglement } from "@sos-miam/commun/fonctions/visites/decrire-reglement";
import type { ValidationRecente } from "@sos-miam/commun/types/comptoir";
import { EtiquettesReglement } from "~/composants/visites/EtiquettesReglement";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";

type Props = {
  validees: ValidationRecente[];
  maintenant: Date;
  /** Une validation faite par erreur : on l'annule (motif à choisir ensuite), tant que les 15 minutes ne sont pas passées */
  onAnnuler: (visiteId: number) => void;
};

const MODES = { addition: "addition", comptoir: "QR du comptoir", reservation: "réservation" } as const;
const MINUTE_MS = 60_000;

/** « Validées à l'instant » : les dernières visites validées, qu'on peut encore annuler pendant 15 minutes. */
export function ListeValideesInstant({ validees, maintenant, onAnnuler }: Props) {
  if (validees.length === 0) return null;
  return (
    <View className="gap-3">
      <Text accessibilityRole="header" className="font-titre-gras text-xl text-encre">
        Validées à l'instant
      </Text>
      {validees.map((v) => {
        const nom = v.initialeNom ? `${v.prenom} ${v.initialeNom}.` : v.prenom;
        const resteMin = Math.max(0, Math.ceil((Date.parse(v.annulableJusqua) - maintenant.getTime()) / MINUTE_MS));
        const reste = resteMin <= 1 ? "encore moins d'une minute" : `encore ${resteMin} min`;
        return (
          <View key={v.visiteId} className="min-h-16 flex-row items-center gap-3 rounded-2xl border-2 border-ligne bg-white px-3.5 py-2.5">
            <View accessible accessibilityLabel={`${nom}, validé par ${MODES[v.mode]}. ${decrireReglement(v.reglement, "lieu").titre}. Annulable ${reste}.`} className="flex-1 flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-jaune">
                <Text className="text-lg">{v.avatar}</Text>
              </View>
              <View className="flex-1">
                <Text numberOfLines={1} className="font-texte-gras text-[15px] text-encre">
                  ✓ {nom}
                </Text>
                <Text className="font-texte text-[13px] leading-[18px] text-gris">
                  {MODES[v.mode]} · annulable {reste}
                </Text>
                <View className="mt-1.5">
                  <EtiquettesReglement reglement={v.reglement} pour="lieu" taille="petite" />
                </View>
              </View>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Annuler la validation de ${nom}`}
              accessibilityHint="Par erreur ? Les points et le tampon repartent"
              onPress={() => {
                vibrerLegerement();
                onAnnuler(v.visiteId);
              }}
              className="min-h-11 justify-center rounded-full border-2 border-encre bg-white px-4 active:opacity-80"
            >
              <Text className="font-texte-gras text-sm text-encre">Annuler</Text>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}
