import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { EcranFormulaireAvis } from "~/composants/avis/EcranFormulaireAvis";
import { EcranMerciAvis } from "~/composants/avis/EcranMerciAvis";
import { RefusOuvertureAvis } from "~/composants/avis/RefusOuvertureAvis";
import { EcranReglage } from "~/composants/reglages/EcranReglage";
import { TEXTES_DONNER_AVIS_PAR_LANGUE } from "~/contenus/textes-donner-avis";
import { choisirRefusOuvertureAvis } from "~/fonctions/avis/choisir-refus-ouverture-avis";
import { estRefusOuverturePassager } from "~/fonctions/avis/est-refus-ouverture-passager";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserEnvoiAvis } from "~/hooks/utiliser-envoi-avis";
import { utiliserEtatAvisEnDirect } from "~/hooks/utiliser-etat-avis-en-direct";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserPhotoAvis } from "~/hooks/utiliser-photo-avis";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import { utiliserVisiteEnDirect } from "~/hooks/utiliser-visite-en-direct";

const lireVisiteId = (brut: unknown) => (typeof brut === "string" && /^\d{1,12}$/.test(brut) ? Number(brut) : null);

export default function EcranDonnerAvis() {
  const couleurs = utiliserCouleurs();
  const { langue } = utiliserLangue();
  const T = utiliserTextes(TEXTES_DONNER_AVIS_PAR_LANGUE);
  const router = useRouter();
  const { visiteId } = useLocalSearchParams<{ visiteId: string }>();
  const { pret, resultat, echec, relire } = utiliserVisiteEnDirect(lireVisiteId(visiteId));
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
        <View accessible accessibilityLabel={T.chargement} className="items-center">
          <ActivityIndicator color={couleurs.encre} size="large" />
        </View>
      </EcranReglage>
    );
  }

  const refus = choisirRefusOuvertureAvis({ visite, echecLecture: echec, refusEnvoi: envoi.refus, etat, maintenant }, langue);
  if (refus || !visite) {
    const motif = refus ?? { erreur: "introuvable" as const };
    const passager = estRefusOuverturePassager(motif, visite !== null);
    return <RefusOuvertureAvis refus={motif} nomLieu={visite?.lieu.nom} onRetour={revenir} onReessayer={passager ? relire : undefined} />;
  }

  return <EcranFormulaireAvis visite={visite} envoi={envoi} photo={photo} onRetour={revenir} />;
}
