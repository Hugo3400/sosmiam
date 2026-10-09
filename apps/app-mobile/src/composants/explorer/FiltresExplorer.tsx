import { Ionicons } from "@expo/vector-icons";
import { useRef, useState } from "react";
import { Keyboard, Platform, Pressable, ScrollView, Text, View } from "react-native";

import type { Lieu, TypeLieu } from "@sos-miam/commun/types/lieu";
import { FeuilleZoneExplorer, type ChoixZone } from "~/composants/explorer/FeuilleZoneExplorer";
import { FILTRES_EXPLORER_PAR_DEFAUT, type FiltresExplorer as ChoixFiltres } from "~/contenus/type-filtres-explorer";
import { deplacerFocusLecteurEcran } from "~/fonctions/interaction/deplacer-focus-lecteur-ecran";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import couleurs from "~/theme/couleurs";

type Props = {
  /** Le type FiltresExplorer de ~/contenus/type-filtres-explorer (renommé ici : le composant porte le même nom) */
  filtres: ChoixFiltres;
  onChange: (filtres: ChoixFiltres) => void;
  /** Villes proposées dans le choix de la zone (« Ou une ville précise ») */
  villes: string[];
  /** Faux : la pastille « Bars » n'est pas montrée (moins de 18 ans) */
  barsPermis: boolean;
  /** Où l'on regarde : à quelques km, ta région, toute la France, ou la ville des filtres */
  zone: ChoixZone;
  /** Ta région (null si on ne la connaît pas) */
  region: string | null;
  /** « de toi » avec « Autour de moi », sinon « de Montpellier » (ou « de ta ville ») */
  autourDe: string;
  onChangerZone: (zone: ChoixZone) => void;
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

/** Ce que montre la pastille de zone, et ce qu'elle dit au lecteur d'écran */
function decrireZone(zone: ChoixZone, region: string | null, autourDe: string): { texte: string; lu: string; icone: keyof typeof Ionicons.glyphMap } {
  if (zone.ville !== null) return { texte: zone.ville, lu: `Ville : ${zone.ville}`, icone: "business" };
  if (zone.portee === "proche") return { texte: `${zone.rayonKm} km`, lu: `Zone : à ${zone.rayonKm} kilomètres ou moins ${autourDe}`, icone: "location" };
  if (zone.portee === "region" && region) return { texte: region, lu: `Zone : ta région, ${region}`, icone: "map" };
  return { texte: "Toute la France", lu: "Zone : toute la France", icone: "earth" };
}

/**
 * La rangée de filtres d'Explorer, qui défile de côté : d'abord la zone (à quelques km, ta région, toute la France ou une
 * ville, pour la carte comme pour la liste), puis type de lieu (un seul), « Ouvert maintenant » et budgets (plusieurs).
 * « Effacer » apparaît dès qu'un filtre est actif ; il garde la recherche tapée (la barre a sa propre croix) et la zone.
 */
export function FiltresExplorer({ filtres, onChange, villes, barsPermis, zone, region, autourDe, onChangerZone }: Props) {
  const [choixZoneOuvert, setChoixZoneOuvert] = useState(false);
  const pastilleTous = useRef<View>(null);
  const pastilleZone = useRef<View>(null);
  const zoneDecrite = decrireZone(zone, region, autourDe);

  const types = tousLesTypes.filter((t) => t.cle !== "bar" || barsPermis);
  const nombreActifs = (filtres.type !== "tous" ? 1 : 0) + (filtres.ville ? 1 : 0) + filtres.budgets.length + (filtres.ouvertMaintenant ? 1 : 0);

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

  function fermerChoixZone() {
    setChoixZoneOuvert(false);
    // Le lecteur d'écran revient sur la pastille de la zone une fois la feuille descendue
    setTimeout(() => deplacerFocusLecteurEcran(pastilleZone.current), 450);
  }

  function choisirZone(choix: ChoixZone) {
    vibrerLegerement();
    onChangerZone(choix);
    fermerChoixZone();
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
        {/* La zone en premier, toujours en jaune : c'est elle qui dit ce que montrent la carte et la liste */}
        <Pressable
          ref={pastilleZone}
          accessibilityRole="button"
          accessibilityLabel={zoneDecrite.lu}
          accessibilityHint="Ouvre le choix de la zone : à quelques kilomètres, ta région, toute la France ou une ville"
          onPress={() => {
            vibrerLegerement();
            // Le clavier de la recherche passerait par-dessus le choix de la zone
            Keyboard.dismiss();
            setChoixZoneOuvert(true);
          }}
          className="min-h-11 flex-row items-center gap-1.5 rounded-full border-2 border-encre bg-jaune px-3.5 active:opacity-80"
        >
          <Ionicons name={zoneDecrite.icone} size={16} color={couleurs.encre} />
          <Text numberOfLines={1} className="max-w-[160px] font-texte-gras text-[14px] text-encre">
            {zoneDecrite.texte}
          </Text>
          <Ionicons name="chevron-down" size={16} color={couleurs.encre} />
        </Pressable>

        <View className="h-6 w-0.5 rounded-full bg-encre/20" />

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

      </ScrollView>

      <FeuilleZoneExplorer visible={choixZoneOuvert} choix={zone} region={region} autourDe={autourDe} villes={villes} onValider={choisirZone} onFermer={fermerChoixZone} />
    </>
  );
}
