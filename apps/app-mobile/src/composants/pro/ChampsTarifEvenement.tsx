import { Text, View } from "react-native";

import { TARIFS_EVENEMENT_ECRITS } from "@sos-miam/commun/contenus/types-evenement";
import { PLACES_EVENEMENT_MAX, PRIX_EVENEMENT_MAX_CENTIMES, TARIFS_EVENEMENT } from "@sos-miam/commun/regles/evenements";
import { ChampTexte } from "~/composants/interface/ChampTexte";
import { Interrupteur } from "~/composants/interface/Interrupteur";
import { Pastille } from "~/composants/interface/Pastille";
import type { BrouillonEvenement } from "~/fonctions/pro/creer-brouillon-evenement";

type Props = {
  brouillon: BrouillonEvenement;
  onChanger: (partiel: Partial<BrouillonEvenement>) => void;
  erreurs: { prixCentimes?: string; places?: string; alcool?: string };
};

/** Le prix (gratuit, prix indicatif ou sur réservation), les places limitées, et la case alcool (message sanitaire, caché sans compte). */
export function ChampsTarifEvenement({ brouillon: b, onChanger, erreurs }: Props) {
  return (
    <View className="gap-4">
      <View className="gap-2">
        <Text className="font-texte-gras text-base text-encre">Combien ça coûte ?</Text>
        <View accessibilityRole="radiogroup" className="flex-row flex-wrap gap-2">
          {TARIFS_EVENEMENT.map((t, i) => (
            <Pastille key={t} libelle={TARIFS_EVENEMENT_ECRITS[t]} role="radio" choisi={b.tarif === t} onPress={() => onChanger({ tarif: t })} position={i + 1} total={TARIFS_EVENEMENT.length} />
          ))}
        </View>
      </View>
      {b.tarif === "prix" ? (
        <ChampTexte
          libelle="Prix indicatif (€)"
          valeur={b.prix}
          onChangeTexte={(prix) => onChanger({ prix })}
          keyboardType="decimal-pad"
          placeholder="12"
          aide="Le prix pour une personne, à titre indicatif"
          erreur={erreurs.prixCentimes ? `Entre 0,01 et ${PRIX_EVENEMENT_MAX_CENTIMES / 100} €.` : null}
        />
      ) : null}
      <ChampTexte
        libelle="Places limitées"
        mention="facultatif"
        valeur={b.places}
        onChangeTexte={(places) => onChanger({ places: places.replace(/\D/g, "") })}
        keyboardType="number-pad"
        placeholder="Pas de limite"
        erreur={erreurs.places ? `Entre 1 et ${PLACES_EVENEMENT_MAX} places.` : null}
      />
      <Interrupteur
        emoji="🍷"
        titre="Il y a de l'alcool"
        detail="Le message sanitaire s'affiche à côté, et l'événement reste caché en visite sans compte. Jamais d'open bar."
        valeur={b.alcool}
        onChanger={(alcool) => onChanger({ alcool })}
      />
      {erreurs.alcool ? <Text className="font-texte text-sm text-rouge-texte">{erreurs.alcool}</Text> : null}
    </View>
  );
}
