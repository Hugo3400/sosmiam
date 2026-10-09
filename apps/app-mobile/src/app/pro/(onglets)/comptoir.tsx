import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import type { QrAffiche } from "@sos-miam/commun/types/comptoir";
import { Annonce } from "~/composants/interface/Annonce";
import { EnTeteMode } from "~/composants/modes/EnTeteMode";
import { BandeauDemoPro } from "~/composants/pro/BandeauDemoPro";
import { BoutonMontrerQr } from "~/composants/pro/BoutonMontrerQr";
import { CarteDemandeComptoir } from "~/composants/pro/CarteDemandeComptoir";
import { CarteQrAffiche } from "~/composants/pro/CarteQrAffiche";
import { ComptoirVide } from "~/composants/pro/ComptoirVide";
import { ListeValideesInstant } from "~/composants/pro/ListeValideesInstant";
import { creerComptoirExempleAffichage, creerQrExempleAffichage } from "~/contenus/comptoir-exemple-affichage";
import couleurs from "~/theme/couleurs";

/**
 * Comptoir du mode pro : montrer le QR après le paiement, les additions et récompenses en attente, les validations
 * encore annulables. AFFICHAGE SEULEMENT pour l'instant (données d'exemple) : la logique arrive ensuite.
 */
export default function EcranComptoir() {
  const marges = useSafeAreaInsets();
  const [maintenant, setMaintenant] = useState(() => new Date());
  const [etat] = useState(() => creerComptoirExempleAffichage(new Date()));
  const [qr, setQr] = useState<QrAffiche | null>(null);
  const [annonce, setAnnonce] = useState<{ texte: string; numero: number } | null>(null);

  // Les attentes (« depuis 3 min ») et le compte à rebours du QR bougent tout seuls
  useEffect(() => {
    const minuterie = setInterval(() => setMaintenant(new Date()), 1000);
    return () => clearInterval(minuterie);
  }, []);

  const bientot = () => setAnnonce({ texte: "Affichage seulement : la logique arrive juste après 🛠️", numero: Date.now() });
  const additions = etat.demandes.length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: couleurs.creme }} edges={["top"]}>
      <ScrollView contentContainerClassName="gap-6 px-5 pb-10 pt-3">
        <EnTeteMode mode="pro" titre="Comptoir" sousTitre={`${etat.lieu.emoji} ${etat.lieu.nom}`} />
        <BandeauDemoPro nomLieu={etat.lieu.nom} />

        {qr ? (
          <CarteQrAffiche qr={qr} maintenant={maintenant} onVoir={bientot} onCacher={() => setQr(null)} />
        ) : (
          <BoutonMontrerQr onPress={() => setQr(creerQrExempleAffichage(new Date()))} />
        )}

        <View className="gap-3">
          <Text accessibilityRole="header" className="font-titre-gras text-xl text-encre">
            En attente{additions > 0 ? ` (${additions})` : ""}
          </Text>
          {additions >= 2 ? (
            <Text className="font-texte text-sm leading-5 text-gris">Plusieurs additions en même temps : tu taperas le code que te montre le client, pour ne pas te tromper de table.</Text>
          ) : null}
          {additions === 0 ? (
            <ComptoirVide />
          ) : (
            etat.demandes.map((d) => <CarteDemandeComptoir key={`${d.type}-${d.id}`} demande={d} maintenant={maintenant} onRegler={bientot} onRefuser={bientot} onOffrir={bientot} />)
          )}
        </View>

        <ListeValideesInstant validees={etat.validees} maintenant={maintenant} onAnnuler={bientot} />
      </ScrollView>
      <Annonce annonce={annonce} haut={marges.top + 12} onFin={() => setAnnonce(null)} />
    </SafeAreaView>
  );
}
