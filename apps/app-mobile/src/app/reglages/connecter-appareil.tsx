import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Platform, Text, View } from "react-native";

import { CarteDemandeConnexion } from "~/composants/compte/CarteDemandeConnexion";
import { Bouton } from "~/composants/interface/Bouton";
import { ChampTexte } from "~/composants/interface/ChampTexte";
import { ScannerQrCode } from "~/composants/potes/ScannerQrCode";
import { EcranReglage } from "~/composants/reglages/EcranReglage";
import { textesConnexionQr } from "~/contenus/connexion-qr";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { montrerErreurCompte } from "~/hooks/utiliser-entree-compte";
import { utiliserServiceConnexionQr } from "~/hooks/utiliser-service-connexion-qr";
import { utiliserValidationConnexionQr } from "~/hooks/utiliser-validation-connexion-qr";
import type { ServiceConnexionQr } from "~/services/demo/connexion-qr-demo";
import couleurs from "~/theme/couleurs";

/**
 * « Connecter un appareil » (Mon compte, ou un lien sosmiam.fr/q/… ouvert dans l'app) : scanner le QR d'un ordinateur ou
 * d'un nouveau téléphone, vérifier qui demande et d'où, puis confirmer avec Face ID, l'empreinte ou le code du téléphone.
 */
export default function ConnecterAppareil() {
  const { service, demo } = utiliserServiceConnexionQr();
  const { code } = useLocalSearchParams<{ code?: string }>();
  if (!service) {
    return (
      <EcranReglage titre={textesConnexionQr.titreScanner} sousTitre="Ça arrive très bientôt : encore un peu de patience !">
        <View />
      </EcranReglage>
    );
  }
  return <ValidationConnexion service={service} demo={demo} code={code} />;
}

function ValidationConnexion({ service, demo, code }: { service: ServiceConnexionQr; demo: boolean; code?: string }) {
  const router = useRouter();
  const validation = utiliserValidationConnexionQr(service, code);
  const { etape } = validation;
  const [lienColle, setLienColle] = useState("");

  if (etape.type === "confirmer") {
    return (
      <EcranReglage titre="Vérifie bien avant de dire oui" sousTitre="Une connexion, c'est l'accès à tout ton compte.">
        <CarteDemandeConnexion
          demande={etape.demande}
          secondesRestantes={validation.secondesRestantes}
          envoi={etape.envoi}
          souci={etape.souci}
          onRefuser={() => void validation.refuser()}
          onAccepter={() => void validation.accepter()}
        />
      </EcranReglage>
    );
  }

  if (etape.type === "fait" || etape.type === "refuse" || etape.type === "expire" || etape.type === "erreur") {
    const titre = etape.type === "fait" ? "C'est connecté ! 🎉" : etape.type === "refuse" ? "Refusé 🛑" : etape.type === "expire" ? "Trop tard ⏱️" : "Oups 😕";
    const texte =
      etape.type === "fait"
        ? textesConnexionQr.fait(etape.appareil)
        : etape.type === "refuse"
          ? textesConnexionQr.refuse
          : etape.type === "expire"
            ? textesConnexionQr.expire
            : "Ça n'a pas marché cette fois. Réessaie dans un instant.";
    return (
      <EcranReglage titre={titre}>
        <View className="gap-5">
          <Text className="font-texte text-base leading-6 text-encre">{lierPonctuation(texte)}</Text>
          {etape.type === "erreur" ? <Bouton libelle="Pourquoi ?" variante="blanc" petit onPress={() => montrerErreurCompte(etape.erreur)} /> : null}
          {etape.type !== "fait" ? <Bouton libelle="Scanner un autre QR" onPress={validation.recommencer} /> : null}
          <Bouton libelle="Revenir à Mon compte" variante="blanc" onPress={() => router.back()} />
        </View>
      </EcranReglage>
    );
  }

  return (
    <EcranReglage titre={textesConnexionQr.titreScanner} sousTitre={textesConnexionQr.sousTitreScanner}>
      <View className="gap-5">
        {demo ? (
          <Text className="rounded-2xl bg-jaune-clair px-4 py-2 font-texte-semi text-sm text-encre">
            {lierPonctuation("🧪 Démo : rien ne part sur le serveur, aucun appareil n'est vraiment connecté.")}
          </Text>
        ) : null}
        {textesConnexionQr.etapesScanner.map((texte, i) => (
          <View key={texte} className="flex-row gap-3">
            <Text className="font-titre text-xl text-encre">{i + 1}.</Text>
            <Text className="flex-1 font-texte text-base leading-6 text-encre">{lierPonctuation(texte)}</Text>
          </View>
        ))}
        {etape.type === "lecture" ? (
          <ActivityIndicator color={couleurs.encre} accessibilityLabel="On lit le QR code" />
        ) : (
          <ScannerQrCode pour="appareil" onLu={(texte) => void validation.lire(texte)} />
        )}
        {etape.type === "scanner" && etape.souci ? (
          <Text accessibilityLiveRegion="polite" className="font-texte text-sm leading-5 text-encre">
            {lierPonctuation(etape.souci)}
          </Text>
        ) : null}
        {/* Aperçu web : pas d'appareil photo, on colle le lien du QR */}
        {Platform.OS === "web" ? (
          <View className="gap-3">
            <ChampTexte libelle="Le lien du QR" valeur={lienColle} onChangeTexte={setLienColle} autoCapitalize="none" autoCorrect={false} />
            <Bouton libelle="Lire ce lien" variante="blanc" petit desactive={lienColle.trim() === ""} onPress={() => void validation.lire(lienColle)} />
          </View>
        ) : null}
      </View>
    </EcranReglage>
  );
}
