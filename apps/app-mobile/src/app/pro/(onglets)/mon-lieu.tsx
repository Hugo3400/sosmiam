import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { CarteLieu } from "@sos-miam/commun/types/carte";
import type { ProgrammeFidelite } from "@sos-miam/commun/types/fidelite";
import type { CharteMiamSafe } from "@sos-miam/commun/types/miam-safe";
import { EnTeteMode } from "~/composants/modes/EnTeteMode";
import { BandeauDemoPro } from "~/composants/pro/BandeauDemoPro";
import { LigneMonLieu } from "~/composants/pro/LigneMonLieu";
import { utiliserModes } from "~/hooks/utiliser-modes";
import { utiliserOutilsDemo, utiliserServices } from "~/hooks/utiliser-services";
import couleurs from "~/theme/couleurs";

/** « 5 visites → un tiramisu maison », ou l'invitation à en créer une */
function decrireProgramme(programme: ProgrammeFidelite | null): string {
  if (!programme) return "Pas encore de carte : crée la tienne en une minute.";
  const etat = programme.actif ? "active" : "en pause";
  return `${programme.visitesRequises} visites → ${programme.recompense} · ${etat}`;
}

/** « 4 sections · 11 sur la carte », ou l'invitation à la remplir */
function decrireCarte(carte: CarteLieu | null): string {
  const nombre = carte?.sections.reduce((somme, s) => somme + s.elements.length, 0) ?? 0;
  if (!carte || nombre === 0) return "Pas encore de carte : ajoute tes plats et tes boissons.";
  const sections = carte.sections.length;
  return `${sections} section${sections > 1 ? "s" : ""} · ${nombre} sur la carte`;
}

function decrireCharte(charte: CharteMiamSafe | null): string {
  if (!charte) return "La charte, ses engagements et ta signature";
  if (charte.signee) return "Charte signée";
  if (charte.retireeParEquipe) return "Retirée par l'équipe SOS Miam";
  return "Pas encore signée : le badge sur ta fiche, gratuit";
}

/**
 * « Mon lieu » (gérant) : ce qui se règle une fois pour toutes. La carte (plats, boissons, formules), la carte de fidélité,
 * les infos pratiques affichées sur la fiche, le kit (QR de vitrine), ce soir (SOS et message du moment), les événements et
 * les statistiques ; l'équipe et ses appareils arrivent ensuite.
 */
export default function EcranMonLieu() {
  const router = useRouter();
  const { lieuPro } = utiliserModes();
  const { comptoir, miamSafe } = utiliserServices();
  const demo = utiliserOutilsDemo() !== null;
  const [programme, setProgramme] = useState<ProgrammeFidelite | null | undefined>(undefined);
  const [carte, setCarte] = useState<CarteLieu | null | undefined>(undefined);
  const [charte, setCharte] = useState<CharteMiamSafe | null | undefined>(undefined);

  // Relu à chaque retour sur l'onglet (après avoir réglé la carte du lieu ou celle de fidélité)
  useFocusEffect(
    useCallback(() => {
      if (!lieuPro) return;
      let actif = true;
      comptoir.lireProgramme(lieuPro.id).then((r) => actif && setProgramme(r.ok ? r.programme : null));
      comptoir.lireCarteDuLieu(lieuPro.id).then((r) => actif && setCarte(r.ok ? r.carte : null));
      miamSafe.lireCharte(lieuPro.id).then((r) => actif && setCharte(r.ok ? r.charte : null), () => actif && setCharte(null));
      return () => {
        actif = false;
      };
    }, [comptoir, miamSafe, lieuPro]),
  );

  if (!lieuPro) return null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: couleurs.creme }} edges={["top"]}>
      <ScrollView contentContainerClassName="gap-6 px-5 pb-10 pt-3">
        <EnTeteMode mode="pro" titre="Mon lieu" sousTitre={`${lieuPro.emoji} ${lieuPro.nom}`} />
        {demo ? <BandeauDemoPro nomLieu={lieuPro.nom} /> : null}

        <View accessible accessibilityLabel="Lieu vérifié : il a un compte SOS Miam. Il valide les visites, lance des SOS et répond aux avis." className="flex-row items-center gap-3 rounded-carte border-2 border-encre bg-jaune p-4">
          <Text className="text-2xl">✓</Text>
          <View className="flex-1 gap-0.5">
            <Text className="font-texte-gras text-base text-encre">Lieu vérifié</Text>
            <Text className="font-texte text-[13px] leading-[18px] text-encre">Tu valides les visites, tu lances des SOS et tu réponds aux avis.</Text>
          </View>
        </View>

        <View className="gap-3">
          <LigneMonLieu emoji="🍽️" titre="La carte" detail={carte === undefined ? "…" : decrireCarte(carte)} onPress={() => router.push("/pro/carte")} />
          <LigneMonLieu emoji="🎟️" titre="Carte de fidélité" detail={programme === undefined ? "…" : decrireProgramme(programme)} onPress={() => router.push("/pro/fidelite")} />
          <LigneMonLieu emoji="📋" titre="Infos pratiques" detail="Téléphone, animaux, accès, terrasse, paiements… ce qu'on voit sur ta fiche" onPress={() => router.push("/pro/infos")} />
          <LigneMonLieu emoji="🛡" titre="Miam Safe" detail={charte === undefined ? "…" : decrireCharte(charte)} onPress={() => router.push("/pro/miam-safe")} />
          <LigneMonLieu emoji="🪧" titre="Mon kit" detail="Le QR de ta vitrine, qui ouvre ta fiche" onPress={() => router.push("/pro/kit")} />
          <LigneMonLieu emoji="👥" titre="Équipe et appareils" detail="Invite tes serveurs : chacun son compte, on sait qui a validé quoi" />
          <LigneMonLieu emoji="🛟" titre="Ce soir" detail="SOS du soir et message du moment : préviens les gourmands du coin" onPress={() => router.push("/pro/ce-soir")} />
          <LigneMonLieu emoji="🎸" titre="Événements" detail="Concert, quiz, atelier : sur ta fiche et chez qui te suit" onPress={() => router.push("/pro/evenements")} />
          <LigneMonLieu emoji="📈" titre="Statistiques de la semaine" detail="Vues de ta fiche, rescousses, visites validées, nouveaux clients" onPress={() => router.push("/pro/statistiques")} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
