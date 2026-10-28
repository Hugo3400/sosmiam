import { Text, View } from "react-native";

import { HORIZON_EVENEMENT_MS } from "@sos-miam/commun/regles/evenements";
import { Interrupteur } from "~/composants/interface/Interrupteur";
import { Pastille } from "~/composants/interface/Pastille";
import { ChoixQuandSortie } from "~/composants/potes/ChoixQuandSortie";
import { TEXTES_CHAMPS_EVENEMENT_PAR_LANGUE } from "~/contenus/textes-champs-evenement";
import { ecrireHeureLangue } from "~/fonctions/langue/ecrire-heure-langue";
import { ecrireJourLongLangue } from "~/fonctions/langue/ecrire-jour-long-langue";
import type { BrouillonEvenement } from "~/fonctions/pro/creer-brouillon-evenement";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  brouillon: BrouillonEvenement;
  onChanger: (partiel: Partial<BrouillonEvenement>) => void;
  erreurs: { debut?: string; fin?: string; hebdoJusqua?: string };
};

const DUREES: (number | null)[] = [null, 1, 2, 3, 4, 6];
const SEMAINES = [3, 5, 8, 12];
const SEMAINE_MS = 7 * 24 * 60 * 60_000;

/** Quand : le jour et l'heure, la durée (ou pas d'heure de fin), et « chaque semaine » pendant quelques semaines (3 mois au plus). */
export function ChampsQuandEvenement({ brouillon: b, onChanger, erreurs }: Props) {
  const { langue } = utiliserLangue();
  const T = utiliserTextes(TEXTES_CHAMPS_EVENEMENT_PAR_LANGUE).quand;
  const limite = Date.now() + HORIZON_EVENEMENT_MS;
  const semainesPossibles = SEMAINES.filter((n) => b.debut.getTime() + n * SEMAINE_MS <= limite);
  return (
    <View className="gap-4">
      <ChoixQuandSortie quand={b.debut} onChanger={(debut) => onChanger({ debut })} jour={ecrireJourLongLangue(b.debut, langue)} heure={ecrireHeureLangue(b.debut, langue)} erreur={erreurs.debut ?? null} />
      <View className="gap-2">
        <Text className="font-texte-gras text-base text-encre">{T.combienDeTemps}</Text>
        <View accessibilityRole="radiogroup" className="flex-row flex-wrap gap-2">
          {DUREES.map((d, i) => (
            <Pastille key={String(d)} libelle={d === null ? T.sansFin : T.duree(d)} role="radio" choisi={b.dureeHeures === d} onPress={() => onChanger({ dureeHeures: d })} position={i + 1} total={DUREES.length} />
          ))}
        </View>
        {erreurs.fin ? <Text className="font-texte text-sm text-rouge-texte">{erreurs.fin}</Text> : null}
      </View>
      <Interrupteur
        emoji="🔁"
        titre={T.chaqueSemaine}
        detail={T.chaqueSemaineDetail}
        valeur={b.semaines !== null}
        onChanger={(oui) => onChanger({ semaines: oui ? (semainesPossibles[0] ?? null) : null })}
        desactive={semainesPossibles.length === 0}
      />
      {b.semaines !== null ? (
        <View accessibilityRole="radiogroup" className="flex-row flex-wrap gap-2">
          {semainesPossibles.map((n, i) => (
            <Pastille key={n} libelle={T.pendantSemaines(n)} role="radio" choisi={b.semaines === n} onPress={() => onChanger({ semaines: n })} position={i + 1} total={semainesPossibles.length} />
          ))}
        </View>
      ) : null}
      {erreurs.hebdoJusqua ? <Text className="font-texte text-sm text-rouge-texte">{erreurs.hebdoJusqua}</Text> : null}
    </View>
  );
}
