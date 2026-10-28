import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { CarteLieu } from "@sos-miam/commun/types/carte";
import type { ProgrammeFidelite } from "@sos-miam/commun/types/fidelite";
import type { CharteMiamSafe } from "@sos-miam/commun/types/miam-safe";
import type { Traduction } from "@sos-miam/commun/types/traduction";
import { EnTeteMode } from "~/composants/modes/EnTeteMode";
import { LigneMonLieu } from "~/composants/pro/LigneMonLieu";
import { TEXTES_ACTUS_PRO_PAR_LANGUE } from "~/contenus/textes-actus-pro";
import { TEXTES_ECRAN_MON_LIEU_PAR_LANGUE, type TEXTES_ECRAN_MON_LIEU } from "~/contenus/textes-ecran-pro-mon-lieu";
import { TEXTES_IMAGES_LIEU_PAR_LANGUE } from "~/contenus/textes-images-lieu";
import { resumerReglagesReservations } from "~/fonctions/reservations/resumer-reglages-reservations";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserModes } from "~/hooks/utiliser-modes";
import { utiliserReglagesReservations } from "~/hooks/utiliser-reglages-reservations";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import { utiliserServices } from "~/hooks/utiliser-services";
import { ACTUS_VISIBLES } from "~/services/actus-visibles";

type Textes = Traduction<typeof TEXTES_ECRAN_MON_LIEU>;

/** « 5 visites → un tiramisu maison », ou l'invitation à en créer une */
function decrireProgramme(programme: ProgrammeFidelite | null, T: Textes): string {
  if (!programme) return T.programmeVide;
  const etat = programme.actif ? T.programmeActif : T.programmeEnPause;
  return T.programme(programme.visitesRequises, programme.recompense, etat);
}

/** « 4 sections · 11 sur la carte », ou l'invitation à la remplir */
function decrireCarte(carte: CarteLieu | null, T: Textes): string {
  const nombre = carte?.sections.reduce((somme, s) => somme + s.elements.length, 0) ?? 0;
  if (!carte || nombre === 0) return T.carteVide;
  return T.carte(carte.sections.length, nombre);
}

function decrireCharte(charte: CharteMiamSafe | null, T: Textes): string {
  if (!charte) return T.charteInconnue;
  if (charte.signee) return T.charteSignee;
  if (charte.retireeParEquipe) return T.charteRetiree;
  return T.charteNonSignee;
}

/**
 * « Mon lieu » (gérant) : ce qui se règle une fois pour toutes. La carte (plats, boissons, formules), la carte de fidélité,
 * les infos pratiques affichées sur la fiche, le kit (QR de vitrine), ce soir (SOS et message du moment), les événements et
 * les statistiques ; l'équipe et ses appareils arrivent ensuite.
 */
export default function EcranMonLieu() {
  const { langue } = utiliserLangue();
  const couleurs = utiliserCouleurs();
  const T = utiliserTextes(TEXTES_ECRAN_MON_LIEU_PAR_LANGUE);
  const TI = utiliserTextes(TEXTES_IMAGES_LIEU_PAR_LANGUE);
  const TAP = utiliserTextes(TEXTES_ACTUS_PRO_PAR_LANGUE);
  const router = useRouter();
  const { lieuPro } = utiliserModes();
  const { comptoir, miamSafe } = utiliserServices();
  const [programme, setProgramme] = useState<ProgrammeFidelite | null | undefined>(undefined);
  const [carte, setCarte] = useState<CarteLieu | null | undefined>(undefined);
  const [charte, setCharte] = useState<CharteMiamSafe | null | undefined>(undefined);
  const reglagesReservations = utiliserReglagesReservations(lieuPro?.id ?? null).lecture;

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
        <EnTeteMode mode="pro" titre={T.titre} sousTitre={`${lieuPro.emoji} ${lieuPro.nom}`} />

        <View accessible accessibilityLabel={T.verifieLu} className="flex-row items-center gap-3 rounded-carte border-2 border-encre bg-jaune p-4">
          <Text className="text-2xl">✓</Text>
          <View className="flex-1 gap-0.5">
            <Text className="font-texte-gras text-base text-nuit">{T.verifieTitre}</Text>
            <Text className="font-texte text-[13px] leading-[18px] text-nuit">{T.verifieTexte}</Text>
          </View>
        </View>

        <View className="gap-3">
          <LigneMonLieu emoji="🍽️" titre={T.carteTitre} detail={carte === undefined ? "…" : decrireCarte(carte, T)} onPress={() => router.push("/pro/carte")} />
          <LigneMonLieu emoji="🎟️" titre={T.fidelite} detail={programme === undefined ? "…" : decrireProgramme(programme, T)} onPress={() => router.push("/pro/fidelite")} />
          <LigneMonLieu emoji="🖼️" titre={TI.ligneTitre} detail={TI.ligneDetail} onPress={() => router.push("/pro/images")} />
          <LigneMonLieu emoji="📋" titre={T.infos} detail={T.infosDetail} onPress={() => router.push("/pro/infos")} />
          <LigneMonLieu emoji="🛡️" titre={T.miamSafe} detail={charte === undefined ? "…" : decrireCharte(charte, T)} onPress={() => router.push("/pro/miam-safe")} />
          <LigneMonLieu emoji="🪧" titre={T.kit} detail={T.kitDetail} onPress={() => router.push("/pro/kit")} />
          <LigneMonLieu emoji="👥" titre={T.equipe} detail={T.equipeDetail} />
          <LigneMonLieu emoji="🛟" titre={T.ceSoir} detail={T.ceSoirDetail} onPress={() => router.push("/pro/ce-soir")} />
          <LigneMonLieu emoji="🎸" titre={T.evenements} detail={T.evenementsDetail} onPress={() => router.push("/pro/evenements")} />
          <LigneMonLieu
            emoji="🗓️"
            titre={T.reglagesReservations}
            detail={reglagesReservations.etat === "attente" ? "…" : resumerReglagesReservations(reglagesReservations.etat === "lu" ? reglagesReservations.lus : null, langue)}
            onPress={() => router.push("/pro/reglages-reservations")}
          />
          <LigneMonLieu emoji="⭐" titre={T.avis} detail={T.avisDetail} onPress={() => router.push("/pro/avis")} />
          {ACTUS_VISIBLES ? <LigneMonLieu emoji="📰" titre={TAP.ligneTitre} detail={TAP.ligneDetail} onPress={() => router.push("/pro/actus")} /> : null}
          <LigneMonLieu emoji="📈" titre={T.statistiques} detail={T.statistiquesDetail} onPress={() => router.push("/pro/statistiques")} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
