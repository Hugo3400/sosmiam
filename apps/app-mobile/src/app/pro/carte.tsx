import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRouter } from "expo-router";
import { usePreventRemove } from "expo-router/react-navigation";
import { useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import type { CarteLieu, ElementCarte } from "@sos-miam/commun/types/carte";
import { Annonce } from "~/composants/interface/Annonce";
import { Bouton } from "~/composants/interface/Bouton";
import { FeuilleConfirmation } from "~/composants/interface/FeuilleConfirmation";
import { Mascotte } from "~/composants/marque/Mascotte";
import { FeuilleElementCarte } from "~/composants/pro/FeuilleElementCarte";
import { FeuilleSectionCarte } from "~/composants/pro/FeuilleSectionCarte";
import { SectionCartePro } from "~/composants/pro/SectionCartePro";
import { cartesExemples } from "~/contenus/cartes-exemples";
import { lieuxExemples } from "~/contenus/lieux-exemples";
import { formaterDateLongue } from "~/fonctions/dates/formater-date-longue";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserBrouillonCarte } from "~/hooks/utiliser-brouillon-carte";
import { utiliserFermerPile } from "~/hooks/utiliser-fermer-pile";
import { utiliserModes } from "~/hooks/utiliser-modes";
import couleurs from "~/theme/couleurs";

const CARTE_VIDE: CarteLieu = { sections: [] };

/** Quelle feuille est ouverte : un élément (nouveau si index null) ou une section (nouvelle si index null) */
type FeuilleOuverte = { type: "element"; section: number; index: number | null } | { type: "section"; index: number | null } | null;

/**
 * « Ta carte » (gérant) : les sections et leurs plats, boissons ou formules, à ajouter, modifier, retirer ou ranger.
 * Tout se prépare ici, puis part d'un coup avec « Enregistrer » ; partir avant redemande. L'alcool est caché aux moins de
 * 18 ans sur la fiche, et l'app prévient quand un nom y fait penser.
 */
export default function EcranCartePro() {
  const router = useRouter();
  const navigation = useNavigation();
  const marges = useSafeAreaInsets();
  const fermer = utiliserFermerPile();
  const { lieuPro } = utiliserModes();
  const depart = lieuPro ? (cartesExemples[lieuPro.id] ?? CARTE_VIDE) : CARTE_VIDE;
  const brouillon = utiliserBrouillonCarte(depart);
  const { carte } = brouillon;
  const [rangement, setRangement] = useState(false);
  const [feuille, setFeuille] = useState<FeuilleOuverte>(null);
  // La dernière feuille ouverte reste dessinée pendant qu'elle redescend (sans changer de contenu)
  const derniere = useRef<FeuilleOuverte>(null);
  if (feuille) derniere.current = feuille;
  const [annonce, setAnnonce] = useState<{ texte: string; numero: number } | null>(null);
  const [departDemande, setDepartDemande] = useState(false);
  const actionDepart = useRef<(() => void) | null>(null);

  // Des changements pas enregistrés : retour, geste ou bouton système demandent d'abord
  usePreventRemove(brouillon.modifiee, ({ data }) => {
    actionDepart.current = () => navigation.dispatch(data.action);
    setDepartDemande(true);
  });

  if (!lieuPro) return null;

  const formules = lieuxExemples.find((l) => l.id === lieuPro.id)?.type === "sortie";
  const titres = carte.sections.map((s) => s.titre);
  const nombre = carte.sections.reduce((somme, s) => somme + s.elements.length, 0);
  const annoncer = (texte: string) => setAnnonce({ texte, numero: Date.now() });
  const fermerFeuille = () => setFeuille(null);

  const ouverte = feuille ?? derniere.current;
  const elementOuvert = ouverte?.type === "element" && ouverte.index !== null ? (carte.sections[ouverte.section]?.elements[ouverte.index] ?? null) : null;
  const sectionOuverte = ouverte?.type === "section" && ouverte.index !== null ? (carte.sections[ouverte.index] ?? null) : null;

  function garderElement(element: ElementCarte, section: number) {
    if (feuille?.type !== "element") return;
    if (feuille.index === null) brouillon.ajouterElement(section, element);
    else brouillon.modifierElement(feuille.section, feuille.index, element, section);
    setFeuille(null);
  }

  function retirerElement() {
    if (feuille?.type !== "element" || feuille.index === null) return;
    brouillon.supprimerElement(feuille.section, feuille.index);
    setFeuille(null);
  }

  function garderSection(titre: string) {
    if (feuille?.type !== "section") return;
    if (feuille.index === null) brouillon.ajouterSection(titre);
    else brouillon.renommerSection(feuille.index, titre);
    setFeuille(null);
  }

  function retirerSection() {
    if (feuille?.type !== "section" || feuille.index === null) return;
    brouillon.supprimerSection(feuille.index);
    setFeuille(null);
  }

  function enregistrer() {
    // Affichage d'abord : la carte part au service juste après
    vibrerLegerement();
    brouillon.repartirDe(carte);
    setRangement(false);
    annoncer("✅ Carte enregistrée ! (Pour l'instant sur cet écran seulement : la suite arrive.)");
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: couleurs.creme }} edges={["top", "bottom"]}>
      <View className="min-h-14 flex-row items-center gap-3 px-5 pb-2 pt-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retour"
          hitSlop={8}
          onPress={fermer}
          className="h-11 w-11 items-center justify-center rounded-full border-2 border-encre bg-white active:opacity-80"
        >
          <Ionicons name="arrow-back" size={20} color={couleurs.encre} />
        </Pressable>
        <View className="flex-1">
          <Text accessibilityRole="header" className="font-titre-gras text-xl text-encre">
            {formules ? "Tes formules" : "Ta carte"}
          </Text>
          <Text numberOfLines={1} className="font-texte text-[13px] text-gris">
            {lieuPro.emoji} {lieuPro.nom}
          </Text>
        </View>
        {nombre > 1 || carte.sections.length > 1 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={rangement ? "Terminer le rangement" : "Ranger la carte"}
            accessibilityHint={rangement ? undefined : "Des flèches apparaissent pour changer l'ordre des sections et des éléments"}
            onPress={() => {
              vibrerLegerement();
              setRangement((r) => !r);
            }}
            className={`min-h-11 items-center justify-center rounded-full border-2 border-encre px-4 active:opacity-80 ${rangement ? "bg-encre" : "bg-white"}`}
          >
            <Text className={`font-texte-gras text-[15px] ${rangement ? "text-jaune" : "text-encre"}`}>{rangement ? "Terminé" : "Ranger"}</Text>
          </Pressable>
        ) : null}
      </View>

      <ScrollView contentContainerClassName="gap-6 px-5 pb-8 pt-2">
        <Text className="font-texte text-base leading-6 text-gris">
          {lierPonctuation(
            rangement
              ? "Monte et descends les sections et ce qu'elles contiennent, dans l'ordre où tu veux qu'on les lise."
              : "Ce que les gourmands voient sur ta fiche. Touche un élément pour le modifier ; l'alcool est caché aux moins de 18 ans.",
          )}
        </Text>

        {carte.sections.length === 0 ? (
          <View className="items-center gap-3 rounded-carte border-2 border-dashed border-ligne bg-white px-6 py-8">
            <Mascotte expression="surprise" taille={110} />
            <Text className="text-center font-titre-gras text-xl text-encre">{formules ? "Pas encore de formules" : "Ta carte est encore vide"}</Text>
            <Text className="text-center font-texte text-base leading-6 text-gris">
              {lierPonctuation(formules ? "Commence par une section, « Formules » par exemple, puis ajoute tes tarifs." : "Commence par une section (les plats, les desserts, à boire…), puis ajoute ce que tu sers.")}
            </Text>
          </View>
        ) : (
          carte.sections.map((section, index) => (
            <SectionCartePro
              key={`${index}-${section.titre}`}
              section={section}
              index={index}
              total={carte.sections.length}
              rangement={rangement}
              formules={formules}
              onRenommer={() => setFeuille({ type: "section", index })}
              onDeplacer={(sens) => brouillon.deplacerSection(index, sens)}
              onAjouter={() => setFeuille({ type: "element", section: index, index: null })}
              onModifierElement={(rang) => setFeuille({ type: "element", section: index, index: rang })}
              onDeplacerElement={(rang, sens) => brouillon.deplacerElement(index, rang, sens)}
            />
          ))
        )}

        {rangement ? null : (
          <Bouton libelle="Ajouter une section" variante="blanc" indice="Une section range ta carte : les plats, les desserts, à boire…" onPress={() => setFeuille({ type: "section", index: null })} />
        )}

        {carte.majLe && !brouillon.modifiee ? <Text className="text-center font-texte text-sm text-gris">Dernière mise à jour le {formaterDateLongue(carte.majLe)}</Text> : null}
      </ScrollView>

      <View className="gap-2 border-t border-ligne px-5 pt-3" style={{ paddingBottom: 12 }}>
        {brouillon.modifiee ? (
          <>
            <Text accessibilityLiveRegion="polite" className="text-center font-texte-semi text-sm text-gris">
              Des changements pas encore enregistrés
            </Text>
            <View className="flex-row gap-3">
              <Bouton className="flex-1" libelle="Annuler" libelleLu="Annuler tous les changements" variante="blanc" indice="Revient à la carte telle qu'elle était" onPress={() => brouillon.repartirDe(depart)} />
              <Bouton className="flex-1" libelle="Enregistrer" onPress={enregistrer} />
            </View>
          </>
        ) : (
          <Bouton
            libelle={formules ? "Voir mes formules comme un client" : "Voir ma carte comme un client"}
            variante="blanc"
            onPress={() => router.push({ pathname: "/lieu/[id]/carte", params: { id: String(lieuPro.id) } })}
          />
        )}
      </View>

      <FeuilleElementCarte
        visible={feuille?.type === "element"}
        element={elementOuvert}
        sections={titres}
        section={ouverte?.type === "element" ? ouverte.section : 0}
        formules={formules}
        onGarder={garderElement}
        onRetirer={elementOuvert ? retirerElement : undefined}
        onFermer={fermerFeuille}
      />
      <FeuilleSectionCarte
        visible={feuille?.type === "section"}
        titre={sectionOuverte?.titre ?? null}
        nombreElements={sectionOuverte?.elements.length ?? 0}
        titresPris={titres}
        formules={formules}
        onGarder={garderSection}
        onRetirer={sectionOuverte ? retirerSection : undefined}
        onFermer={fermerFeuille}
      />
      <FeuilleConfirmation
        visible={departDemande}
        emoji="📝"
        titre="Partir sans enregistrer ?"
        detail="Tes changements sur la carte seront perdus. Les gourmands verront toujours l'ancienne version."
        libelleConfirmer="Partir sans enregistrer"
        libelleRester="Rester"
        indiceRester="Tu restes sur ta carte, rien n'est perdu"
        onConfirmer={() => {
          brouillon.repartirDe(depart);
        }}
        onRefermee={() => {
          const action = actionDepart.current;
          actionDepart.current = null;
          action?.();
        }}
        onFermer={() => setDepartDemande(false)}
      />
      <Annonce annonce={annonce} haut={marges.top + 12} onFin={() => setAnnonce(null)} />
    </SafeAreaView>
  );
}
