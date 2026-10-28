import { Text, View } from "react-native";

import { TARIFS_EVENEMENT_ECRITS_PAR_LANGUE } from "@sos-miam/commun/contenus/types-evenement";
import { PLACES_EVENEMENT_MAX, PRIX_EVENEMENT_MAX_CENTIMES, TARIFS_EVENEMENT } from "@sos-miam/commun/regles/evenements";
import { ChampTexte } from "~/composants/interface/ChampTexte";
import { Interrupteur } from "~/composants/interface/Interrupteur";
import { Pastille } from "~/composants/interface/Pastille";
import { TEXTES_CHAMPS_EVENEMENT_PAR_LANGUE } from "~/contenus/textes-champs-evenement";
import type { BrouillonEvenement } from "~/fonctions/pro/creer-brouillon-evenement";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  brouillon: BrouillonEvenement;
  onChanger: (partiel: Partial<BrouillonEvenement>) => void;
  erreurs: { prixCentimes?: string; places?: string; alcool?: string };
};

/** Le prix (gratuit, prix indicatif ou sur réservation), les places limitées, et la case alcool (message sanitaire, caché sans compte). */
export function ChampsTarifEvenement({ brouillon: b, onChanger, erreurs }: Props) {
  const T = utiliserTextes(TEXTES_CHAMPS_EVENEMENT_PAR_LANGUE).tarif;
  const tarifs = utiliserTextes(TARIFS_EVENEMENT_ECRITS_PAR_LANGUE);
  return (
    <View className="gap-4">
      <View className="gap-2">
        <Text className="font-texte-gras text-base text-encre">{T.combien}</Text>
        <View accessibilityRole="radiogroup" className="flex-row flex-wrap gap-2">
          {TARIFS_EVENEMENT.map((t, i) => (
            <Pastille key={t} libelle={tarifs[t]} role="radio" choisi={b.tarif === t} onPress={() => onChanger({ tarif: t })} position={i + 1} total={TARIFS_EVENEMENT.length} />
          ))}
        </View>
      </View>
      {b.tarif === "prix" ? (
        <ChampTexte
          libelle={T.prix}
          valeur={b.prix}
          onChangeTexte={(prix) => onChanger({ prix })}
          keyboardType="decimal-pad"
          placeholder="12"
          aide={T.prixAide}
          erreur={erreurs.prixCentimes ? T.erreurPrix(PRIX_EVENEMENT_MAX_CENTIMES / 100) : null}
        />
      ) : null}
      <ChampTexte
        libelle={T.places}
        mention={T.facultatif}
        valeur={b.places}
        onChangeTexte={(places) => onChanger({ places: places.replace(/\D/g, "") })}
        keyboardType="number-pad"
        placeholder={T.sansLimite}
        erreur={erreurs.places ? T.erreurPlaces(PLACES_EVENEMENT_MAX) : null}
      />
      <Interrupteur
        emoji="🍷"
        titre={T.alcool}
        detail={T.alcoolDetail}
        valeur={b.alcool}
        onChanger={(alcool) => onChanger({ alcool })}
      />
      {erreurs.alcool ? <Text className="font-texte text-sm text-rouge-texte">{erreurs.alcool}</Text> : null}
    </View>
  );
}
