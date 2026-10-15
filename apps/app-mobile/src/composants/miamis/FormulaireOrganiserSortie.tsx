import * as Crypto from "expo-crypto";
import { useRouter } from "expo-router";
import { useState } from "react";
import { AccessibilityInfo, KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { MESSAGES_SERVICE } from "@sos-miam/commun/contenus/messages-services";
import { peutOrganiserPourPublic } from "@sos-miam/commun/fonctions/sorties-miamis/peut-organiser-pour-public";
import { LONGUEUR_MAX_TITRE_SORTIE } from "@sos-miam/commun/regles/potes";
import { LONGUEUR_MAX_DESCRIPTION_SORTIE_MIAMIS, MAX_PLACES_SORTIE_MIAMIS, MIN_PLACES_SORTIE_MIAMIS } from "@sos-miam/commun/regles/sorties-miamis";
import type { EtiquetteSortieMiamis, TrancheAge } from "@sos-miam/commun/types/sorties-miamis";
import { validerNouvelleSortieMiamis, type ChampNouvelleSortieMiamis } from "@sos-miam/commun/validation/valider-nouvelle-sortie-miamis";
import { RefusLimitationEnPlace } from "~/composants/compte/RefusLimitationEnPlace";
import { Bouton } from "~/composants/interface/Bouton";
import { ChampTexte } from "~/composants/interface/ChampTexte";
import { CompteurPlusMoins } from "~/composants/interface/CompteurPlusMoins";
import { Interrupteur } from "~/composants/interface/Interrupteur";
import { BarreEcranMiamis } from "~/composants/miamis/BarreEcranMiamis";
import { ChoixAvecQui } from "~/composants/miamis/ChoixAvecQui";
import { ChoixEtiquettesSortie } from "~/composants/miamis/ChoixEtiquettesSortie";
import { ChoixLieuSortieMiamis } from "~/composants/miamis/ChoixLieuSortieMiamis";
import { ChoixPublicSortie } from "~/composants/miamis/ChoixPublicSortie";
import { LigneToujoursActive } from "~/composants/miamis/LigneToujoursActive";
import { ChoixQuandSortie } from "~/composants/potes/ChoixQuandSortie";
import { SectionReglages } from "~/composants/reglages/SectionReglages";
import { REFUS_LIMITATION } from "~/contenus/limitation-compte";
import { REFUS_ETIQUETTE } from "~/contenus/textes-etiquettes";
import { TEXTES_ORGANISER, type ChoixPublicSortie as ChoixPublic } from "~/contenus/textes-sorties-miamis";
import { ecrireHeure } from "~/fonctions/dates/ecrire-heure";
import { ecrireJourLong } from "~/fonctions/dates/ecrire-jour-long";
import { construirePublicSortie } from "~/fonctions/miamis/construire-public-sortie";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserGesteCommunaute } from "~/hooks/utiliser-geste-communaute";
import { utiliserLieux } from "~/hooks/utiliser-lieux";
import { utiliserProfilVisibiliteMiamis } from "~/hooks/utiliser-profil-visibilite-miamis";
import couleurs from "~/theme/couleurs";

type Erreurs = Partial<Record<ChampNouvelleSortieMiamis | "envoi", string>>;

const demainSoir = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(20, 0, 0, 0);
  return date;
};

export function FormulaireOrganiserSortie() {
  const router = useRouter();
  const { trouverLieu } = utiliserLieux();
  const { profil } = utiliserProfilVisibiliteMiamis();
  const { agir, enCours } = utiliserGesteCommunaute();
  const [cle] = useState(() => Crypto.randomUUID());
  const [choix, setChoix] = useState<ChoixPublic>("tous");
  const [tranche, setTranche] = useState<TrancheAge>("25-35");
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [etiquettes, setEtiquettes] = useState<EtiquetteSortieMiamis[]>([]);
  const [quand, setQuand] = useState(demainSoir);
  const [lieuId, setLieuId] = useState<number | null>(null);
  const [places, setPlaces] = useState(MAX_PLACES_SORTIE_MIAMIS);
  const [recurrente, setRecurrente] = useState(false);
  const [placeGardeePourNouveau, setPlaceGardeePourNouveau] = useState(false);
  const [erreurs, setErreurs] = useState<Erreurs>({});
  const [refusLimite, setRefusLimite] = useState<string | null>(null);
  const envoi = enCours === "creer";
  const lieu = lieuId === null ? null : (trouverLieu(lieuId) ?? null);
  const effacer = (champ: keyof Erreurs) => setErreurs((e) => ({ ...e, [champ]: undefined }));

  async function publier() {
    if (envoi) return;
    setRefusLimite(null);
    const nouvelle = {
      titre,
      description,
      quand: quand.toISOString(),
      lieuId: lieuId ?? -1,
      public: construirePublicSortie(choix, tranche),
      etiquettes,
      places,
      placeGardeePourNouveau,
      recurrente,
    };
    const lue = validerNouvelleSortieMiamis(nouvelle, new Date());
    let trouvees: Erreurs = {};
    if (!lue.ok) {
      const texte =
        lue.champ === "titre" && lue.raison === "mot-interdit"
          ? TEXTES_ORGANISER.erreurs.titreMot
          : lue.champ === "etiquettes" && lue.raison && lue.raison !== "mot-interdit"
            ? REFUS_ETIQUETTE[lue.raison]
            : TEXTES_ORGANISER.erreurs[lue.champ];
      trouvees = { [lue.champ]: texte };
    } else if (!peutOrganiserPourPublic(lue.sortie.public, profil)) trouvees = { public: TEXTES_ORGANISER.erreurs.public };
    else {
      const r = await agir("creer", (s) => s.creerSortie(lue.sortie, cle));
      if (r.ok) {
        router.replace({ pathname: "/potes/miamis/sortie/[id]", params: { id: r.reponse.sortie.id } });
        return;
      }
      if (r.erreur === "compte-limite") setRefusLimite(REFUS_LIMITATION.sortie);
      else trouvees = { envoi: r.erreur === "hors-ligne" ? TEXTES_ORGANISER.erreurs.reseau : MESSAGES_SERVICE[r.erreur].texte };
    }
    setErreurs(trouvees);
    const premiere = Object.values(trouvees).find(Boolean);
    if (premiere) AccessibilityInfo.announceForAccessibility(premiere);
  }

  const erreurBas = erreurs.titre ?? erreurs.description ?? erreurs.quand ?? erreurs.lieuId ?? erreurs.public ?? erreurs.etiquettes ?? erreurs.places ?? erreurs.reglages ?? erreurs.envoi;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: couleurs.creme }} edges={["top", "bottom"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "web" ? undefined : "padding"} style={{ flex: 1 }}>
        <BarreEcranMiamis titre={TEXTES_ORGANISER.titre} grand icone="fermer" libelleRetour={TEXTES_ORGANISER.fermer} />
        <ScrollView className="flex-1" contentContainerClassName="px-5 pb-8 pt-2" keyboardShouldPersistTaps="handled">
          <SectionReglages titre={TEXTES_ORGANISER.avecQui}>
            <View className="pt-2">
              <ChoixAvecQui />
            </View>
          </SectionReglages>

          <SectionReglages titre={TEXTES_ORGANISER.pourQui}>
            <View className="pt-2">
              <ChoixPublicSortie
                choix={choix}
                tranche={tranche}
                profil={profil}
                onChoisir={(c) => {
                  setChoix(c);
                  effacer("public");
                }}
                onChoisirTranche={setTranche}
              />
            </View>
          </SectionReglages>

          <SectionReglages titre={TEXTES_ORGANISER.nom}>
            <View className="gap-4 pt-2">
              <ChampTexte
                libelle={TEXTES_ORGANISER.nom}
                valeur={titre}
                onChangeTexte={(t) => {
                  setTitre(t);
                  effacer("titre");
                }}
                placeholder={TEXTES_ORGANISER.nomPlaceholder}
                maxLength={LONGUEUR_MAX_TITRE_SORTIE}
                aide={`${titre.length}/${LONGUEUR_MAX_TITRE_SORTIE} caractères`}
                erreur={erreurs.titre}
              />
              <ChampTexte
                libelle={TEXTES_ORGANISER.description}
                mention={TEXTES_ORGANISER.descriptionMention}
                valeur={description}
                onChangeTexte={(t) => {
                  setDescription(t);
                  effacer("description");
                }}
                placeholder={TEXTES_ORGANISER.descriptionPlaceholder}
                maxLength={LONGUEUR_MAX_DESCRIPTION_SORTIE_MIAMIS}
                multiline
                aide={`${description.length}/${LONGUEUR_MAX_DESCRIPTION_SORTIE_MIAMIS} caractères`}
                erreur={erreurs.description}
              />
            </View>
          </SectionReglages>

          <SectionReglages titre={TEXTES_ORGANISER.etiquettes}>
            <View className="pt-2">
              <ChoixEtiquettesSortie
                etiquettes={etiquettes}
                onChanger={(e) => {
                  setEtiquettes(e);
                  effacer("etiquettes");
                }}
                erreur={erreurs.etiquettes}
              />
            </View>
          </SectionReglages>

          <SectionReglages titre={TEXTES_ORGANISER.quand}>
            <View className="pt-2">
              <ChoixQuandSortie
                quand={quand}
                onChanger={(date) => {
                  setQuand(date);
                  effacer("quand");
                }}
                jour={ecrireJourLong(quand)}
                heure={ecrireHeure(quand)}
                erreur={erreurs.quand}
              />
            </View>
          </SectionReglages>

          <SectionReglages titre={TEXTES_ORGANISER.ou}>
            <View className="pt-2">
              <ChoixLieuSortieMiamis
                lieu={lieu}
                onChoisir={(id) => {
                  setLieuId(id);
                  effacer("lieuId");
                }}
                erreur={erreurs.lieuId}
              />
            </View>
          </SectionReglages>

          <SectionReglages titre={TEXTES_ORGANISER.places}>
            <View className="flex-row items-center justify-between gap-3 pt-2">
              <Text className="flex-1 font-texte text-sm text-gris">{TEXTES_ORGANISER.placesNote}</Text>
              <CompteurPlusMoins
                libelle={TEXTES_ORGANISER.places}
                valeur={places}
                min={MIN_PLACES_SORTIE_MIAMIS}
                max={MAX_PLACES_SORTIE_MIAMIS}
                unite={(n) => `${n} places`}
                onChanger={setPlaces}
              />
            </View>
            <Interrupteur titre={TEXTES_ORGANISER.recurrente} detail={TEXTES_ORGANISER.recurrenteTexte} valeur={recurrente} onChanger={setRecurrente} />
            <Interrupteur titre={TEXTES_ORGANISER.placeNouveau} detail={TEXTES_ORGANISER.placeNouveauTexte} valeur={placeGardeePourNouveau} onChanger={setPlaceGardeePourNouveau} />
            <LigneToujoursActive titre={TEXTES_ORGANISER.accepteChaque} detail={TEXTES_ORGANISER.accepteChaqueTexte} />
            <Text className="pt-3 font-texte text-xs leading-4 text-gris">{lierPonctuation(TEXTES_ORGANISER.rappelNote)}</Text>
          </SectionReglages>
        </ScrollView>

        <View className="gap-3 border-t border-ligne bg-creme px-5 pb-4 pt-3">
          <RefusLimitationEnPlace texte={refusLimite} />
          {erreurBas ? (
            <Text className="overflow-hidden rounded-2xl bg-rose-alerte px-4 py-2.5 font-texte-semi text-sm leading-5 text-rouge-texte">{lierPonctuation(erreurBas)}</Text>
          ) : null}
          <Bouton libelle={envoi ? TEXTES_ORGANISER.envoi : TEXTES_ORGANISER.publier} variante="encre" desactive={envoi} onPress={() => void publier()} indice={TEXTES_ORGANISER.publierIndice} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
