import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

import type { SessionOuverte } from "@sos-miam/commun/client-api/contrat-compte";
import { EcranEtape } from "~/composants/inscription/EcranEtape";
import { Bouton } from "~/composants/interface/Bouton";
import { textesConnexionQr } from "~/contenus/connexion-qr";
import { annoncerLecteurEcran } from "~/fonctions/interaction/annoncer-lecteur-ecran";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { retirerEmoji } from "~/fonctions/texte/retirer-emoji";
import { type EtatAffichageQr, utiliserAttenteConnexionQr } from "~/hooks/utiliser-attente-connexion-qr";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { montrerErreurCompte, utiliserEntreeCompte } from "~/hooks/utiliser-entree-compte";
import { type ServiceConnexionQr, utiliserServiceConnexionQr } from "~/hooks/utiliser-service-connexion-qr";
import { simulerConnexionQrDemo } from "~/services/demo/connexion-qr-demo";

const TAILLE_QR = 232;

/** Le gros emoji de chaque état (caché aux lecteurs d'écran) */
const EMOJIS: Partial<Record<EtatAffichageQr, string>> = { scanne: "📲", accepte: "🎉", refuse: "🛑", expire: "⏱️", erreur: "😕" };

/**
 * « Me connecter avec un QR code » (nouveau téléphone) : un QR à scanner avec un téléphone déjà connecté, renouvelé toutes
 * les 2 minutes. Une fois accepté de l'autre côté (confirmation, puis Face ID), ce téléphone entre dans le compte comme
 * après une connexion par e-mail ; si le profil n'a pas pu être lu, on réessaie avec la même session (rendue une seule fois).
 */
export default function ConnexionQr() {
  const { service, demo } = utiliserServiceConnexionQr();
  return <AfficherQr service={service} demo={demo} />;
}

function AfficherQr({ service, demo }: { service: ServiceConnexionQr; demo: boolean }) {
  const couleurs = utiliserCouleurs();
  const { entrer } = utiliserEntreeCompte();
  const [finDemo, setFinDemo] = useState(false);
  // La session rendue par l'API (une seule fois) : gardée pour réessayer d'entrer sans nouveau QR
  const [ouverte, setOuverte] = useState<SessionOuverte | null>(null);
  const [entree, setEntree] = useState<"en-cours" | "ratee">("en-cours");

  async function essayerEntrer(session: SessionOuverte) {
    setEntree("en-cours");
    const ok = await entrer(session).catch(() => false);
    if (!ok) setEntree("ratee");
  }

  // En démo, la « session » rendue est vide : on s'arrête là, sans rien ouvrir
  const attente = utiliserAttenteConnexionQr(service, (rendue) => {
    if (demo) return setFinDemo(true);
    setOuverte(rendue);
    void essayerEntrer(rendue);
  });
  const { demande, etat } = attente;
  const entreeRatee = etat === "accepte" && !finDemo && entree === "ratee";

  const message =
    etat === "scanne"
      ? textesConnexionQr.scanne
      : etat === "accepte"
        ? finDemo
          ? "🧪 Démo : c'est accepté ! Sur un vrai téléphone, tu serais maintenant dans ton compte."
          : entreeRatee
            ? textesConnexionQr.entreeRatee
            : textesConnexionQr.accepteIci
        : etat === "refuse"
          ? textesConnexionQr.refuseAilleurs
          : etat === "expire"
            ? textesConnexionQr.expireIci
            : etat === "erreur"
              ? demande
                ? textesConnexionQr.erreurAttente
                : textesConnexionQr.erreurPreparer
              : null;

  // VoiceOver ne lit pas les zones « live » : chaque changement se dit à voix haute (TalkBack aussi)
  useEffect(() => {
    if (message) annoncerLecteurEcran(retirerEmoji(message));
  }, [message]);

  let contenu;
  if (etat === "chargement") {
    contenu = (
      <View style={{ height: TAILLE_QR }} className="items-center justify-center">
        <ActivityIndicator color={couleurs.encre} accessibilityLabel="On prépare ton QR code" />
      </View>
    );
  } else if (etat === "attente" && demande) {
    contenu = (
      <View className="items-center gap-3">
        <View
          accessible
          accessibilityRole="image"
          accessibilityLabel="QR code de connexion : scanne-le avec ton téléphone déjà connecté"
          className="rounded-carte border-2 border-encre bg-white p-4"
        >
          <QRCode value={`https://sosmiam.fr/q/${demande.code}`} size={TAILLE_QR} color={couleurs.nuit} backgroundColor="#FFFFFF" ecl="M" />
        </View>
        <Text className="font-texte text-sm text-gris">
          {attente.secondesRestantes > 0 ? `Valable encore ${attente.secondesRestantes} s · ${textesConnexionQr.renouvele}` : textesConnexionQr.renouvele}
        </Text>
      </View>
    );
  } else {
    contenu = (
      <View className="items-center gap-4 rounded-carte border-2 border-encre bg-carte p-5">
        <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-5xl">
          {entreeRatee ? "😕" : (EMOJIS[etat] ?? "😕")}
        </Text>
        <Text className="text-center font-texte-gras text-base leading-6 text-encre">{lierPonctuation(message ?? "")}</Text>
        {etat === "scanne" || (etat === "accepte" && !finDemo && !entreeRatee) ? <ActivityIndicator color={couleurs.encre} /> : null}
        {entreeRatee && ouverte ? <Bouton libelle="Réessayer" onPress={() => void essayerEntrer(ouverte)} /> : null}
        {etat === "refuse" || etat === "expire" || etat === "erreur" || entreeRatee ? (
          <Bouton libelle="Un nouveau QR code" variante={entreeRatee ? "blanc" : "jaune"} petit={entreeRatee} onPress={() => void attente.nouvelle()} />
        ) : null}
        {etat === "erreur" && attente.erreur ? (
          <Bouton libelle="Pourquoi ?" variante="blanc" petit onPress={() => attente.erreur && montrerErreurCompte(attente.erreur)} />
        ) : null}
      </View>
    );
  }

  return (
    <EcranEtape titre={textesConnexionQr.titreAfficher} sousTitre={textesConnexionQr.sousTitreAfficher}>
      <View className="gap-6">
        {contenu}
        <Text className="font-texte text-base leading-6 text-encre">{lierPonctuation(textesConnexionQr.aideAfficher)}</Text>
        {demo && demande && (etat === "attente" || etat === "scanne") ? (
          <View className="gap-3 rounded-2xl border-2 border-dashed border-ligne bg-carte p-4">
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
