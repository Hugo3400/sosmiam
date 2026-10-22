import { Pressable, Text, View } from "react-native";

import { remplirModele } from "@sos-miam/commun/fonctions/texte/remplir-modele";
import { HORAIRES_PROPOSES_MAX } from "@sos-miam/commun/regles/reglages-reservations";
import { Bouton } from "~/composants/interface/Bouton";
import { Pastille } from "~/composants/interface/Pastille";
import { EnTeteGroupeCreneaux } from "~/composants/reservations/EnTeteGroupeCreneaux";
import { TEXTES_PLAN_B as T } from "~/contenus/textes-reserver-table";
import { formaterHeure } from "~/fonctions/dates/formater-heure";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import type { GroupeCreneauxReservation } from "~/fonctions/reservations/ranger-creneaux-par-service";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  groupes: readonly GroupeCreneauxReservation[];
  principal: string;
  secours: readonly string[];
  automatique: boolean;
  ouvert: boolean;
  onOuvrir: () => void;
  onBasculer: (heure: string) => void;
  onFermer: () => void;
};

export function ChoixHorairesSecours({ groupes, principal, secours, automatique, ouvert, onOuvrir, onBasculer, onFermer }: Props) {
  const autres = groupes.map((g) => ({ ...g, creneaux: g.creneaux.filter((c) => c.heure !== principal) })).filter((g) => g.creneaux.length > 0);
  if (autres.length === 0) return ouvert ? <Text className="font-texte text-sm leading-5 text-gris">{lierPonctuation(T.vide)}</Text> : null;
  if (!ouvert) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${T.ouvrir}, ${T.mention}`}
        accessibilityHint={T.ouvrirIndice}
        onPress={() => {
          vibrerLegerement();
          onOuvrir();
        }}
        className="min-h-12 flex-row items-center gap-2 self-start rounded-full border-2 border-dashed border-encre bg-carte px-4 active:opacity-80"
      >
        <Text className="font-texte-gras text-[15px] text-encre">{T.ouvrir}</Text>
        <Text className="font-texte text-[13px] text-gris">{`· ${T.mention}`}</Text>
      </Pressable>
    );
  }
  const plein = secours.length >= HORAIRES_PROPOSES_MAX - 1;
  return (
    <View className="gap-3 rounded-carte border-2 border-encre bg-carte p-4">
      <Text accessibilityRole="header" className="font-titre-gras text-lg text-encre">
        {T.titre}
      </Text>
      <Text className="font-texte text-sm leading-5 text-gris">{lierPonctuation(remplirModele(automatique ? T.texteAuto : T.texte, { heure: formaterHeure(principal) }))}</Text>
      {autres.map((groupe) => (
        <View key={groupe.cle} className="gap-2">
          <EnTeteGroupeCreneaux nom={groupe.nom} plage={groupe.plage} />
          <View className="flex-row flex-wrap gap-2">
            {groupe.creneaux.map((creneau) => {
              const rang = secours.indexOf(creneau.heure) + 1;
              const heure = formaterHeure(creneau.heure);
              return (
                <Pastille
                  key={creneau.heure}
                  libelle={rang > 0 ? `${rang} · ${heure}` : heure}
                  libelleLu={rang > 0 ? remplirModele(T.lu, { heure, rang: String(rang) }) : heure}
                  choisi={rang > 0}
                  desactive={plein && rang === 0}
                  indice={rang > 0 ? T.indiceRetirer : T.indiceAjouter}
                  onPress={() => onBasculer(creneau.heure)}
                />
              );
            })}
          </View>
        </View>
      ))}
      {plein ? <Text className="font-texte text-[13px] leading-[18px] text-gris">{lierPonctuation(T.max)}</Text> : null}
      <Bouton libelle={T.fermer} variante="blanc" petit className="self-start" indice={T.indiceFermer} onPress={onFermer} />
    </View>
  );
}
