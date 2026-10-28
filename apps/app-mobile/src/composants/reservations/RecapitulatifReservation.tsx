import { Text, View } from "react-native";

import { citer } from "@sos-miam/commun/fonctions/langue/citer";
import { remplirModele } from "@sos-miam/commun/fonctions/texte/remplir-modele";
import { TEXTES_RESERVER_TABLE_PAR_LANGUE } from "~/contenus/textes-reserver-table";
import { ecrireNombrePersonnesLangue } from "~/fonctions/langue/ecrire-nombre-personnes-langue";
import { ecrireHeuresSecours } from "~/fonctions/reservations/ecrire-heures-secours";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  nomLieu: string;
  emojiLieu: string;
  quand: string;
  secours: readonly string[];
  personnes: number;
  petitMot: string | null;
  automatique: boolean;
  minutesExpiration: number;
};

export function RecapitulatifReservation({ nomLieu, emojiLieu, quand, secours, personnes, petitMot, automatique, minutesExpiration }: Props) {
  const { langue } = utiliserLangue();
  const T = utiliserTextes(TEXTES_RESERVER_TABLE_PAR_LANGUE);
  const titre = automatique ? T.recapTitreAuto : T.recapTitre;
  const note = automatique ? T.recapNoteAuto : remplirModele(secours.length > 0 ? T.recapNotePlanB : T.recapNote, { minutes: String(minutesExpiration) });
  const lignes = [
    { cle: "lieu", emoji: emojiLieu, texte: nomLieu, discret: false },
    { cle: "quand", emoji: "📅", texte: quand, discret: false },
    ...(secours.length > 0 ? [{ cle: "secours", emoji: "🔁", texte: remplirModele(T.recapSecours, { heures: ecrireHeuresSecours(secours, langue) }), discret: false }] : []),
    { cle: "personnes", emoji: "👥", texte: ecrireNombrePersonnesLangue(personnes, langue), discret: false },
    { cle: "petit-mot", emoji: "💬", texte: petitMot ? citer(petitMot, langue) : T.recapSansPetitMot, discret: !petitMot },
  ];
  const libelle = [titre, ...lignes.map((ligne) => ligne.texte), note].join(". ");

  return (
    <View className="relative">
      <View className="absolute inset-0 translate-x-1.5 translate-y-1.5 rounded-carte bg-jaune" />
      <View accessible accessibilityLabel={libelle} className="gap-3 rounded-carte border-2 border-encre bg-carte p-5">
        <Text className="font-titre-gras text-xl text-encre">{titre}</Text>
        <View className="gap-2.5">
          {lignes.map((ligne) => (
            <View key={ligne.cle} className="flex-row items-start gap-3">
              <Text className="w-6 text-center text-base">{ligne.emoji}</Text>
              <Text className={`flex-1 text-[15px] leading-[22px] ${ligne.discret ? "font-texte text-gris" : "font-texte-semi text-encre"}`}>{lierPonctuation(ligne.texte)}</Text>
            </View>
          ))}
        </View>
        <Text className="border-t border-ligne pt-3 font-texte text-[13px] leading-[18px] text-gris">{lierPonctuation(note)}</Text>
      </View>
    </View>
  );
}
