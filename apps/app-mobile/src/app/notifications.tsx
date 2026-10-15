import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import type { Pote } from "@sos-miam/commun/types/potes";

import { Annonce } from "~/composants/interface/Annonce";
import { MenuOptions, type OptionMenu } from "~/composants/interface/MenuOptions";
import { BoutonEffacerLues } from "~/composants/notifications/BoutonEffacerLues";
import { BoutonRetirerArrivee } from "~/composants/notifications/BoutonRetirerArrivee";
import { LigneNotification } from "~/composants/notifications/LigneNotification";
import { SectionDemandesSuivi } from "~/composants/notifications/SectionDemandesSuivi";
import { DemandesBande } from "~/composants/potes/DemandesBande";
import { convertirPersonneEnPote } from "~/fonctions/communaute/convertir-personne-en-pote";
import { deplacerFocusLecteurEcran } from "~/fonctions/interaction/deplacer-focus-lecteur-ecran";
import { decrireEffacementCloche } from "~/fonctions/notifications/decrire-effacement-cloche";
import { decrireNotificationSuivi, type NotificationDecrite } from "~/fonctions/notifications/decrire-notification-suivi";
import { grouperParPeriode } from "~/fonctions/notifications/grouper-par-periode";
import { lireCleSuivi } from "~/fonctions/suivi/lire-cle-suivi";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import { utiliserLieux } from "~/hooks/utiliser-lieux";
import { utiliserNotifications, type NotificationApp, type ResultatEffacementCloche } from "~/hooks/utiliser-notifications";
import { utiliserPublications } from "~/hooks/utiliser-publications";
import { utiliserSourceSociale } from "~/hooks/utiliser-source-sociale";
import { utiliserSuivisPersonnes } from "~/hooks/utiliser-suivis-personnes";
import couleurs from "~/theme/couleurs";

/** Une ligne de l'écran : la notification, sa phrase, la personne dans le rond, et « Retirer » (arrivée par ton lien) */
type LigneAffichee = { date: string; notification: NotificationApp; description: NotificationDecrite; pote: Pote | null; retirable: boolean };

const DELAI_APRES_MENU = 500;

/**
 * Notifications (la cloche du fil et du Profil) : les demandes pour rejoindre ta bande et les demandes d'abonnement, à
 * accepter ou refuser, puis « … te suit », les demandes acceptées, la bande, les sorties, les groupes, les listes, les
 * commentaires, la modération et les nouveautés des comptes suivis, rangées par période. Ce qui est arrivé depuis ta visite
 * précédente est mis en avant ; ouvrir l'écran marque tout comme vu. Démo : rien ne part sur ton téléphone.
 */
export default function Notifications() {
  const router = useRouter();
  const marges = useSafeAreaInsets();
  const { trouverPote, demandesRecues: demandesBande } = utiliserCommunaute();
  const source = utiliserSourceSociale();
  const notifications = utiliserNotifications();
  const suivis = utiliserSuivisPersonnes();
  const [annonce, setAnnonce] = useState<{ texte: string; numero: number } | null>(null);
  const finAnnonce = useCallback(() => setAnnonce(null), []);
  const annoncer = useCallback((texte: string) => setAnnonce({ texte, numero: Date.now() }), []);
  const titreEcran = useRef<Text>(null);
  const [menuPour, setMenuPour] = useState<LigneAffichee | null>(null);
  const effacementLues = useRef<{ promesse: Promise<ResultatEffacementCloche>; nombre: number } | null>(null);
  // La section des demandes montre au moins une ligne (en attente, ou traitée pendant la visite) : pas de « Calme plat » dessous
  const [demandesAffichees, setDemandesAffichees] = useState(false);

  // La visite précédente, gardée à l'ouverture (undefined : pas encore prêt) ; puis tout devient vu
  const { pret, vuesLe, marquerToutVu, effacerNotification, effacerLues } = notifications;
  const [vuesAvant, setVuesAvant] = useState<string | null | undefined>(undefined);
  const vuEnArrivant = useRef(false);
  useEffect(() => {
    if (!pret || vuEnArrivant.current) return;
    vuEnArrivant.current = true;
    setVuesAvant(vuesLe);
    marquerToutVu();
  }, [pret, vuesLe, marquerToutVu]);
  // En partant, ce qui est arrivé pendant la visite est vu aussi : la cloche revient à zéro
  useEffect(
    () => () => {
      if (vuEnArrivant.current) marquerToutVu();
    },
    [marquerToutVu],
  );

  const { lieux } = utiliserLieux();
  const { publications: toutesLesPublications } = utiliserPublications();
  const groupes = useMemo(() => {
    const lignes = notifications.notifications.flatMap((notification): LigneAffichee[] => {
      const description = decrireNotificationSuivi(notification, { trouverPote, publications: toutesLesPublications, lieux });
      if (!description) return [];
      if (notification.type === "cloche") {
        const { acteur } = notification;
        const pote = acteur ? (trouverPote(acteur.id) ?? convertirPersonneEnPote(acteur)) : null;
        // Arrivé(e) dans ta bande par ton lien : « Retirer » en un geste, si ce n'était pas prévu
        const retirable = notification.sorte === "bande-ajout" && pote !== null;
        return [{ date: notification.date, notification, description, pote, retirable }];
      }
      const cible = lireCleSuivi(notification.cle);
      const pote = cible?.type === "personne" ? trouverPote(cible.id) : null;
      return [{ date: notification.date, notification, description, pote, retirable: false }];
    });
    return grouperParPeriode(lignes);
  }, [notifications.notifications, trouverPote, toutesLesPublications, lieux]);

  const lues = useMemo(() => {
    const dates = typeof vuesAvant === "string" ? groupes.flatMap((groupe) => groupe.elements.flatMap((ligne) => (ligne.date <= vuesAvant ? [ligne.date] : []))) : [];
    return { nombre: dates.length, jusqua: dates.reduce<string | null>((plus, d) => (plus === null || d > plus ? d : plus), null) };
  }, [groupes, vuesAvant]);

  const conclure = useCallback(
    (texte: string) => {
      deplacerFocusLecteurEcran(titreEcran.current);
      annoncer(texte);
    },
    [annoncer],
  );

  const effacerUne = useCallback(
    async (ligne: LigneAffichee) => {
      const debut = Date.now();
      const resultat = await effacerNotification(ligne.notification.id);
      const attente = Math.max(0, DELAI_APRES_MENU - (Date.now() - debut));
      setTimeout(() => conclure(decrireEffacementCloche(resultat, "une")), attente);
    },
    [effacerNotification, conclure],
  );

  const lancerEffacementLues = () => {
    if (lues.jusqua !== null) effacementLues.current = { promesse: effacerLues(lues.jusqua), nombre: lues.nombre };
  };
  const annoncerEffacementLues = () => {
    const enCours = effacementLues.current;
    effacementLues.current = null;
    if (!enCours) return;
    void enCours.promesse.then((resultat) => {
      const vu = resultat.ok ? { ...resultat, effacees: Math.min(resultat.effacees, enCours.nombre) } : resultat;
      conclure(decrireEffacementCloche(vu, "lues"));
    });
  };

  const optionsDe = (ligne: LigneAffichee | null): OptionMenu[] =>
    ligne
      ? [{ cle: "effacer", emoji: "🧹", titre: "Effacer cette notification", detail: "Hop, un coup de chiffon et elle quitte ta cloche", agir: () => void effacerUne(ligne) }]
      : [];

  const revenir = () => (router.canGoBack() ? router.back() : router.replace("/profil"));
  const pretAAfficher = pret && suivis.pret;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: couleurs.creme }} edges={["top", "bottom"]}>
      <StatusBar style="dark" />
      <View className="min-h-14 flex-row items-center justify-between gap-3 px-5 pb-3 pt-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retour"
          hitSlop={12}
          onPress={revenir}
          className="h-10 w-10 items-center justify-center rounded-full border-2 border-encre bg-white active:opacity-80"
        >
          <Ionicons name="arrow-back" size={20} color={couleurs.encre} />
        </Pressable>
        <BoutonEffacerLues nombre={pretAAfficher ? lues.nombre : 0} onEffacer={lancerEffacementLues} onRefermee={annoncerEffacementLues} />
      </View>

      <ScrollView className="flex-1" contentContainerClassName="gap-6 px-5 pb-10">
        <Text ref={titreEcran} accessibilityRole="header" className="font-titre text-3xl text-encre">
          Notifications
        </Text>

        {source === "demo" ? (
          <View accessible className="flex-row gap-3 rounded-carte border-2 border-encre bg-jaune-clair p-4">
            <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-xl">
              🧪
            </Text>
            <Text className="flex-1 font-texte text-sm leading-5 text-encre">{lierPonctuation("Notifications d'exemple, pour voir à quoi ça ressemble.")}</Text>
          </View>
        ) : null}

        {!pretAAfficher ? null : (
          <>
            <DemandesBande />
            <SectionDemandesSuivi onAnnoncer={annoncer} onAffichee={setDemandesAffichees} />

            {groupes.map((groupe) => (
              <View key={groupe.periode} className="gap-3">
                <Text accessibilityRole="header" className="font-titre-gras text-xl text-encre">
                  {groupe.titre}
                </Text>
                <View className="overflow-hidden rounded-carte border-2 border-encre bg-white">
                  {groupe.elements.map((ligne, i) => (
                    <LigneNotification
                      key={ligne.notification.id}
                      notification={ligne.notification}
                      description={ligne.description}
                      pote={ligne.pote}
                      nouvelle={vuesAvant !== undefined && (vuesAvant === null || ligne.date > vuesAvant)}
                      derniere={i === groupe.elements.length - 1}
                      action={ligne.retirable && ligne.pote ? <BoutonRetirerArrivee id={ligne.pote.id} prenom={ligne.pote.prenom} onAnnoncer={annoncer} /> : undefined}
                      onOptions={() => setMenuPour(ligne)}
                      onEffacer={() => void effacerUne(ligne)}
                    />
                  ))}
                </View>
              </View>
            ))}

            {groupes.length === 0 && !demandesAffichees && suivis.demandesRecues.length === 0 && demandesBande.length === 0 ? (
              <View className="items-center gap-2 rounded-carte border-2 border-dashed border-ligne px-6 py-8">
                <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-4xl">
                  🦗
                </Text>
                <Text className="text-center font-titre-gras text-lg text-encre">Calme plat par ici</Text>
                <Text className="text-center font-texte text-base leading-6 text-gris">
                  {lierPonctuation("Quand quelqu'un te suivra, ou qu'un lieu ou un créateur que tu suis publiera, ça s'affichera ici.")}
                </Text>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>

      <MenuOptions visible={menuPour !== null} titre={menuPour ? menuPour.description.texte : ""} options={optionsDe(menuPour)} onFermer={() => setMenuPour(null)} />
      <Annonce annonce={annonce} haut={marges.top + 60} onFin={finAnnonce} />
    </SafeAreaView>
  );
}
