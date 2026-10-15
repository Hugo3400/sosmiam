import { Text, View } from "react-native";

import { TEXTES_RESERVER_TABLE } from "~/contenus/textes-reserver-table";
import { ecrireNombrePersonnes } from "~/fonctions/reservations/ecrire-nombre-personnes";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  nomLieu: string;
  emojiLieu: string;
  quand: string;
  personnes: number;
  petitMot: string | null;
};

export function RecapitulatifReservation({ nomLieu, emojiLieu, quand, personnes, petitMot }: Props) {
  const lignes = [
    { cle: "lieu", emoji: emojiLieu, texte: nomLieu, discret: false },
    { cle: "quand", emoji: "📅", texte: quand, discret: false },
    { cle: "personnes", emoji: "👥", texte: ecrireNombrePersonnes(personnes), discret: false },
    { cle: "petit-mot", emoji: "💬", texte: petitMot ? `« ${petitMot} »` : TEXTES_RESERVER_TABLE.recapSansPetitMot, discret: !petitMot },
  ];
  const libelle = [TEXTES_RESERVER_TABLE.recapTitre, ...lignes.map((ligne) => ligne.texte), TEXTES_RESERVER_TABLE.recapNote].join(". ");

  return (
    <View className="relative">
      <View className="absolute inset-0 translate-x-1.5 translate-y-1.5 rounded-carte bg-jaune" />
      <View accessible accessibilityLabel={libelle} className="gap-3 rounded-carte border-2 border-encre bg-white p-5">
        <Text className="font-titre-gras text-xl text-encre">{TEXTES_RESERVER_TABLE.recapTitre}</Text>
        <View className="gap-2.5">
          {lignes.map((ligne) => (
            <View key={ligne.cle} className="flex-row items-start gap-3">
              <Text className="w-6 text-center text-base">{ligne.emoji}</Text>
              <Text className={`flex-1 text-[15px] leading-[22px] ${ligne.discret ? "font-texte text-gris" : "font-texte-semi text-encre"}`}>
                {lierPonctuation(ligne.texte)}
              </Text>
            </View>
          ))}
        </View>
        <Text className="border-t border-ligne pt-3 font-texte text-[13px] leading-[18px] text-gris">{lierPonctuation(TEXTES_RESERVER_TABLE.recapNote)}</Text>
      </View>
    </View>
  );
}
