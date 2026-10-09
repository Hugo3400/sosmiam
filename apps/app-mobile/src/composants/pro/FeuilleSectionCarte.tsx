import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { LIMITES_CARTE } from "@sos-miam/commun/regles/carte-du-lieu";
import { contientMotInterdit } from "@sos-miam/commun/validation/contient-mot-interdit";
import { Bouton } from "~/composants/interface/Bouton";
import { ChampTexte } from "~/composants/interface/ChampTexte";
import { FeuilleBas } from "~/composants/interface/FeuilleBas";
import { Pastille } from "~/composants/interface/Pastille";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

const IDEES_CARTE = ["Pour commencer", "Plats", "Desserts", "À boire", "Vins", "Cocktails", "Formules", "Menu enfant"];
const IDEES_FORMULES = ["Formules", "Tarifs", "Anniversaires", "À boire", "À grignoter"];

type Props = {
  visible: boolean;
  /** Le titre de la section à renommer, ou null pour en créer une */
  titre: string | null;
  /** Ce qu'elle contient : la retirer les retire aussi */
  nombreElements: number;
  /** Titres déjà pris, que les idées ne proposent plus */
  titresPris: readonly string[];
  formules: boolean;
  onGarder: (titre: string) => void;
  /** Absent pour une nouvelle section */
  onRetirer?: () => void;
  onFermer: () => void;
};

/**
 * Feuille « section » du mode pro : son titre, avec des idées toutes prêtes (Plats, Desserts, À boire…), et de quoi la
 * retirer. Si elle n'est pas vide, on redemande avant : ses éléments partent avec elle.
 */
export function FeuilleSectionCarte({ visible, titre, nombreElements, titresPris, formules, onGarder, onRetirer, onFermer }: Props) {
  const [texte, setTexte] = useState(titre ?? "");
  const [erreur, setErreur] = useState(false);
  const [confirmerRetrait, setConfirmerRetrait] = useState(false);
  const [ouvert, setOuvert] = useState(visible);
  if (visible !== ouvert) {
    setOuvert(visible);
    if (visible) {
      setTexte(titre ?? "");
      setErreur(false);
      setConfirmerRetrait(false);
    }
  }

  const idees = (formules ? IDEES_FORMULES : IDEES_CARTE).filter((idee) => !titresPris.includes(idee));

  function garder() {
    // Les mêmes règles que le service (validerCarteDuLieu)
    const propre = texte.trim();
    if (!propre || propre.length > LIMITES_CARTE.titreSection || contientMotInterdit(propre)) return setErreur(true);
    onGarder(propre);
  }

  function retirer() {
    if (nombreElements > 0 && !confirmerRetrait) return setConfirmerRetrait(true);
    onRetirer?.();
  }

  return (
    <FeuilleBas
      visible={visible}
      titre={titre ? "Ta section" : "Une nouvelle section"}
      sousTitre={titre ? undefined : "Range ta carte comme sur papier : les entrées, les plats, les boissons…"}
      onFermer={onFermer}
      pied={
        <>
          <Bouton libelle={titre ? "Garder ce titre" : "Ajouter la section"} onPress={garder} />
          <Bouton libelle="Annuler" variante="blanc" onPress={onFermer} />
        </>
      }
    >
      <ChampTexte
        libelle="Titre de la section"
        valeur={texte}
        onChangeTexte={(t) => {
          setTexte(t);
          setErreur(false);
        }}
        placeholder={formules ? "Formules" : "Desserts"}
        maxLength={LIMITES_CARTE.titreSection}
        erreur={erreur ? `Donne-lui un titre court, sans gros mot (${LIMITES_CARTE.titreSection} caractères au plus).` : null}
      />
      {idees.length > 0 ? (
        <View className="gap-2">
          <Text className="font-texte-semi text-sm text-gris">Des idées</Text>
          <View className="flex-row flex-wrap gap-2">
            {idees.map((idee, i) => (
              <Pastille key={idee} libelle={idee} role="radio" position={i + 1} total={idees.length} choisi={texte.trim() === idee} onPress={() => setTexte(idee)} />
            ))}
          </View>
        </View>
      ) : null}

      {onRetirer ? (
        confirmerRetrait ? (
          <View className="gap-3 rounded-2xl border-2 border-tomate bg-rose-alerte p-4">
            <Text className="font-texte-semi text-sm leading-5 text-encre">
              {lierPonctuation(`${nombreElements > 1 ? `Ses ${nombreElements} éléments partiront` : "Son élément partira"} avec elle. Tu pourras encore tout annuler tant que la carte n'est pas enregistrée.`)}
            </Text>
            <Bouton libelle="Retirer la section" variante="encre" petit onPress={retirer} />
          </View>
        ) : (
          <Pressable accessibilityRole="button" onPress={retirer} className="min-h-11 items-center justify-center active:opacity-70">
            <Text className="font-texte-gras text-base text-rouge-texte">Retirer cette section</Text>
          </Pressable>
        )
      ) : null}
    </FeuilleBas>
  );
}
