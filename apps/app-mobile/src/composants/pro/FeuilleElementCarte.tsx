import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { contientMotAlcool } from "@sos-miam/commun/fonctions/fidelite/contient-mot-alcool";
import { ETIQUETTES_CARTE, LIMITES_CARTE } from "@sos-miam/commun/regles/carte-du-lieu";
import type { Langue } from "@sos-miam/commun/regles/langues";
import type { ElementCarte, EtiquetteCarte } from "@sos-miam/commun/types/carte";
import { validerElementCarte, type ChampElementCarte } from "@sos-miam/commun/validation/valider-element-carte";
import { Bouton } from "~/composants/interface/Bouton";
import { ChampTexte } from "~/composants/interface/ChampTexte";
import { FeuilleBas } from "~/composants/interface/FeuilleBas";
import { Interrupteur } from "~/composants/interface/Interrupteur";
import { Pastille } from "~/composants/interface/Pastille";
import { ETIQUETTES_CARTE_PAR_LANGUE } from "~/contenus/etiquettes-carte";
import { TEXTES_EDITION_CARTE_PAR_LANGUE } from "~/contenus/textes-edition-carte";
import { annoncerLecteurEcran } from "~/fonctions/interaction/annoncer-lecteur-ecran";
import { lireSaisiePrix } from "~/fonctions/prix/lire-saisie-prix";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";

const ETIQUETTES = ETIQUETTES_CARTE;

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

type Brouillon = { nom: string; description: string; prix: string; unite: string; signature: boolean; alcool: boolean; etiquettes: EtiquetteCarte[]; section: number };

/** « 6,50 » plutôt que « 6.5 » dans le champ du prix (« 6.50 » en anglais) */
const ecrirePrix = (prix: number, langue: Langue) => (Number.isInteger(prix) ? String(prix) : langue === "en" ? prix.toFixed(2) : prix.toFixed(2).replace(".", ","));

const versBrouillon = (e: ElementCarte | null, section: number, langue: Langue): Brouillon => ({
  nom: e?.nom ?? "",
  description: e?.description ?? "",
  prix: e ? ecrirePrix(e.prix, langue) : "",
  unite: e?.unite ?? "",
  signature: e?.signature === true,
  alcool: e?.alcool === true,
  etiquettes: e?.etiquettes ?? [],
  section,
});

/**
 * Feuille « un plat, une boisson, une formule » du mode pro : nom, description, prix et ce qu'il couvre, spécialité,
 * alcool (caché à qui visite sans compte, et l'app prévient quand le nom y fait penser), repères (végé, fait maison…) et section.
 * Rien n'est enregistré ici : l'élément rejoint la carte en cours, enregistrée d'un coup depuis l'écran.
 */
export function FeuilleElementCarte({ visible, element, sections, section, formules, onGarder, onRetirer, onFermer }: Props) {
  const { langue } = utiliserLangue();
  const T = utiliserTextes(TEXTES_EDITION_CARTE_PAR_LANGUE).element;
  const etiquettesCarte = utiliserTextes(ETIQUETTES_CARTE_PAR_LANGUE);
  /** Ce qu'on dit sous le champ à corriger (mêmes règles que le service : validerElementCarte) */
  const erreurs: Record<ChampElementCarte, string> = {
    nom: T.erreurs.nom(LIMITES_CARTE.nom),
    description: T.erreurs.description(LIMITES_CARTE.description),
    prix: T.erreurs.prix,
    unite: T.erreurs.unite(LIMITES_CARTE.unite),
    etiquettes: T.erreurs.etiquettes,
    autre: T.erreurs.autre,
  };
  const [b, setB] = useState<Brouillon>(() => versBrouillon(element, section, langue));
  const [erreur, setErreur] = useState<ChampElementCarte | null>(null);
  // À chaque ouverture, on repart de l'élément touché (sans montrer l'ancien le temps d'un rendu)
  const [ouvert, setOuvert] = useState(visible);
  if (visible !== ouvert) {
    setOuvert(visible);
    if (visible) {
      setB(versBrouillon(element, section, langue));
      setErreur(null);
    }
  }

  const changer = (partiel: Partial<Brouillon>) => {
    setB((x) => ({ ...x, ...partiel }));
    setErreur(null);
  };
  const basculerEtiquette = (e: EtiquetteCarte) => changer({ etiquettes: b.etiquettes.includes(e) ? b.etiquettes.filter((x) => x !== e) : [...b.etiquettes, e] });
  const sembleAlcool = !b.alcool && contientMotAlcool(`${b.nom} ${b.description}`);
  // L'avertissement apparaît pendant qu'on écrit : VoiceOver le dit aussi (le rôle « live » ne marche que sur Android)
  useEffect(() => {
    if (visible && sembleAlcool) annoncerLecteurEcran(T.annonceAlcool);
  }, [visible, sembleAlcool, T.annonceAlcool]);
  const unites = formules ? T.unitesFormules : T.unitesCarte;

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
      titre={element ? element.nom : formules ? T.titreFormule : T.titrePlat}
      sousTitre={element ? undefined : T.sousTitre}
      onFermer={onFermer}
      pied={
        <>
          <Bouton libelle={element ? T.garder : T.ajouter} onPress={garder} />
          <Bouton libelle={T.annuler} variante="blanc" onPress={onFermer} />
        </>
      }
    >
      <ChampTexte libelle={T.nom} valeur={b.nom} onChangeTexte={(nom) => changer({ nom })} placeholder={formules ? T.nomExempleFormule : T.nomExemplePlat} maxLength={LIMITES_CARTE.nom} erreur={erreur === "nom" ? erreurs.nom : null} />
      <ChampTexte
        libelle={T.description}
        mention={T.facultatif}
        valeur={b.description}
        onChangeTexte={(description) => changer({ description })}
        placeholder={formules ? T.descriptionExempleFormule : T.descriptionExemplePlat}
        multiline
        maxLength={LIMITES_CARTE.description}
        erreur={erreur === "description" ? erreurs.description : null}
      />
      {/* Juste sous ce qu'on vient d'écrire, pour ne pas passer à côté (la case est plus bas) */}
      {sembleAlcool ? (
        <View accessibilityLiveRegion="polite" className="gap-3 rounded-2xl border-2 border-tomate bg-rose-alerte px-4 py-3">
          <Text className="font-texte-semi text-sm leading-5 text-encre">{lierPonctuation(T.alerteAlcool)}</Text>
          <Bouton
            libelle={T.ouiAlcool}
            variante="blanc"
            petit
            onPress={() => {
              changer({ alcool: true });
              annoncerLecteurEcran(T.annonceAlcoolActive);
            }}
          />
        </View>
      ) : null}

      <View className="flex-row gap-3">
        <View className="flex-1">
          <ChampTexte libelle={T.prix} valeur={b.prix} onChangeTexte={(prix) => changer({ prix })} keyboardType="decimal-pad" placeholder={T.prixExemple} erreur={erreur === "prix" ? erreurs.prix : null} />
        </View>
        <View className="flex-1">
          <ChampTexte
            libelle={T.pour}
            mention={T.facultatif}
            valeur={b.unite}
            onChangeTexte={(unite) => changer({ unite })}
            placeholder={formules ? T.pourExempleFormule : T.pourExemplePlat}
            maxLength={LIMITES_CARTE.unite}
            erreur={erreur === "unite" ? erreurs.unite : null}
          />
        </View>
      </View>
      <View className="flex-row flex-wrap gap-2">
        {unites.map((u, i) => (
          <Pastille key={u} libelle={u} role="radio" position={i + 1} total={unites.length} choisi={b.unite.trim() === u} onPress={() => changer({ unite: b.unite.trim() === u ? "" : u })} />
        ))}
      </View>

      <View className="gap-3">
        <Interrupteur emoji="⭐" titre={T.specialite} detail={T.specialiteDetail} valeur={b.signature} onChanger={(signature) => changer({ signature })} />
        <Interrupteur emoji="🍷" titre={T.alcool} detail={T.alcoolDetail} valeur={b.alcool} onChanger={(alcool) => changer({ alcool })} />
      </View>

      <View className="gap-2">
        <Text className="font-texte-gras text-base text-encre">{T.reperes}</Text>
        <View className="flex-row flex-wrap gap-2">
          {ETIQUETTES.map((e, i) => (
            <Pastille key={e} libelle={etiquettesCarte[e].libelle} emoji={etiquettesCarte[e].emoji} position={i + 1} total={ETIQUETTES.length} choisi={b.etiquettes.includes(e)} onPress={() => basculerEtiquette(e)} />
          ))}
        </View>
      </View>

      {sections.length > 1 ? (
        <View className="gap-2">
          <Text className="font-texte-gras text-base text-encre">{T.dansSection}</Text>
          <View className="flex-row flex-wrap gap-2">
            {sections.map((titre, i) => (
              <Pastille key={`${i}-${titre}`} libelle={titre} role="radio" position={i + 1} total={sections.length} choisi={b.section === i} onPress={() => changer({ section: i })} />
            ))}
          </View>
        </View>
      ) : null}

      {erreur === "etiquettes" || erreur === "autre" ? <Text className="font-texte-semi text-sm text-rouge-texte">{erreurs[erreur]}</Text> : null}

      {onRetirer ? (
        <Pressable accessibilityRole="button" onPress={onRetirer} className="min-h-11 items-center justify-center active:opacity-70">
          <Text className="font-texte-gras text-base text-rouge-texte">{T.retirer}</Text>
        </Pressable>
      ) : null}
    </FeuilleBas>
  );
}
