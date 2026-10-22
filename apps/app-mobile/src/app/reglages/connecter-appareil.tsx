import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Platform, Text, View } from "react-native";

import { MESSAGES_SERVICE } from "@sos-miam/commun/contenus/messages-services";
import { CarteDemandeConnexion } from "~/composants/compte/CarteDemandeConnexion";
import { Bouton } from "~/composants/interface/Bouton";
import { ChampTexte } from "~/composants/interface/ChampTexte";
import { ScannerQrCode } from "~/composants/potes/ScannerQrCode";
import { EcranReglage } from "~/composants/reglages/EcranReglage";
import { textesConnexionQr } from "~/contenus/connexion-qr";
import { annoncerLecteurEcran } from "~/fonctions/interaction/annoncer-lecteur-ecran";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { retirerEmoji } from "~/fonctions/texte/retirer-emoji";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { type ServiceConnexionQr, utiliserServiceConnexionQr } from "~/hooks/utiliser-service-connexion-qr";
import { type EtapeValidationQr, utiliserValidationConnexionQr } from "~/hooks/utiliser-validation-connexion-qr";

/**
 * « Connecter un appareil » (Mon compte, ou un lien sosmiam.fr/q/… ouvert dans l'app) : scanner le QR d'un ordinateur ou
 * d'un nouveau téléphone, vérifier qui demande et d'où, puis confirmer avec Face ID, l'empreinte ou le code du téléphone.
 */
export default function ConnecterAppareil() {
  const { service, demo } = utiliserServiceConnexionQr();
  const { code } = useLocalSearchParams<{ code?: string }>();
  return <ValidationConnexion service={service} demo={demo} code={code} />;
}

/** La fin du parcours : titre, emoji (à part, caché aux lecteurs d'écran) et texte ; null tant que ce n'est pas fini */
function lireFin(etape: EtapeValidationQr, demo: boolean): { titre: string; emoji: string; texte: string } | null {
  if (etape.type === "fait")
    return demo ? { titre: "C'est accepté (en démo) !", emoji: "🧪", texte: textesConnexionQr.faitDemo } : { titre: "C'est connecté !", emoji: "🎉", texte: textesConnexionQr.fait(etape.appareil) };
  if (etape.type === "refuse") return { titre: "Refusé", emoji: "🛑", texte: textesConnexionQr.refuse };
  if (etape.type === "lien-refuse") return { titre: "Personne n'entre", emoji: "🛡️", texte: textesConnexionQr.lienRefuse };
  if (etape.type === "expire") return { titre: "Trop tard", emoji: "⏱️", texte: textesConnexionQr.expire };
  if (etape.type !== "erreur") return null;
  // Un autre refus de l'API (scanné par un autre compte, déjà répondu, trop d'essais…) : son propre texte
  const erreur = MESSAGES_SERVICE[etape.erreur];
  return { titre: erreur?.titre ?? "Oups", emoji: erreur?.emoji ?? "😕", texte: erreur?.texte ?? "Ça n'a pas marché cette fois. Réessaie dans un instant." };
}

function ValidationConnexion({ service, demo, code }: { service: ServiceConnexionQr; demo: boolean; code?: string }) {
  const couleurs = utiliserCouleurs();
  const router = useRouter();
  const validation = utiliserValidationConnexionQr(service, code);
  const { etape } = validation;
  const [lienColle, setLienColle] = useState("");
  const fin = lireFin(etape, demo);
  // Toujours vers Mon compte : celui d'en dessous s'il y est, sinon il remplace cet écran (les onglets restent dessous)
  const revenirAuCompte = () => router.dismissTo("/reglages/compte");

  // VoiceOver ne lit pas les zones « live » : chaque étape qui change sur place se dit à voix haute
  const annonce = fin
    ? `${fin.titre}. ${fin.texte}`
    : etape.type === "confirmer"
      ? `Vérifie bien avant de dire oui : quelqu'un veut se connecter à ton compte sur ${etape.demande.appareil}.`
      : etape.type === "scanner"
        ? etape.souci
        : null;
  useEffect(() => {
    if (annonce) annoncerLecteurEcran(retirerEmoji(annonce));
  }, [annonce]);

  // Démo : le rappel reste là jusqu'au bout (la demande montrée est inventée, rien ne se connecte)
  const bandeauDemo = demo ? (
    <Text className="rounded-2xl bg-jaune-clair px-4 py-2 font-texte-semi text-sm text-encre">
      {lierPonctuation("🧪 Démo : rien ne part sur le serveur, aucun appareil n'est vraiment connecté.")}
    </Text>
  ) : null;

  // Un lien ouvert dans l'app : l'appareil photo du téléphone… ou un escroc qui l'a envoyé. Rien ne part avant ce choix
  if (etape.type === "lien") {
    return (
      <EcranReglage titre={textesConnexionQr.titreLien}>
        <View className="gap-5">
          {bandeauDemo}
          <View className="flex-row gap-3 rounded-2xl border-2 border-rouge-texte bg-carte px-4 py-3">
            <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-xl">
              ⚠️
            </Text>
            <Text className="flex-1 font-texte-semi text-base leading-6 text-encre">{lierPonctuation(textesConnexionQr.texteLien)}</Text>
          </View>
          <Bouton libelle={textesConnexionQr.refuserLien} onPress={validation.refuserLien} />
          <Bouton libelle={textesConnexionQr.continuerLien} variante="blanc" onPress={validation.continuerLien} />
        </View>
      </EcranReglage>
    );
  }

  if (etape.type === "confirmer") {
    return (
      <EcranReglage titre="Vérifie bien avant de dire oui" sousTitre="Une connexion, c'est l'accès à tout ton compte.">
        <View className="gap-5">
          {bandeauDemo}
          <CarteDemandeConnexion
            demande={etape.demande}
            secondesRestantes={validation.secondesRestantes}
            envoi={etape.envoi}
            souci={etape.souci}
            onRefuser={() => void validation.refuser()}
            onAccepter={() => void validation.accepter()}
          />
        </View>
      </EcranReglage>
    );
  }

  if (fin) {
    return (
      <EcranReglage titre={fin.titre}>
        <View className="gap-5">
          {bandeauDemo}
          <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-5xl">
            {fin.emoji}
          </Text>
          <Text className="font-texte text-base leading-6 text-encre">{lierPonctuation(fin.texte)}</Text>
          {etape.type !== "fait" ? <Bouton libelle="Scanner un autre QR" onPress={validation.recommencer} /> : null}
          <Bouton libelle="Revenir à Mon compte" variante="blanc" onPress={revenirAuCompte} />
        </View>
      </EcranReglage>
    );
  }

  return (
    <EcranReglage titre={textesConnexionQr.titreScanner} sousTitre={textesConnexionQr.sousTitreScanner}>
      <View className="gap-5">
        {bandeauDemo}
        {textesConnexionQr.etapesScanner.map((texte, i) => (
          <View key={texte} className="flex-row gap-3">
            <Text className="font-titre text-xl text-encre">{i + 1}.</Text>
            <Text className="flex-1 font-texte text-base leading-6 text-encre">{lierPonctuation(texte)}</Text>
          </View>
        ))}
        {etape.type === "lecture" ? (
          <ActivityIndicator color={couleurs.encre} accessibilityLabel="On lit le QR code" />
        ) : (
          <ScannerQrCode pour="appareil" onOuvrir={validation.recommencer} onLu={(texte) => void validation.lire(texte)} />
        )}
        {etape.type === "scanner" && etape.souci ? <Text className="font-texte text-sm leading-5 text-encre">{lierPonctuation(etape.souci)}</Text> : null}
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
