import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { FlatList, RefreshControl, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import type { IdeeMiamis, NouvelleIdee } from "@sos-miam/commun/types/idees";
import { CarteIdee } from "~/composants/idees-miamis/CarteIdee";
import { CarteIdeeDuMois } from "~/composants/idees-miamis/CarteIdeeDuMois";
import { ChargementIdees } from "~/composants/idees-miamis/ChargementIdees";
import { FeuilleProposerIdee } from "~/composants/idees-miamis/FeuilleProposerIdee";
import { FiltresIdees } from "~/composants/idees-miamis/FiltresIdees";
import { Annonce } from "~/composants/interface/Annonce";
import { Bouton } from "~/composants/interface/Bouton";
import { BarreEcranMiamis } from "~/composants/miamis/BarreEcranMiamis";
import { ErreurMiamis } from "~/composants/miamis/ErreurMiamis";
import { EtatMiamis } from "~/composants/miamis/EtatMiamis";
import { TEXTES_IDEES_PAR_LANGUE, type FiltreIdees } from "~/contenus/textes-idees";
import { expliquerGesteRateIdee } from "~/fonctions/idees-miamis/expliquer-geste-rate-idee";
import { trierIdees } from "~/fonctions/idees-miamis/trier-idees";
import { trouverIdeeDuMois } from "~/fonctions/idees-miamis/trouver-idee-du-mois";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserIdeesMiamis } from "~/hooks/utiliser-idees-miamis";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserMonId } from "~/hooks/utiliser-mon-id";
import { utiliserTextes } from "~/hooks/utiliser-textes";

const AUCUNE_IDEE: IdeeMiamis[] = [];

export function EcranBoiteIdees() {
  const { langue } = utiliserLangue();
  const T = utiliserTextes(TEXTES_IDEES_PAR_LANGUE);
  const videParFiltre: Readonly<Record<FiltreIdees, string>> = {
    top: T.aucune,
    nouvelles: T.aucune,
    prevues: T.aucunePrevue,
    faites: T.aucuneFaite,
  };
  const couleurs = utiliserCouleurs();
  const router = useRouter();
  const marges = useSafeAreaInsets();
  const monId = utiliserMonId();
  const { idees, chargement, erreur, envoi, votesEnCours, relire, voter, proposer } = utiliserIdeesMiamis();
  const [filtre, setFiltre] = useState<FiltreIdees>("top");
  const [feuille, setFeuille] = useState(false);
  const [tire, setTire] = useState(false);
  const [annonce, setAnnonce] = useState<{ texte: string; numero: number } | null>(null);
  const finAnnonce = useCallback(() => setAnnonce(null), []);
  const annoncer = useCallback((texte: string) => setAnnonce({ texte, numero: Date.now() }), []);

  const triees = useMemo(() => (idees ? trierIdees(idees, filtre) : []), [idees, filtre]);
  const ideeDuMois = useMemo(() => (idees ? trouverIdeeDuMois(idees) : null), [idees]);

  const ouvrir = useCallback((id: string) => router.push({ pathname: "/potes/miamis/idee/[id]", params: { id } }), [router]);
  const revenir = () => (router.canGoBack() ? router.back() : router.replace("/reglages"));

  const voterIdee = useCallback(
    async (id: string, oui: boolean) => {
      const rate = await voter(id, oui);
      if (rate) annoncer(expliquerGesteRateIdee(rate, "vote", langue));
    },
    [voter, annoncer, langue],
  );

  async function rafraichir() {
    setTire(true);
    await relire();
    setTire(false);
  }

  async function proposerIdee(nouvelle: NouvelleIdee, cle: string): Promise<ErreurService | null> {
    const rate = await proposer(nouvelle, cle);
    if (rate) return rate;
    setFeuille(false);
    setFiltre("nouvelles");
    annoncer(T.merci);
    return null;
  }

  async function voterDoublon(idee: IdeeMiamis) {
    setFeuille(false);
    const rate = await voter(idee.id, true);
    annoncer(rate ? expliquerGesteRateIdee(rate, "vote", langue) : T.voteDoublon);
  }

  function voirDoublon(idee: IdeeMiamis) {
    setFeuille(false);
    ouvrir(idee.id);
  }

  const enTete = (
    <View className="gap-3.5 pb-3.5">
      <Text className="font-texte text-sm leading-5 text-gris">{lierPonctuation(T.intro)}</Text>
      {ideeDuMois ? <CarteIdeeDuMois idee={ideeDuMois} onOuvrir={() => ouvrir(ideeDuMois.id)} /> : null}
      <Bouton libelle={T.proposer} onPress={() => setFeuille(true)} />
      <FiltresIdees filtre={filtre} onChoisir={setFiltre} />
    </View>
  );

  const vide =
    idees && idees.length === 0 ? (
      <EtatMiamis emoji="💡" titre={T.aucuneTitre} texte={T.aucune} action={{ libelle: T.proposer, onPress: () => setFeuille(true) }} />
    ) : (
      <EtatMiamis emoji="🗂️" titre={T.aucuneFiltreTitre} texte={videParFiltre[filtre]} />
    );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: couleurs.creme }} edges={["top"]}>
      <BarreEcranMiamis titre={T.titre} grand libelleRetour={T.retour} onRetour={revenir} />
      {idees === null && erreur ? (
        <View className="px-5 pt-6">
          <ErreurMiamis erreur={erreur} onReessayer={() => void relire()} />
        </View>
      ) : idees === null ? (
        chargement ? <ChargementIdees texte={T.chargement} /> : null
      ) : (
        <FlatList
          data={triees}
          keyExtractor={(idee) => idee.id}
          renderItem={({ item }) => (
            <CarteIdee
              idee={item}
              monId={monId}
              occupe={votesEnCours.has(item.id)}
              onVoter={(oui) => void voterIdee(item.id, oui)}
              onOuvrir={() => ouvrir(item.id)}
            />
          )}
          ItemSeparatorComponent={() => <View className="h-2.5" />}
          ListHeaderComponent={enTete}
          ListEmptyComponent={vide}
          refreshControl={<RefreshControl refreshing={tire} onRefresh={() => void rafraichir()} tintColor={couleurs.encre} colors={[couleurs.encre]} progressBackgroundColor={couleurs.carte} />}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: marges.bottom + 24 }}
          keyboardShouldPersistTaps="handled"
        />
      )}
      <FeuilleProposerIdee
        visible={feuille}
        idees={idees ?? AUCUNE_IDEE}
        envoi={envoi}
        onFermer={() => setFeuille(false)}
        onProposer={proposerIdee}
        onVoterDoublon={(idee) => void voterDoublon(idee)}
        onVoirDoublon={voirDoublon}
      />
      <Annonce annonce={annonce} haut={marges.top + 8} onFin={finAnnonce} />
    </SafeAreaView>
  );
}
