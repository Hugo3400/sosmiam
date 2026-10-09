import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { contientMotAlcool } from "@sos-miam/commun/fonctions/fidelite/contient-mot-alcool";
import { ETIQUETTES_CARTE, LIMITES_CARTE } from "@sos-miam/commun/regles/carte-du-lieu";
import type { ElementCarte, EtiquetteCarte } from "@sos-miam/commun/types/carte";
import { validerElementCarte, type ChampElementCarte } from "@sos-miam/commun/validation/valider-element-carte";
import { Bouton } from "~/composants/interface/Bouton";
import { ChampTexte } from "~/composants/interface/ChampTexte";
import { FeuilleBas } from "~/composants/interface/FeuilleBas";
import { Interrupteur } from "~/composants/interface/Interrupteur";
import { Pastille } from "~/composants/interface/Pastille";
import { etiquettesCarte } from "~/contenus/etiquettes-carte";
import { lireSaisiePrix } from "~/fonctions/prix/lire-saisie-prix";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

const ETIQUETTES = ETIQUETTES_CARTE;
const UNITES_CARTE = ["le verre", "la bouteille", "la part", "à partager"];
const UNITES_FORMULES = ["par personne", "la partie", "l'heure", "le groupe"];

type Props = {
  visible: boolean;
  /** L'élément à modifier, ou null pour en ajouter un */
  element: ElementCarte | null;
  /** Titres des sections de la carte, pour ranger l'élément dans une autre */
  sections: readonly string[];
  /** Section de départ (où l'on ajoute, ou celle de l'élément modifié) */
  section: number;
  formules: boolean;
  /** Garde l'élément dans la carte en cours (pas encore enregistrée), dans la section choisie */
  onGarder: (element: ElementCarte, section: number) => void;
  /** Absent pour un nouvel élément */
  onRetirer?: () => void;
  onFermer: () => void;
};

/** Ce qu'on dit sous le champ à corriger (mêmes règles que le service : validerElementCarte) */
const ERREURS: Record<ChampElementCarte, string> = {
  nom: `Donne-lui un nom, sans gros mot (${LIMITES_CARTE.nom} caractères au plus).`,
  description: `Sans gros mot, ${LIMITES_CARTE.description} caractères au plus.`,
  prix: "Comme 12 ou 4,50 (0 si c'est offert), jusqu'à 9 999 €.",
  unite: `Court et sans gros mot (${LIMITES_CARTE.unite} caractères au plus).`,
  etiquettes: "Un repère ne passe pas : décoche-le.",
  autre: "Quelque chose ne passe pas : vérifie tes choix.",
};

type Brouillon = { nom: string; description: string; prix: string; unite: string; signature: boolean; alcool: boolean; etiquettes: EtiquetteCarte[]; section: number };

/** « 6,50 » plutôt que « 6.5 » dans le champ du prix */
const ecrirePrix = (prix: number) => (Number.isInteger(prix) ? String(prix) : prix.toFixed(2).replace(".", ","));

const versBrouillon = (e: ElementCarte | null, section: number): Brouillon => ({
  nom: e?.nom ?? "",
  description: e?.description ?? "",
  prix: e ? ecrirePrix(e.prix) : "",
  unite: e?.unite ?? "",
  signature: e?.signature === true,
  alcool: e?.alcool === true,
  etiquettes: e?.etiquettes ?? [],
  section,
});

/**
 * Feuille « un plat, une boisson, une formule » du mode pro : nom, description, prix et ce qu'il couvre, spécialité,
 * alcool (caché aux moins de 18 ans, et l'app prévient quand le nom y fait penser), repères (végé, fait maison…) et section.
 * Rien n'est enregistré ici : l'élément rejoint la carte en cours, enregistrée d'un coup depuis l'écran.
 */
export function FeuilleElementCarte({ visible, element, sections, section, formules, onGarder, onRetirer, onFermer }: Props) {
  const [b, setB] = useState<Brouillon>(() => versBrouillon(element, section));
  const [erreur, setErreur] = useState<ChampElementCarte | null>(null);
  // À chaque ouverture, on repart de l'élément touché (sans montrer l'ancien le temps d'un rendu)
  const [ouvert, setOuvert] = useState(visible);
  if (visible !== ouvert) {
    setOuvert(visible);
    if (visible) {
      setB(versBrouillon(element, section));
      setErreur(null);
    }
  }

  const changer = (partiel: Partial<Brouillon>) => {
    setB((x) => ({ ...x, ...partiel }));
    setErreur(null);
  };
  const basculerEtiquette = (e: EtiquetteCarte) => changer({ etiquettes: b.etiquettes.includes(e) ? b.etiquettes.filter((x) => x !== e) : [...b.etiquettes, e] });
  const sembleAlcool = !b.alcool && contientMotAlcool(`${b.nom} ${b.description}`);
  const unites = formules ? UNITES_FORMULES : UNITES_CARTE;

  function garder() {
    const prix = lireSaisiePrix(b.prix);
    if (prix === null) return setErreur(b.nom.trim() ? "prix" : "nom");
    // Les mêmes règles que le service : l'élément gardé passera à l'enregistrement
    const r = validerElementCarte({ nom: b.nom, description: b.description, prix, unite: b.unite, signature: b.signature, alcool: b.alcool, etiquettes: b.etiquettes });
    if (!r.ok) return setErreur(r.champ);
    onGarder(r.element, b.section);
  }

  return (
    <FeuilleBas
      visible={visible}
      titre={element ? element.nom : formules ? "Une nouvelle formule" : "Un nouveau plat ou une boisson"}
      sousTitre={element ? undefined : "Ce que tu écris ici apparaît tel quel sur ta fiche."}
      onFermer={onFermer}
      pied={
        <>
          <Bouton libelle={element ? "Garder ces changements" : "Ajouter à la carte"} onPress={garder} />
          <Bouton libelle="Annuler" variante="blanc" onPress={onFermer} />
        </>
      }
    >
      <ChampTexte libelle="Nom" valeur={b.nom} onChangeTexte={(nom) => changer({ nom })} placeholder={formules ? "Partie de 1 h" : "Moules du Capitaine"} maxLength={LIMITES_CARTE.nom} erreur={erreur === "nom" ? ERREURS.nom : null} />
      <ChampTexte libelle="Description" mention="facultatif" valeur={b.description} onChangeTexte={(description) => changer({ description })} placeholder={formules ? "Pour 2 à 6 joueurs, dès 12 ans" : "Ce qu'il y a dedans, en quelques mots"} multiline maxLength={LIMITES_CARTE.description} erreur={erreur === "description" ? ERREURS.description : null} />
      {/* Juste sous ce qu'on vient d'écrire, pour ne pas passer à côté (la case est plus bas) */}
      {sembleAlcool ? (
        <View accessibilityLiveRegion="polite" className="gap-3 rounded-2xl border-2 border-tomate bg-rose-alerte px-4 py-3">
          <Text className="font-texte-semi text-sm leading-5 text-encre">{lierPonctuation("🍷 On dirait de l'alcool. Si c'est une boisson alcoolisée, on la cache aux moins de 18 ans.")}</Text>
          <Bouton libelle="Oui, ça contient de l'alcool" variante="blanc" petit onPress={() => changer({ alcool: true })} />
        </View>
      ) : null}

      <View className="flex-row gap-3">
        <View className="flex-1">
          <ChampTexte libelle="Prix (€)" valeur={b.prix} onChangeTexte={(prix) => changer({ prix })} keyboardType="decimal-pad" placeholder="12,50" erreur={erreur === "prix" ? ERREURS.prix : null} />
        </View>
        <View className="flex-1">
          <ChampTexte libelle="Pour" mention="facultatif" valeur={b.unite} onChangeTexte={(unite) => changer({ unite })} placeholder={formules ? "par personne" : "la part, le verre…"} maxLength={LIMITES_CARTE.unite} erreur={erreur === "unite" ? ERREURS.unite : null} />
        </View>
      </View>
      <View className="flex-row flex-wrap gap-2">
        {unites.map((u, i) => (
          <Pastille key={u} libelle={u} role="radio" position={i + 1} total={unites.length} choisi={b.unite.trim() === u} onPress={() => changer({ unite: b.unite.trim() === u ? "" : u })} />
        ))}
      </View>

      <View className="gap-3">
        <Interrupteur emoji="⭐" titre="Spécialité de la maison" detail="Mise en avant en haut de ta fiche" valeur={b.signature} onChanger={(signature) => changer({ signature })} />
        <Interrupteur emoji="🍷" titre="Contient de l'alcool" detail="Caché aux moins de 18 ans, et quand on ne connaît pas l'âge" valeur={b.alcool} onChanger={(alcool) => changer({ alcool })} />
      </View>

      <View className="gap-2">
        <Text className="font-texte-gras text-base text-encre">Les repères</Text>
        <View className="flex-row flex-wrap gap-2">
          {ETIQUETTES.map((e, i) => (
            <Pastille key={e} libelle={etiquettesCarte[e].libelle} emoji={etiquettesCarte[e].emoji} position={i + 1} total={ETIQUETTES.length} choisi={b.etiquettes.includes(e)} onPress={() => basculerEtiquette(e)} />
          ))}
        </View>
      </View>

      {sections.length > 1 ? (
        <View className="gap-2">
          <Text className="font-texte-gras text-base text-encre">Dans la section</Text>
          <View className="flex-row flex-wrap gap-2">
            {sections.map((titre, i) => (
              <Pastille key={`${i}-${titre}`} libelle={titre} role="radio" position={i + 1} total={sections.length} choisi={b.section === i} onPress={() => changer({ section: i })} />
            ))}
          </View>
        </View>
      ) : null}

      {erreur === "etiquettes" || erreur === "autre" ? <Text className="font-texte-semi text-sm text-rouge-texte">{ERREURS[erreur]}</Text> : null}

      {onRetirer ? (
        <Pressable accessibilityRole="button" onPress={onRetirer} className="min-h-11 items-center justify-center active:opacity-70">
          <Text className="font-texte-gras text-base text-rouge-texte">Retirer de la carte</Text>
        </Pressable>
      ) : null}
    </FeuilleBas>
  );
}
