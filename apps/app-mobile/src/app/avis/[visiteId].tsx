import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { EcranFormulaireAvis } from "~/composants/avis/EcranFormulaireAvis";
import { EcranMerciAvis } from "~/composants/avis/EcranMerciAvis";
import { RefusOuvertureAvis } from "~/composants/avis/RefusOuvertureAvis";
import { EcranReglage } from "~/composants/reglages/EcranReglage";
import { TEXTES_DONNER_AVIS } from "~/contenus/textes-donner-avis";
import { choisirRefusOuvertureAvis } from "~/fonctions/avis/choisir-refus-ouverture-avis";
import { utiliserEnvoiAvis } from "~/hooks/utiliser-envoi-avis";
import { utiliserEtatAvisEnDirect } from "~/hooks/utiliser-etat-avis-en-direct";
import { utiliserPhotoAvis } from "~/hooks/utiliser-photo-avis";
import { utiliserVisiteEnDirect } from "~/hooks/utiliser-visite-en-direct";
import couleurs from "~/theme/couleurs";

const lireVisiteId = (brut: unknown) => (typeof brut === "string" && /^\d{1,12}$/.test(brut) ? Number(brut) : null);

export default function EcranDonnerAvis() {
  const router = useRouter();
  const { visiteId } = useLocalSearchParams<{ visiteId: string }>();
  const { pret, resultat, echec } = utiliserVisiteEnDirect(lireVisiteId(visiteId));
  const visite = resultat?.visite ?? null;
  const { etat, maintenant } = utiliserEtatAvisEnDirect(visite?.avis ?? null);
  const envoi = utiliserEnvoiAvis();
  const photo = utiliserPhotoAvis();

  const revenir = () => (router.canGoBack() ? router.back() : router.replace("/visites"));

  if (visite && envoi.envoye) {
    return <EcranMerciAvis visite={visite} envoye={envoi.envoye} photo={photo.photo} onTerminer={revenir} onMesVisites={() => router.navigate("/visites")} />;
  }

  if (!pret) {
    return (
      <EcranReglage centre onRetour={revenir}>
        <View accessible accessibilityLabel={TEXTES_DONNER_AVIS.chargement} className="items-center">
          <ActivityIndicator color={couleurs.encre} size="large" />
        </View>
      </EcranReglage>
    );
  }

  const refus = choisirRefusOuvertureAvis({ visite, echecLecture: echec, refusEnvoi: envoi.refus, etat, maintenant });
  if (refus || !visite) {
    return <RefusOuvertureAvis refus={refus ?? { erreur: "introuvable" }} nomLieu={visite?.lieu.nom} onRetour={revenir} />;
  }

  return <EcranFormulaireAvis visite={visite} envoi={envoi} photo={photo} onRetour={revenir} />;
}
