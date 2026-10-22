import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { MESSAGES_SERVICE } from "@sos-miam/commun/contenus/messages-services";
import type { QuiEstLaApi } from "@sos-miam/commun/types/communaute";
import type { MiamiPresent } from "@sos-miam/commun/types/qui-est-la";
import { RefusLimitationEnPlace } from "~/composants/compte/RefusLimitationEnPlace";
import { Annonce } from "~/composants/interface/Annonce";
import { BarreEcranMiamis } from "~/composants/miamis/BarreEcranMiamis";
import { ErreurMiamis } from "~/composants/miamis/ErreurMiamis";
import { EtatMiamis } from "~/composants/miamis/EtatMiamis";
import { CarteCoucouReciproque } from "~/composants/qui-est-la/CarteCoucouReciproque";
import { InterrupteurPresence } from "~/composants/qui-est-la/InterrupteurPresence";
import { LigneMiamiPresent } from "~/composants/qui-est-la/LigneMiamiPresent";
import { REFUS_LIMITATION_QUI_EST_LA, TEXTES_QUI_EST_LA } from "~/contenus/textes-qui-est-la";
import { ecrireHeureEspacee } from "~/fonctions/dates/ecrire-heure-espacee";
import { ecrireResultatAjoutQuiEstLa } from "~/fonctions/qui-est-la/ecrire-resultat-ajout-qui-est-la";
import { estVisibleEnCeMoment } from "~/fonctions/qui-est-la/est-visible-en-ce-moment";
import { trouverCoucouReciproque } from "~/fonctions/qui-est-la/trouver-coucou-reciproque";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserHorlogeMinute } from "~/hooks/utiliser-horloge-minute";
import { utiliserQuiEstLa } from "~/hooks/utiliser-qui-est-la";

const HEURE_MS = 3_600_000;

const ecrireHeureFin = (iso: string) => ecrireHeureEspacee(new Date(iso));

function decrirePresence(donnees: QuiEstLaApi, present: boolean): string {
  if (present && donnees.jusqua) return TEXTES_QUI_EST_LA.visibleJusqua(ecrireHeureFin(donnees.jusqua));
  return donnees.visible ? TEXTES_QUI_EST_LA.expire : TEXTES_QUI_EST_LA.invisible;
}

export function EcranQuiEstLa() {
  const couleurs = utiliserCouleurs();
  const router = useRouter();
  const marges = useSafeAreaInsets();
  const qui = utiliserQuiEstLa();
  const { maintenantMs } = utiliserHorlogeMinute();
  const [ecartes, setEcartes] = useState<ReadonlySet<string>>(new Set());
  const [refus, setRefus] = useState<string | null>(null);
  const [tire, setTire] = useState(false);
  const [annonce, setAnnonce] = useState<{ texte: string; numero: number } | null>(null);
  const finAnnonce = useCallback(() => setAnnonce(null), []);
  const annoncer = useCallback((texte: string) => setAnnonce({ texte, numero: Date.now() }), []);
  const { donnees } = qui;

  async function rafraichir() {
    setTire(true);
    await qui.relire();
    setTire(false);
  }

  async function changerVisibilite(visible: boolean) {
    const r = await qui.choisirVisibilite(visible);
    if (r.ok) {
      setRefus(null);
      annoncer(r.visible && r.jusqua ? TEXTES_QUI_EST_LA.annonceVisible(ecrireHeureFin(r.jusqua)) : TEXTES_QUI_EST_LA.annonceCache);
    } else if (r.erreur === "compte-limite") setRefus(REFUS_LIMITATION_QUI_EST_LA.apparaitre);
    else if (r.erreur !== "ville-requise") annoncer(visible ? TEXTES_QUI_EST_LA.montrerRate : TEXTES_QUI_EST_LA.cacherRate);
  }

  async function faireCoucou(present: MiamiPresent) {
    const pseudo = present.personne.pseudo;
    const r = await qui.envoyerCoucou(present.personne);
    if (r.ok) {
      setRefus(null);
      annoncer(r.coucou === "reciproque" ? TEXTES_QUI_EST_LA.coucouMutuel(pseudo) : TEXTES_QUI_EST_LA.coucouParti(pseudo));
    } else if (r.erreur === "compte-limite") setRefus(REFUS_LIMITATION_QUI_EST_LA.coucou);
    else if (r.erreur === "invisible-ici") annoncer(TEXTES_QUI_EST_LA.invisiblePourCoucou);
    else if (r.erreur === "personne-inconnue" || r.erreur === "introuvable") annoncer(TEXTES_QUI_EST_LA.partiEntreTemps(pseudo));
    else annoncer(TEXTES_QUI_EST_LA.coucouRate);
  }

  async function ajouter(present: MiamiPresent) {
    const resultat = await qui.ajouterABande(present.personne);
    annoncer(ecrireResultatAjoutQuiEstLa(resultat, present.personne.pseudo));
  }

  const ecarter = (id: string) => setEcartes((avant) => new Set(avant).add(id));
  const villeManquante = qui.erreur === "ville-requise" || (donnees !== null && donnees.ville === null);
  const ville = MESSAGES_SERVICE["ville-requise"];

  function rendreContenu() {
    if (villeManquante) {
      return <EtatMiamis emoji={ville.emoji} titre={ville.titre} texte={ville.texte} action={{ libelle: TEXTES_QUI_EST_LA.villeAction, onPress: () => router.push("/reglages/infos") }} />;
    }
    if (!donnees) {
      if (qui.erreur) return <ErreurMiamis erreur={qui.erreur} onReessayer={() => void qui.relire()} />;
      return <ActivityIndicator color={couleurs.encre} className="mt-10" />;
    }
    const present = estVisibleEnCeMoment(donnees.visible, donnees.jusqua, maintenantMs);
    const prolongeable = present && donnees.jusqua !== null && Date.parse(donnees.jusqua) - maintenantMs < HEURE_MS;
    const reciproque = trouverCoucouReciproque(donnees.presents, ecartes, (id) => !qui.demandeesIci.has(id) && qui.estDemande(id));

    return (
      <>
        <Text className="font-texte text-sm leading-5 text-gris">{lierPonctuation(TEXTES_QUI_EST_LA.intro(donnees.ville ?? ""))}</Text>
        <InterrupteurPresence valeur={present} detail={decrirePresence(donnees, present)} enCours={qui.visibiliteEnCours} onChanger={(v) => void changerVisibilite(v)} />
        {prolongeable && !qui.visibiliteEnCours ? (
          <Pressable accessibilityRole="button" onPress={() => void changerVisibilite(true)} className="-mt-2 min-h-11 justify-center self-start active:opacity-70">
            <Text className="font-texte-gras text-sm text-encre underline">{TEXTES_QUI_EST_LA.prolonger}</Text>
          </Pressable>
        ) : null}
        <RefusLimitationEnPlace texte={refus} />
        {reciproque ? (
          <CarteCoucouReciproque
            pseudo={reciproque.personne.pseudo}
            demande={qui.demandeesIci.has(reciproque.personne.id)}
            enCours={qui.ajoutEnCours === reciproque.personne.id}
            onAjouter={() => void ajouter(reciproque)}
            onFermer={() => ecarter(reciproque.personne.id)}
          />
        ) : null}
        {donnees.presents.length === 0 ? (
          <EtatMiamis emoji="🦗" titre={TEXTES_QUI_EST_LA.videTitre} texte={present ? TEXTES_QUI_EST_LA.vide : TEXTES_QUI_EST_LA.videInvisible} />
        ) : (
          <View className="gap-2.5">
            <Text accessibilityRole="header" className="font-titre-gras text-lg text-encre">
              {TEXTES_QUI_EST_LA.enCeMoment(Math.max(donnees.total, donnees.presents.length))}
            </Text>
            {present ? null : <Text className="font-texte text-sm leading-5 text-gris">{lierPonctuation(TEXTES_QUI_EST_LA.invisiblePourCoucou)}</Text>}
            {donnees.presents.map((p) => (
              <LigneMiamiPresent
                key={p.personne.id}
                present={p}
                coucouPossible={present}
                enCours={qui.coucouEnCours === p.personne.id || qui.ajoutEnCours === p.personne.id}
                demande={qui.estDemande(p.personne.id)}
                onCoucou={() => void faireCoucou(p)}
                onAjouter={() => void ajouter(p)}
                onOuvrirSortie={(id) => router.push({ pathname: "/potes/miamis/sortie/[id]", params: { id } })}
              />
            ))}
          </View>
        )}
        <Text className="font-texte text-xs leading-4 text-gris">{lierPonctuation(TEXTES_QUI_EST_LA.viePrivee)}</Text>
      </>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: couleurs.creme }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <BarreEcranMiamis titre={TEXTES_QUI_EST_LA.titre} grand />
        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-4 px-5 pb-10 pt-2"
          refreshControl={donnees ? <RefreshControl refreshing={tire} onRefresh={() => void rafraichir()} tintColor={couleurs.encre} /> : undefined}
        >
          {rendreContenu()}
        </ScrollView>
      </SafeAreaView>
      <Annonce annonce={annonce} haut={marges.top + 64} onFin={finAnnonce} />
    </View>
  );
}
