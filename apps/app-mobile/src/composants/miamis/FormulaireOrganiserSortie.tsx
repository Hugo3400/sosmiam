import * as Crypto from "expo-crypto";
import { useRouter } from "expo-router";
import { useState } from "react";
import { AccessibilityInfo, KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { MESSAGES_SERVICE_PAR_LANGUE } from "@sos-miam/commun/contenus/messages-services";
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
import { REFUS_LIMITATION_PAR_LANGUE } from "~/contenus/limitation-compte";
import { TEXTES_ECRANS_MIAMIS_PAR_LANGUE } from "~/contenus/textes-ecrans-miamis";
import { REFUS_ETIQUETTE_PAR_LANGUE } from "~/contenus/textes-etiquettes";
import { TEXTES_ORGANISER_PAR_LANGUE, type ChoixPublicSortie as ChoixPublic } from "~/contenus/textes-sorties-miamis";
import { ecrireHeureLangue } from "~/fonctions/langue/ecrire-heure-langue";
import { ecrireJourLongLangue } from "~/fonctions/langue/ecrire-jour-long-langue";
import { construirePublicSortie } from "~/fonctions/miamis/construire-public-sortie";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserGesteCommunaute } from "~/hooks/utiliser-geste-communaute";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserLieux } from "~/hooks/utiliser-lieux";
import { utiliserProfilVisibiliteMiamis } from "~/hooks/utiliser-profil-visibilite-miamis";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Erreurs = Partial<Record<ChampNouvelleSortieMiamis | "envoi", string>>;

const demainSoir = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(20, 0, 0, 0);
  return date;
};

export function FormulaireOrganiserSortie() {
  const TE = utiliserTextes(TEXTES_ECRANS_MIAMIS_PAR_LANGUE);
  const T = utiliserTextes(TEXTES_ORGANISER_PAR_LANGUE);
  const { langue } = utiliserLangue();
  const messagesService = utiliserTextes(MESSAGES_SERVICE_PAR_LANGUE);
  const refusLimitation = utiliserTextes(REFUS_LIMITATION_PAR_LANGUE);
  const refusEtiquette = utiliserTextes(REFUS_ETIQUETTE_PAR_LANGUE);
  const couleurs = utiliserCouleurs();
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
          ? T.erreurs.titreMot
          : lue.champ === "etiquettes" && lue.raison && lue.raison !== "mot-interdit"
            ? refusEtiquette[lue.raison]
            : T.erreurs[lue.champ];
      trouvees = { [lue.champ]: texte };
    } else if (!peutOrganiserPourPublic(lue.sortie.public, profil)) trouvees = { public: T.erreurs.public };
    else {
      const r = await agir("creer", (s) => s.creerSortie(lue.sortie, cle));
      if (r.ok) {
        router.replace({ pathname: "/potes/miamis/sortie/[id]", params: { id: r.reponse.sortie.id } });
        return;
      }
      if (r.erreur === "compte-limite") setRefusLimite(refusLimitation.sortie);
      else trouvees = { envoi: r.erreur === "hors-ligne" ? T.erreurs.reseau : messagesService[r.erreur].texte };
    }
    setErreurs(trouvees);
    const premiere = Object.values(trouvees).find(Boolean);
    if (premiere) AccessibilityInfo.announceForAccessibility(premiere);
  }

  const erreurBas = erreurs.titre ?? erreurs.description ?? erreurs.quand ?? erreurs.lieuId ?? erreurs.public ?? erreurs.etiquettes ?? erreurs.places ?? erreurs.reglages ?? erreurs.envoi;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: couleurs.creme }} edges={["top", "bottom"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "web" ? undefined : "padding"} style={{ flex: 1 }}>
        <BarreEcranMiamis titre={T.titre} grand icone="fermer" libelleRetour={T.fermer} />
        <ScrollView className="flex-1" contentContainerClassName="px-5 pb-8 pt-2" keyboardShouldPersistTaps="handled">
          <SectionReglages titre={T.avecQui}>
            <View className="pt-2">
              <ChoixAvecQui />
            </View>
          </SectionReglages>

          <SectionReglages titre={T.pourQui}>
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

          <SectionReglages titre={T.nom}>
            <View className="gap-4 pt-2">
              <ChampTexte
                libelle={T.nom}
                valeur={titre}
                onChangeTexte={(t) => {
                  setTitre(t);
                  effacer("titre");
                }}
                placeholder={T.nomPlaceholder}
                maxLength={LONGUEUR_MAX_TITRE_SORTIE}
                aide={TE.caracteres(titre.length, LONGUEUR_MAX_TITRE_SORTIE)}
                erreur={erreurs.titre}
              />
              <ChampTexte
                libelle={T.description}
                mention={T.descriptionMention}
                valeur={description}
                onChangeTexte={(t) => {
                  setDescription(t);
                  effacer("description");
                }}
                placeholder={T.descriptionPlaceholder}
                maxLength={LONGUEUR_MAX_DESCRIPTION_SORTIE_MIAMIS}
                multiline
                aide={TE.caracteres(description.length, LONGUEUR_MAX_DESCRIPTION_SORTIE_MIAMIS)}
                erreur={erreurs.description}
              />
            </View>
          </SectionReglages>

          <SectionReglages titre={T.etiquettes}>
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

          <SectionReglages titre={T.quand}>
            <View className="pt-2">
              <ChoixQuandSortie
                quand={quand}
                onChanger={(date) => {
                  setQuand(date);
                  effacer("quand");
                }}
                jour={ecrireJourLongLangue(quand, langue)}
                heure={ecrireHeureLangue(quand, langue)}
                erreur={erreurs.quand}
              />
            </View>
          </SectionReglages>

          <SectionReglages titre={T.ou}>
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

          <SectionReglages titre={T.places}>
            <View className="flex-row items-center justify-between gap-3 pt-2">
              <Text className="flex-1 font-texte text-sm text-gris">{T.placesNote}</Text>
              <CompteurPlusMoins
                libelle={T.places}
                valeur={places}
                min={MIN_PLACES_SORTIE_MIAMIS}
                max={MAX_PLACES_SORTIE_MIAMIS}
                unite={TE.nombrePlaces}
                onChanger={setPlaces}
              />
            </View>
            <Interrupteur titre={T.recurrente} detail={T.recurrenteTexte} valeur={recurrente} onChanger={setRecurrente} />
            <Interrupteur titre={T.placeNouveau} detail={T.placeNouveauTexte} valeur={placeGardeePourNouveau} onChanger={setPlaceGardeePourNouveau} />
            <LigneToujoursActive titre={T.accepteChaque} detail={T.accepteChaqueTexte} />
            <Text className="pt-3 font-texte text-xs leading-4 text-gris">{lierPonctuation(T.rappelNote)}</Text>
          </SectionReglages>
        </ScrollView>

        <View className="gap-3 border-t border-ligne bg-creme px-5 pb-4 pt-3">
          <RefusLimitationEnPlace texte={refusLimite} />
          {erreurBas ? (
            <Text className="overflow-hidden rounded-2xl bg-rose-alerte px-4 py-2.5 font-texte-semi text-sm leading-5 text-rouge-texte">{lierPonctuation(erreurBas)}</Text>
          ) : null}
          <Bouton libelle={envoi ? T.envoi : T.publier} variante="encre" desactive={envoi} onPress={() => void publier()} indice={T.publierIndice} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
