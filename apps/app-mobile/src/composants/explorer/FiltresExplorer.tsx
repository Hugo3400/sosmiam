import { Ionicons } from "@expo/vector-icons";
import { useRef, useState } from "react";
import { Keyboard, Platform, Pressable, ScrollView, Text, View } from "react-native";

import type { Lieu, TypeLieu } from "@sos-miam/commun/types/lieu";
import { ChoixVilleExplorer } from "~/composants/explorer/ChoixVilleExplorer";
import { FILTRES_EXPLORER_PAR_DEFAUT, type FiltresExplorer as ChoixFiltres } from "~/contenus/type-filtres-explorer";
import { deplacerFocusLecteurEcran } from "~/fonctions/interaction/deplacer-focus-lecteur-ecran";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import couleurs from "~/theme/couleurs";

type Props = {
  /** Le type FiltresExplorer de ~/contenus/type-filtres-explorer (renommé ici : le composant porte le même nom) */
  filtres: ChoixFiltres;
  onChange: (filtres: ChoixFiltres) => void;
  /** Villes proposées dans le choix de la ville */
  villes: string[];
  /** Faux : la pastille « Bars » n'est pas montrée (moins de 18 ans) */
  barsPermis: boolean;
};

const tousLesTypes: { cle: TypeLieu | "tous"; libelle: string; emoji?: string }[] = [
  { cle: "tous", libelle: "Tous" },
  { cle: "resto", libelle: "Restos", emoji: "🍝" },
  { cle: "patisserie", libelle: "Pâtisseries", emoji: "🥐" },
  { cle: "bar", libelle: "Bars", emoji: "🍸" },
  { cle: "sortie", libelle: "Sorties", emoji: "🎳" },
];

// « lu » : ce que dit le lecteur d'écran (« euro euro » n'aiderait personne), avec les mêmes noms que les lignes de la liste (LigneLieu)
const tousLesBudgets: { cle: Lieu["prix"]; lu: string }[] = [
  { cle: "€", lu: "Petit budget" },
  { cle: "€€", lu: "Budget moyen" },
  { cle: "€€€", lu: "Budget plaisir" },
];

const classePastille = (choisi: boolean) =>
  `min-h-11 flex-row items-center gap-1.5 rounded-full border-2 border-encre px-3.5 active:opacity-80 ${choisi ? "bg-encre" : "bg-white"}`;
const classeTexte = (choisi: boolean) => `font-texte-semi text-[14px] ${choisi ? "text-jaune" : "text-encre"}`;

/**
 * La rangée de filtres d'Explorer, qui défile de côté : type de lieu (un seul), « Ouvert maintenant », budgets (plusieurs), ville.
 * « Effacer » apparaît en tête dès qu'un filtre est actif ; il garde la recherche tapée (la barre a sa propre croix).
 */
export function FiltresExplorer({ filtres, onChange, villes, barsPermis }: Props) {
  const [choixVilleOuvert, setChoixVilleOuvert] = useState(false);
  const pastilleTous = useRef<View>(null);
  const pastilleVille = useRef<View>(null);

  const types = tousLesTypes.filter((t) => t.cle !== "bar" || barsPermis);
  const nombreActifs = (filtres.type !== "tous" ? 1 : 0) + (filtres.ville ? 1 : 0) + filtres.budgets.length + (filtres.ouvertMaintenant ? 1 : 0);
  const villeVisible = villes.length > 0 || filtres.ville !== null;

  function changer(modif: Partial<ChoixFiltres>) {
    vibrerLegerement();
    onChange({ ...filtres, ...modif });
  }

  function basculerBudget(budget: Lieu["prix"]) {
    const coches = filtres.budgets.includes(budget) ? filtres.budgets.filter((b) => b !== budget) : [...filtres.budgets, budget];
    // Toujours dans l'ordre €, €€, €€€
    changer({ budgets: tousLesBudgets.map((b) => b.cle).filter((b) => coches.includes(b)) });
  }

  function effacer() {
    changer({ ...FILTRES_EXPLORER_PAR_DEFAUT, texte: filtres.texte });
    // « Effacer » disparaît : le lecteur d'écran reprend sur « Tous »
    setTimeout(() => deplacerFocusLecteurEcran(pastilleTous.current), 150);
  }

  function fermerChoixVille() {
    setChoixVilleOuvert(false);
    // Le lecteur d'écran revient sur la pastille de la ville une fois la feuille descendue
    setTimeout(() => deplacerFocusLecteurEcran(pastilleVille.current), 450);
  }

  function choisirVille(ville: string | null) {
    if (ville !== filtres.ville) onChange({ ...filtres, ville });
    fermerChoixVille();
  }

  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        // Sans ça, la rangée s'étirerait en hauteur dans son parent
        style={{ flexGrow: 0 }}
        contentContainerClassName="items-center gap-2 px-4 py-1"
      >
        {nombreActifs > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Effacer les filtres, ${nombreActifs} actif${nombreActifs > 1 ? "s" : ""}`}
            onPress={effacer}
            className="min-h-11 flex-row items-center gap-1 rounded-full border-2 border-encre bg-jaune px-3.5 active:opacity-80"
          >
            <Ionicons name="close" size={16} color={couleurs.encre} />
            <Text className="font-texte-gras text-[14px] text-encre">Effacer les filtres</Text>
          </Pressable>
        ) : null}

        {/* Un seul type à la fois. iOS ne connaît pas la radio dans un groupe : bouton « sélectionné », avec la position dans le libellé */}
        <View accessibilityRole="radiogroup" accessibilityLabel="Type de lieu" className="flex-row items-center gap-2">
          {types.map((t, i) => {
            const choisi = filtres.type === t.cle;
            return (
              <Pressable
                key={t.cle}
                ref={i === 0 ? pastilleTous : undefined}
                accessibilityRole={Platform.OS === "ios" ? "button" : "radio"}
                accessibilityLabel={Platform.OS === "ios" ? `${t.libelle}, type de lieu, ${i + 1} sur ${types.length}` : t.libelle}
                accessibilityState={Platform.OS === "ios" ? { selected: choisi } : { checked: choisi }}
                onPress={() => changer({ type: t.cle })}
                className={classePastille(choisi)}
              >
                {t.emoji ? <Text className="text-[15px]">{t.emoji}</Text> : null}
                <Text className={classeTexte(choisi)}>{t.libelle}</Text>
              </Pressable>
            );
          })}
        </View>

        <View className="h-6 w-0.5 rounded-full bg-encre/20" />

        <Pressable
          accessibilityRole="switch"
          accessibilityLabel="Ouvert maintenant"
          accessibilityState={{ checked: filtres.ouvertMaintenant }}
          onPress={() => changer({ ouvertMaintenant: !filtres.ouvertMaintenant })}
          className={classePastille(filtres.ouvertMaintenant)}
        >
          <Ionicons name={filtres.ouvertMaintenant ? "time" : "time-outline"} size={16} color={filtres.ouvertMaintenant ? couleurs.jaune : couleurs.encre} />
          <Text className={classeTexte(filtres.ouvertMaintenant)}>Ouvert maintenant</Text>
        </Pressable>

        <View className="h-6 w-0.5 rounded-full bg-encre/20" />

        {/* Plusieurs budgets possibles. Sur iPhone, une case à cocher est lue en anglais (« checkbox, checked ») : bouton « sélectionné » */}
        {tousLesBudgets.map((b) => {
          const choisi = filtres.budgets.includes(b.cle);
          return (
            <Pressable
              key={b.cle}
              accessibilityRole={Platform.OS === "ios" ? "button" : "checkbox"}
              accessibilityLabel={b.lu}
              accessibilityState={Platform.OS === "ios" ? { selected: choisi } : { checked: choisi }}
              onPress={() => basculerBudget(b.cle)}
              className={`${classePastille(choisi)} min-w-11 justify-center`}
            >
              <Text className={classeTexte(choisi)}>{b.cle}</Text>
            </Pressable>
          );
        })}

        {villeVisible ? (
          <>
            <View className="h-6 w-0.5 rounded-full bg-encre/20" />
            <Pressable
              ref={pastilleVille}
              accessibilityRole="button"
              accessibilityLabel={`Ville : ${filtres.ville ?? "toutes les villes"}`}
              accessibilityHint="Ouvre le choix de la ville"
              onPress={() => {
                vibrerLegerement();
                // Le clavier de la recherche passerait par-dessus le choix de la ville
                Keyboard.dismiss();
                setChoixVilleOuvert(true);
              }}
              className={classePastille(filtres.ville !== null)}
            >
              <Ionicons name="location" size={16} color={filtres.ville ? couleurs.jaune : couleurs.encre} />
              <Text numberOfLines={1} className={`max-w-[160px] ${classeTexte(filtres.ville !== null)}`}>{filtres.ville ?? "Toutes les villes"}</Text>
              <Ionicons name="chevron-down" size={16} color={filtres.ville ? couleurs.jaune : couleurs.encre} />
            </Pressable>
          </>
        ) : null}
      </ScrollView>

      <ChoixVilleExplorer
        visible={choixVilleOuvert}
        villes={villes}
        ville={filtres.ville}
        onChoisir={choisirVille}
        onFermer={fermerChoixVille}
      />
    </>
  );
}
