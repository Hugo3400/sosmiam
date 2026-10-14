import { useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

import { EcranEtape } from "~/composants/inscription/EcranEtape";
import { Bouton } from "~/composants/interface/Bouton";
import { textesConnexionQr } from "~/contenus/connexion-qr";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserAttenteConnexionQr } from "~/hooks/utiliser-attente-connexion-qr";
import { montrerErreurCompte, utiliserEntreeCompte } from "~/hooks/utiliser-entree-compte";
import { utiliserServiceConnexionQr } from "~/hooks/utiliser-service-connexion-qr";
import { type ServiceConnexionQr, simulerConnexionQrDemo } from "~/services/demo/connexion-qr-demo";
import couleurs from "~/theme/couleurs";

const TAILLE_QR = 232;

/**
 * « Me connecter avec un QR code » (nouveau téléphone) : un QR à scanner avec un téléphone déjà connecté, renouvelé toutes
 * les 2 minutes. Une fois accepté de l'autre côté (confirmation, puis Face ID), ce téléphone entre dans le compte comme
 * après une connexion par e-mail.
 */
export default function ConnexionQr() {
  const { service, demo } = utiliserServiceConnexionQr();
  if (!service) {
    return (
      <EcranEtape titre={textesConnexionQr.titreAfficher} sousTitre="Ça arrive très bientôt ! En attendant, connecte-toi avec ton e-mail, Apple ou Google.">
        <View />
      </EcranEtape>
    );
  }
  return <AfficherQr service={service} demo={demo} />;
}

function AfficherQr({ service, demo }: { service: ServiceConnexionQr; demo: boolean }) {
  const { entrer } = utiliserEntreeCompte();
  const [finDemo, setFinDemo] = useState(false);
  const attente = utiliserAttenteConnexionQr(service, (ouverte) => {
    if (ouverte) void entrer(ouverte);
    else setFinDemo(true);
  });
  const { demande, etat } = attente;

  let contenu;
  if (etat === "chargement" || !demande) {
    contenu = (
      <View style={{ height: TAILLE_QR }} className="items-center justify-center">
        <ActivityIndicator color={couleurs.encre} accessibilityLabel="On prépare ton QR code" />
      </View>
    );
  } else if (etat === "attente") {
    contenu = (
      <View className="items-center gap-3">
        <View
          accessible
          accessibilityRole="image"
          accessibilityLabel="QR code de connexion : scanne-le avec ton téléphone déjà connecté"
          className="rounded-carte border-2 border-encre bg-white p-4"
        >
          <QRCode value={`https://sosmiam.fr/q/${demande.code}`} size={TAILLE_QR} color={couleurs.encre} backgroundColor="#FFFFFF" ecl="M" />
        </View>
        <Text className="font-texte text-sm text-gris">
          {attente.secondesRestantes > 0 ? `Valable encore ${attente.secondesRestantes} s · ${textesConnexionQr.renouvele}` : textesConnexionQr.renouvele}
        </Text>
      </View>
    );
  } else {
    const message =
      etat === "scanne"
        ? textesConnexionQr.scanne
        : etat === "accepte"
          ? finDemo
            ? "🧪 Démo : c'est accepté ! Sur un vrai téléphone, tu serais maintenant dans ton compte."
            : "C'est accepté ! On ouvre ton compte…"
          : etat === "refuse"
            ? textesConnexionQr.refuseAilleurs
            : etat === "expire"
              ? textesConnexionQr.expire
              : "Le QR code n'a pas pu être préparé. Réessaie dans un instant.";
    contenu = (
      <View className="items-center gap-4 rounded-carte border-2 border-encre bg-white p-5">
        <Text className="text-5xl">{etat === "scanne" ? "📲" : etat === "accepte" ? "🎉" : etat === "refuse" ? "🛑" : "⏱️"}</Text>
        <Text accessibilityLiveRegion="polite" className="text-center font-texte-gras text-base leading-6 text-encre">
          {lierPonctuation(message)}
        </Text>
        {etat === "scanne" || (etat === "accepte" && !finDemo) ? <ActivityIndicator color={couleurs.encre} /> : null}
        {etat === "refuse" || etat === "expire" || etat === "erreur" ? <Bouton libelle="Un nouveau QR code" onPress={() => void attente.nouvelle()} /> : null}
        {etat === "erreur" && attente.erreur ? <Bouton libelle="Pourquoi ?" variante="blanc" petit onPress={() => attente.erreur && montrerErreurCompte(attente.erreur)} /> : null}
      </View>
    );
  }

  return (
    <EcranEtape titre={textesConnexionQr.titreAfficher} sousTitre={textesConnexionQr.sousTitreAfficher}>
      <View className="gap-6">
        {contenu}
        <Text className="font-texte text-base leading-6 text-encre">{lierPonctuation(textesConnexionQr.aideAfficher)}</Text>
        {demo && demande && (etat === "attente" || etat === "scanne") ? (
          <View className="gap-3 rounded-2xl border-2 border-dashed border-ligne bg-white p-4">
            <Text className="font-texte-semi text-sm text-gris">🧪 Démo : joue l'autre téléphone</Text>
            <View className="flex-row flex-wrap gap-2">
              {etat === "attente" ? <Bouton libelle="Scanné" variante="blanc" petit onPress={() => simulerConnexionQrDemo(demande.secret, "scanne")} /> : null}
              <Bouton libelle="Accepté" variante="blanc" petit onPress={() => simulerConnexionQrDemo(demande.secret, "accepte")} />
              <Bouton libelle="Refusé" variante="blanc" petit onPress={() => simulerConnexionQrDemo(demande.secret, "refuse")} />
            </View>
          </View>
        ) : null}
      </View>
    </EcranEtape>
  );
}
