import { useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { LIMITES_CARTE } from "@sos-miam/commun/regles/carte-du-lieu";
import { contientMotInterdit } from "@sos-miam/commun/validation/contient-mot-interdit";
import { Bouton } from "~/composants/interface/Bouton";
import { ChampTexte } from "~/composants/interface/ChampTexte";
import { FeuilleBas } from "~/composants/interface/FeuilleBas";
import { Pastille } from "~/composants/interface/Pastille";
import { TEXTES_EDITION_CARTE_PAR_LANGUE } from "~/contenus/textes-edition-carte";
import { deplacerFocusLecteurEcran } from "~/fonctions/interaction/deplacer-focus-lecteur-ecran";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";

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
  const T = utiliserTextes(TEXTES_EDITION_CARTE_PAR_LANGUE).section;
  const [texte, setTexte] = useState(titre ?? "");
  const [erreur, setErreur] = useState(false);
  const [confirmerRetrait, setConfirmerRetrait] = useState(false);
  const refConfirmation = useRef<Text>(null);
  const [ouvert, setOuvert] = useState(visible);
  if (visible !== ouvert) {
    setOuvert(visible);
    if (visible) {
      setTexte(titre ?? "");
      setErreur(false);
      setConfirmerRetrait(false);
    }
  }

  // Le bouton touché laisse place à l'encadré : le lecteur d'écran va le lire
  useEffect(() => {
    if (!confirmerRetrait) return;
    const minuterie = setTimeout(() => deplacerFocusLecteurEcran(refConfirmation.current), 150);
    return () => clearTimeout(minuterie);
  }, [confirmerRetrait]);

  const idees = (formules ? T.ideesFormules : T.ideesCarte).filter((idee) => !titresPris.includes(idee));

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
      titre={titre ? T.titreModifier : T.titreNouvelle}
      sousTitre={titre ? undefined : T.sousTitre}
      onFermer={onFermer}
      pied={
        <>
          <Bouton libelle={titre ? T.garder : T.ajouter} onPress={garder} />
          <Bouton libelle={T.annuler} variante="blanc" onPress={onFermer} />
        </>
      }
    >
      <ChampTexte
        libelle={T.titre}
        valeur={texte}
        onChangeTexte={(t) => {
          setTexte(t);
          setErreur(false);
        }}
        placeholder={formules ? T.titreExempleFormules : T.titreExempleCarte}
        maxLength={LIMITES_CARTE.titreSection}
        erreur={erreur ? T.erreurTitre(LIMITES_CARTE.titreSection) : null}
      />
      {idees.length > 0 ? (
        <View className="gap-2">
          <Text className="font-texte-semi text-sm text-gris">{T.idees}</Text>
          <View className="flex-row flex-wrap gap-2">
            {idees.map((idee, i) => (
              <Pastille
                key={idee}
                libelle={idee}
                role="radio"
                position={i + 1}
                total={idees.length}
                choisi={texte.trim() === idee}
                onPress={() => {
                  setTexte(idee);
                  setErreur(false);
                }}
              />
            ))}
          </View>
        </View>
      ) : null}

      {onRetirer ? (
        confirmerRetrait ? (
          <View className="gap-3 rounded-2xl border-2 border-tomate bg-rose-alerte p-4">
            <Text ref={refConfirmation} className="font-texte-semi text-sm leading-5 text-encre">
              {lierPonctuation(T.retraitAvertissement(nombreElements))}
            </Text>
            <Bouton libelle={T.retirer} variante="encre" petit onPress={retirer} />
          </View>
        ) : (
          <Pressable accessibilityRole="button" onPress={retirer} className="min-h-11 items-center justify-center active:opacity-70">
            <Text className="font-texte-gras text-base text-rouge-texte">{T.retirerCette}</Text>
          </Pressable>
        )
      ) : null}
    </FeuilleBas>
  );
}
