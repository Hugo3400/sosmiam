import { useLocalSearchParams } from "expo-router";
import { useBottomTabBarHeight } from "expo-router/tabs";
import { useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { calculerAge } from "@sos-miam/commun/regles/calculer-age";
import { BandeauAnnuler } from "~/composants/interface/BandeauAnnuler";
import { EcranInvite } from "~/composants/invite/EcranInvite";
import { BandeauDemoPotes } from "~/composants/potes/BandeauDemoPotes";
import { ChoixPseudoManquant } from "~/composants/potes/ChoixPseudoManquant";
import { EnTetePotes } from "~/composants/potes/EnTetePotes";
import { OngletsPotes, type OngletPotes } from "~/composants/potes/OngletsPotes";
import { SectionBande } from "~/composants/potes/SectionBande";
import { SectionListes } from "~/composants/potes/SectionListes";
import { SectionSorties } from "~/composants/potes/SectionSorties";
import { lieuxExemples } from "~/contenus/lieux-exemples";
import { filtrerLieuxSelonAge } from "~/fonctions/lieux/filtrer-lieux-selon-age";
import { utiliserBandeauAnnuler } from "~/hooks/utiliser-bandeau-annuler";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import couleurs from "~/theme/couleurs";

const ONGLETS: readonly OngletPotes[] = ["sorties", "bande", "listes"];
/** « /potes?onglet=listes » ouvre directement l'onglet demandé */
const lireOnglet = (valeur: string | string[] | undefined) => ONGLETS.find((o) => o === valeur) ?? null;

/**
 * Onglet « Potes » : tes sorties (et les lieux reçus de tes potes), ta bande (classement, activité) et vos listes partagées, par
 * morceaux (« Voir plus »). Ce que tu retires disparaît pour toi seulement, avec « Annuler » en bas. Démo pour l'instant. Sans
 * compte, on montre ce qui t'attend.
 */
export default function Potes() {
  const { profil, invite } = utiliserProfil();
  const { pret, moi, recommandationsRecues, trouverPote } = utiliserCommunaute();
  // La barre d'onglets est posée par-dessus l'écran : la fin de la page passe au-dessus
  const hauteurBarreOnglets = useBottomTabBarHeight();
  const { onglet: ongletDemande } = useLocalSearchParams<{ onglet?: string }>();
  const [onglet, setOnglet] = useState<OngletPotes>(() => lireOnglet(ongletDemande) ?? "sorties");
  const defilement = useRef<ScrollView>(null);
  const hautOnglets = useRef(0);
  const position = useRef(0);
  const { bandeau, montrer: signalerRetrait, fermer: fermerBandeau } = utiliserBandeauAnnuler();

  useEffect(() => {
    const demande = lireOnglet(ongletDemande);
    if (demande) setOnglet(demande);
  }, [ongletDemande]);

  const age = profil ? calculerAge(profil.dateNaissance) : null;
  // Les lieux que tu peux voir : pas de bar sous 18 ans (en visite sans compte, l'onglet n'est pas montré : rien à calculer)
  const lieux = useMemo(() => new Map(filtrerLieuxSelonAge(invite ? [] : lieuxExemples, age).map((l) => [l.id, l] as const)), [age, invite]);
  const recues = useMemo(() => recommandationsRecues.filter((r) => lieux.has(r.lieuId) && trouverPote(r.de) !== null), [recommandationsRecues, lieux, trouverPote]);

  // Visite sans compte : ni bande ni sorties, juste un aperçu de ce qui t'attend
  if (invite) {
    return (
      <EcranInvite
        raison="potes"
        emoji="👯"
        titre="Ta bande t'attend"
        texte="Ici, on s'organise entre potes : où on mange, qui vient, et qui n'a toujours pas répondu au groupe."
        avantages={[
          "Ta bande, et qui a sauvé le plus de lieux ce mois-ci",
          "Des sorties où tout le monde vote pour le lieu (fini les débats sans fin)",
          "Un chat entre potes pour caler l'heure du rendez-vous",
          "Des listes partagées de bonnes adresses",
        ]}
      />
    );
  }

  // Le temps de lire la communauté sur le téléphone (sinon la démo de départ clignoterait)
  if (!profil || !pret) return <SafeAreaView style={{ flex: 1, backgroundColor: couleurs.creme }} edges={["top"]} />;

  function choisir(nouveau: OngletPotes) {
    setOnglet(nouveau);
    // Déjà plus bas que les onglets : le nouvel onglet commence en haut, juste sous eux
    if (position.current > hautOnglets.current) defilement.current?.scrollTo({ y: hautOnglets.current, animated: false });
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: couleurs.creme }} edges={["top"]}>
      <ScrollView
        ref={defilement}
        // Les onglets (2e enfant) restent collés en haut quand on fait défiler
        stickyHeaderIndices={[1]}
        onScroll={(e) => {
          position.current = e.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={64}
        contentContainerClassName="pt-4"
        contentContainerStyle={{ paddingBottom: hauteurBarreOnglets + 32 }}
      >
        <View
          onLayout={(e) => {
            hautOnglets.current = e.nativeEvent.layout.y + e.nativeEvent.layout.height;
          }}
          className="gap-5 px-5 pb-5"
        >
          <EnTetePotes moi={moi} />
          {/* Profils créés avant Potes : pas encore de pseudo */}
          {profil.pseudo ? null : <ChoixPseudoManquant />}
          <BandeauDemoPotes />
        </View>
        <OngletsPotes onglet={onglet} onChoisir={choisir} nouveautes={recues.filter((r) => !r.vue).length} />
        <View className="px-5 pt-5">
          {onglet === "sorties" ? (
            <SectionSorties recommandations={recues} lieux={lieux} onRetire={signalerRetrait} />
          ) : onglet === "bande" ? (
            <SectionBande lieux={lieux} onRetire={signalerRetrait} />
          ) : (
            <SectionListes lieux={lieux} onRetire={signalerRetrait} />
          )}
        </View>
      </ScrollView>
      <BandeauAnnuler bandeau={bandeau} bas={hauteurBarreOnglets + 12} onFermer={fermerBandeau} />
    </SafeAreaView>
  );
}
