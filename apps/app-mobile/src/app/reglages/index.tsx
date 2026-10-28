import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Linking, Platform, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ADRESSE_PAGE_PREVENTION } from "@sos-miam/commun/contenus/prevention-alcool";
import { LANGUES_OUVERTES_APP } from "@sos-miam/commun/regles/langues";
import { Annonce } from "~/composants/interface/Annonce";
import { EcranReglage } from "~/composants/reglages/EcranReglage";
import { ChoixApparence } from "~/composants/reglages/ChoixApparence";
import { ChoixLangue } from "~/composants/reglages/ChoixLangue";
import { Interrupteur } from "~/composants/interface/Interrupteur";
import { LigneReglage } from "~/composants/reglages/LigneReglage";
import { SectionReglages } from "~/composants/reglages/SectionReglages";
import { SectionTesDonnees } from "~/composants/reglages/SectionTesDonnees";
import { TEXTES_LANGUE_PAR_LANGUE } from "~/contenus/textes-langue";
import { TEXTES_PARAMETRES_PAR_LANGUE } from "~/contenus/textes-parametres";
import { TEXTES_REGLAGES_ACCUEIL_PAR_LANGUE } from "~/contenus/textes-reglages-accueil";
import { TEXTES_THEMES_SAISON_APP_PAR_LANGUE } from "~/contenus/textes-themes-saison-app";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import { utiliserEffacementLocal } from "~/hooks/utiliser-effacement-local";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import { utiliserSession } from "~/hooks/utiliser-session";
import { utiliserSourceSociale } from "~/hooks/utiliser-source-sociale";
import { utiliserSuivisPersonnes } from "~/hooks/utiliser-suivis-personnes";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import { utiliserThemesSaisonActifs } from "~/hooks/utiliser-themes-saison-actifs";
import { utiliserTheme } from "~/hooks/utiliser-theme";

const ADRESSE_CONTACT = "bonjour@sosmiam.fr";

/** Ouvre une page web ou l'appli Mail ; si le téléphone n'y arrive pas, on le dit gentiment (Alert n'existe pas sur le web). */
function ouvrirLien(adresse: string, textes: { lienRateTitre: string; lienRateTexte: (adresse: string) => string }) {
  Linking.openURL(adresse).catch(() => {
    if (Platform.OS !== "web") {
      Alert.alert(textes.lienRateTitre, textes.lienRateTexte(ADRESSE_CONTACT));
    }
  });
}

export default function Parametres() {
  const router = useRouter();
  const T = utiliserTextes(TEXTES_PARAMETRES_PAR_LANGUE);
  const TA = utiliserTextes(TEXTES_REGLAGES_ACCUEIL_PAR_LANGUE);
  const { reglage: reglageApparence } = utiliserTheme();
  const { reglage: reglageLangue } = utiliserLangue();
  const TL = utiliserTextes(TEXTES_LANGUE_PAR_LANGUE);
  const TS = utiliserTextes(TEXTES_THEMES_SAISON_APP_PAR_LANGUE);
  const [themesSaison, changerThemesSaison] = utiliserThemesSaisonActifs();
  const { profil } = utiliserProfil();
  const communaute = utiliserCommunaute();
  const suivisPersonnes = utiliserSuivisPersonnes();
  const effacement = utiliserEffacementLocal();
  const { connecte, compte, fermer } = utiliserSession();
  const sourceSociale = utiliserSourceSociale();
  const avecMessages = sourceSociale === "compte";
  const marges = useSafeAreaInsets();
  const [annonce, setAnnonce] = useState<{ texte: string; numero: number } | null>(null);
  const finAnnonce = useCallback(() => setAnnonce(null), []);
  const annoncer = useCallback((texte: string) => setAnnonce({ texte, numero: Date.now() }), []);
  if (!profil) return null;

  const nombreBloques = communaute.bloques.length;
  const detailBloques = !communaute.pret
    ? TA.bloquesEnLecture
    : nombreBloques === 0
      ? TA.bloquesAucun
      : TA.bloques(nombreBloques);

  // Avec un compte, l'écran règle aussi « Ta bande » (qui te trouve, ce que voit ta bande)
  const avecTaBande = suivisPersonnes.source === "compte";
  const detailConfidentialite = avecTaBande
    ? TA.confidentialiteAvecBande(suivisPersonnes.pret ? (suivisPersonnes.comptePrive ? T.securite.comptePrive : T.securite.comptePublic) : T.securite.compteEnLecture)
    : !suivisPersonnes.pret
      ? TA.confidentialiteEnLecture
      : suivisPersonnes.comptePrive
        ? TA.confidentialitePrive
        : TA.confidentialitePublic;

  const etatCompte = !suivisPersonnes.pret ? T.securite.compteEnLecture : suivisPersonnes.comptePrive ? T.securite.comptePrive : T.securite.comptePublic;
  const resumeSecurite = `${etatCompte} · ${communaute.pret ? T.securite.bloques(nombreBloques) : T.securite.bloquesEnLecture}`;

  const version = Constants.expoConfig?.version;
  const revenir = () => (router.canGoBack() ? router.back() : router.replace("/profil"));

  async function toutEffacer() {
    // Le téléphone oublie aussi le compte (il reste sur le serveur : on s'y reconnecte quand on veut)
    const fermerSession = connecte
      ? async () => {
          await fermer();
          return true;
        }
      : undefined;
    // Sans profil, l'app repart toute seule à la bienvenue ; un échec est dit (Alert n'existe pas sur le web)
    if (!(await effacement.toutEffacer(fermerSession)) && Platform.OS !== "web") {
      Alert.alert(TA.effacementRateTitre, TA.effacementRateTexte);
    }
  }

  function demanderEffacement() {
    // Sur le web (aperçu de développement), Alert n'existe pas : on efface directement
    if (Platform.OS === "web") return void toutEffacer();
    Alert.alert(TA.effacerTitre, TA.effacerTexte, [
      { text: TA.annuler, style: "cancel" },
      { text: TA.toutEffacer, style: "destructive", onPress: () => void toutEffacer() },
    ]);
  }

  return (
    <View className="flex-1 bg-creme">
      <EcranReglage titre={T.titre} sousTitre={T.sousTitre} libelleRetour={T.retour} onRetour={revenir}>
        <SectionReglages titre={T.compte.titre} section="parametres-compte" resume={connecte ? T.compte.resume : T.compte.resumeSansCompte}>
          {connecte ? (
            <LigneReglage
              emoji="🔑"
              titre={TA.monCompte}
              detail={compte ? TA.monCompteDetail(compte.email, compte.emailVerifie) : TA.monCompteDetailEnLecture}
              onPress={() => router.push("/reglages/compte")}
            />
          ) : null}
          <LigneReglage
            emoji="🔔"
            titre={TA.notifications}
            detail={TA.notificationsDetail}
            onPress={() => router.push("/reglages/notifications")}
          />
          {avecMessages ? (
            <LigneReglage emoji="💬" titre={TA.messages} detail={TA.messagesDetail} onPress={() => router.push("/reglages/messages")} />
          ) : null}
        </SectionReglages>

        <SectionReglages titre={T.apparence.titre} section="parametres-apparence" resume={T.apparence.resume[reglageApparence]}>
          <ChoixApparence />
          <Interrupteur emoji="🎃" titre={TS.reglageTitre} detail={TS.reglageDetail} valeur={themesSaison} onChanger={changerThemesSaison} />
        </SectionReglages>

        {LANGUES_OUVERTES_APP.length > 1 || __DEV__ ? (
          <SectionReglages titre={TL.titre} section="parametres-langue" resume={TL.resume[reglageLangue]}>
            <ChoixLangue apercu={!LANGUES_OUVERTES_APP.includes("en")} />
          </SectionReglages>
        ) : null}

        <SectionReglages titre={T.securite.titre} section="parametres-securite" resume={resumeSecurite}>
          <LigneReglage
            emoji="🔒"
            titre={avecTaBande ? TA.confidentialite : TA.comptePrive}
            detail={detailConfidentialite}
            onPress={() => router.push("/reglages/confidentialite")}
          />
          <LigneReglage emoji="🚫" titre={TA.personnesBloquees} detail={detailBloques} onPress={() => router.push("/reglages/personnes-bloquees")} />
          {connecte ? (
            <LigneReglage
              emoji="🧑‍⚖️"
              titre={TA.decisions}
              detail={TA.decisionsDetail}
              onPress={() => router.push("/reglages/decisions-moderation")}
            />
          ) : null}
        </SectionReglages>

        <SectionReglages titre={T.vie.titre} section="parametres-vie" resume={T.vie.resume}>
          <LigneReglage emoji="🎉" titre={T.vie.nouveautes} detail={T.vie.nouveautesDetail} onPress={() => router.push("/reglages/nouveautes")} />
          <LigneReglage emoji="💡" titre={T.vie.boiteIdees} detail={T.vie.boiteIdeesDetail} onPress={() => router.push("/potes/miamis/idees")} />
          <LigneReglage emoji="🧑‍🍳" titre={T.vie.onRecrute} detail={T.vie.onRecruteDetail} role="lien" onPress={() => ouvrirLien("https://sosmiam.fr/carriere", TA)} />
          <LigneReglage emoji="🐞" titre={T.vie.chasseAuxBugs} detail={T.vie.chasseAuxBugsDetail} role="lien" onPress={() => ouvrirLien("https://sosmiam.fr/securite", TA)} />
          <LigneReglage
            emoji="💌"
            titre={TA.nousEcrire}
            detail={TA.nousEcrireDetail(ADRESSE_CONTACT)}
            role="lien"
            onPress={() => ouvrirLien(`mailto:${ADRESSE_CONTACT}`, TA)}
          />
        </SectionReglages>

        <SectionReglages titre={T.aide.titre} section="parametres-aide" resume={T.aide.resume}>
          <LigneReglage
            emoji="🩺"
            titre={TA.sante}
            detail={TA.santeDetail}
            role="lien"
            onPress={() => ouvrirLien(ADRESSE_PAGE_PREVENTION, TA)}
          />
          <LigneReglage
            emoji="🔐"
            titre={TA.politiqueConfidentialite}
            detail={TA.politiqueConfidentialiteDetail}
            role="lien"
            onPress={() => ouvrirLien("https://sosmiam.fr/confidentialite", TA)}
          />
          <LigneReglage
            emoji="📜"
            titre={TA.conditions}
            detail={TA.conditionsDetail}
            role="lien"
            onPress={() => ouvrirLien("https://sosmiam.fr/cgu", TA)}
          />
          <LigneReglage
            emoji="⚖️"
            titre={TA.mentionsLegales}
            detail={TA.mentionsLegalesDetail}
            role="lien"
            onPress={() => ouvrirLien("https://sosmiam.fr/mentions-legales", TA)}
          />
        </SectionReglages>

        <SectionTesDonnees connecte={connecte} onEffacer={demanderEffacement} onAnnoncer={annoncer} />

        {version ? <Text className="text-center font-texte text-xs text-gris">{TA.version(version)}</Text> : null}
      </EcranReglage>
      <Annonce annonce={annonce} haut={marges.top + 60} onFin={finAnnonce} />
    </View>
  );
}
