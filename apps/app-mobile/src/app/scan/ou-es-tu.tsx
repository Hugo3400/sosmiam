import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Linking, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { calculerAge } from "@sos-miam/commun/regles/calculer-age";
import { RAYON_LIEUX_PROCHES_M } from "@sos-miam/commun/regles/visites";
import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import type { Lieu, PositionLieu } from "@sos-miam/commun/types/lieu";
import { ChampTexte } from "~/composants/interface/ChampTexte";
import { BoutonDemanderAddition } from "~/composants/visites/BoutonDemanderAddition";
import { FeuillePositionVisite } from "~/composants/visites/FeuillePositionVisite";
import { LigneLieuProche } from "~/composants/visites/LigneLieuProche";
import { MessageEchecVisite, type ActionEchecVisite } from "~/composants/visites/MessageEchecVisite";
import { lieuxExemples } from "~/contenus/lieux-exemples";
import { formaterDistance } from "~/fonctions/geo/formater-distance";
import { filtrerLieuxSelonAge } from "~/fonctions/lieux/filtrer-lieux-selon-age";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { normaliserRecherche } from "~/fonctions/texte/normaliser-recherche";
import { direChezLieu } from "~/fonctions/visites/dire-chez-lieu";
import { trierLieuxProches } from "~/fonctions/visites/trier-lieux-proches";
import { utiliserPositionExpliquee } from "~/hooks/utiliser-position-expliquee";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import { utiliserReglagesDemo } from "~/hooks/utiliser-reglages-demo";
import { utiliserServices } from "~/hooks/utiliser-services";
import couleurs from "~/theme/couleurs";

/** En dessous, un seul lieu proche, c'est sûrement là : « Tu es chez … ? » en grand */
const RAYON_EVIDENT_M = 100;
/** Assez de lettres pour chercher parmi tous les lieux (sinon la liste serait trop longue) */
const LETTRES_RECHERCHE = 2;

type Lecture = { etat: "attente" } | { etat: "ok"; position: PositionLieu } | { etat: "echec"; erreur: ErreurService } | { etat: "annulee" };

/** Les lieux dont le nom, le quartier ou la ville contient la recherche */
function chercher(lieux: readonly Lieu[], recherche: string): Lieu[] {
  const cherche = normaliserRecherche(recherche);
  if (!cherche) return [...lieux];
  return lieux.filter((l) => normaliserRecherche(`${l.nom} ${l.quartier} ${l.ville}`).includes(cherche));
}

/**
 * « Tu es chez qui ? » (depuis l'onglet Scan ou le scanner) : choisir le lieu où l'on mange pour y demander l'addition.
 * Avec ta vraie position : les lieux qui valident à moins de 300 m (en grand s'il n'y en a qu'un tout près), et une recherche.
 * En démo : tous les lieux qui valident, par nom, et le téléphone est placé à 30 m de celui choisi. Jamais de bar pour un
 * 15-17 ans. Chaque lieu a son bouton « Demander l'addition ici ».
 */
export default function TuEsChezQui() {
  const router = useRouter();
  const navigation = useNavigation();
  const services = utiliserServices();
  const { reglages } = utiliserReglagesDemo();
  const { profil } = utiliserProfil();
  const position = utiliserPositionExpliquee();
  const indisponible = services.source === "indisponible";
  const demo = services.source === "demo" && !reglages.vraiePosition;
  const age = profil ? calculerAge(profil.dateNaissance) : null;

  const [ids, setIds] = useState<number[] | null>(null);
  const [lecture, setLecture] = useState<Lecture>({ etat: "attente" });
  const [recherche, setRecherche] = useState("");

  // Premier écran de la pile du Scan : on le ferme ; ouvert depuis le scanner : on y revient
  const premier = (navigation.getState()?.index ?? 0) === 0;
  const fermer = () => (router.canGoBack() ? router.back() : router.replace("/scan"));

  useEffect(() => {
    let actif = true;
    services.visites
      .listerLieuxQuiValident()
      .then((r) => {
        if (actif) setIds(r.ok ? r.lieux : []);
      })
      .catch(() => {
        if (actif) setIds([]);
      });
    return () => {
      actif = false;
    };
  }, [services]);

  const validants = useMemo(() => {
    const lieux = filtrerLieuxSelonAge(lieuxExemples, age).filter((l) => ids?.includes(l.id));
    return lieux.sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
  }, [ids, age]);

  const { lire } = position;
  const lirePosition = useCallback(async () => {
    setLecture({ etat: "attente" });
    const r = await lire(null, null);
    if (r.ok) setLecture({ etat: "ok", position: { latitude: r.position.latitude, longitude: r.position.longitude } });
    else setLecture(r.erreur === "annulee" ? { etat: "annulee" } : { etat: "echec", erreur: r.erreur });
  }, [lire]);

  // Avec ta vraie position seulement : en démo, chaque lieu fait comme si tu y étais
  useEffect(() => {
    if (!demo && !indisponible) void lirePosition();
  }, [demo, indisponible, lirePosition]);

  const proches = lecture.etat === "ok" ? trierLieuxProches(validants, lecture.position, RAYON_LIEUX_PROCHES_M) : [];
  const tresProches = proches.filter((p) => p.distanceM < RAYON_EVIDENT_M);
  const evident = tresProches.length === 1 ? tresProches[0] : null;
  const autour = proches.filter((p) => p !== evident);
  // Démo : toute la liste, filtrée si l'on tape ; vraie position : la recherche ne sort qu'à partir de 2 lettres
  const assezDeLettres = normaliserRecherche(recherche).length >= LETTRES_RECHERCHE;
  const trouves = demo ? chercher(validants, recherche) : assezDeLettres ? chercher(validants, recherche) : [];

  const actionsEchec: ActionEchecVisite[] = [];
  if (lecture.etat === "echec" && (lecture.erreur === "position-bloquee" || lecture.erreur === "position-approximative")) {
    actionsEchec.push({ libelle: "Ouvrir les réglages", onPress: () => void Linking.openSettings().catch(() => {}) });
  }
  actionsEchec.push({ libelle: "Réessayer", variante: actionsEchec.length > 0 ? "blanc" : "jaune", onPress: () => void lirePosition() });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: couleurs.creme }} edges={["top", "bottom"]}>
      <StatusBar style="dark" />
      <View className="min-h-14 flex-row items-center px-5 pb-3 pt-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={premier ? "Fermer" : "Retour"}
          hitSlop={12}
          onPress={fermer}
          className="h-10 w-10 items-center justify-center rounded-full border-2 border-encre bg-white active:opacity-80"
        >
          <Ionicons name={premier ? "close" : "arrow-back"} size={20} color={couleurs.encre} />
        </Pressable>
      </View>

      <ScrollView className="flex-1" keyboardShouldPersistTaps="handled" contentContainerClassName="gap-5 px-5 pb-10">
        <View className="gap-2">
          <Text accessibilityRole="header" className="font-titre text-3xl text-encre">
            Tu es chez qui ?
          </Text>
          <Text className="font-texte text-base leading-6 text-gris">
            {lierPonctuation("Choisis le lieu où tu manges : tu reçois un code à montrer au moment de payer, et ta visite compte.")}
          </Text>
        </View>

        {indisponible ? (
          <View className="rounded-carte border-2 border-encre bg-white p-5">
            <MessageEchecVisite erreur="service-indisponible" />
          </View>
        ) : (
          <>
            {demo ? (
              <View accessible className="flex-row gap-3 rounded-carte border-2 border-dashed border-encre bg-jaune-clair p-4">
                <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-xl">
                  🧪
                </Text>
                <Text className="flex-1 font-texte text-sm leading-5 text-encre">
                  {lierPonctuation("Démo : on fait comme si tu étais à 30 m du lieu choisi. Pour tester ta vraie position, passe par les Coulisses de la démo.")}
                </Text>
              </View>
            ) : null}

            {!demo && lecture.etat === "attente" ? (
              <View accessible accessibilityLabel="On regarde où tu es…" className="flex-row items-center justify-center gap-3 py-6">
                <ActivityIndicator color={couleurs.encre} />
                <Text className="font-texte-semi text-base text-encre">On regarde où tu es…</Text>
              </View>
            ) : null}

            {!demo && lecture.etat === "echec" ? (
              <View className="rounded-carte border-2 border-encre bg-white p-5">
                <MessageEchecVisite erreur={lecture.erreur} actions={actionsEchec} />
              </View>
            ) : null}

            {!demo && lecture.etat === "annulee" ? (
              <View className="rounded-carte border-2 border-encre bg-white p-5">
                <MessageEchecVisite
                  erreur="position-refusee"
                  actions={[{ libelle: "Vérifier ma position", onPress: () => void lirePosition() }]}
                />
              </View>
            ) : null}

            {evident ? (
              <View className="relative">
                <View className="absolute inset-0 translate-x-1.5 translate-y-1.5 rounded-carte bg-encre" />
                <View className="items-center gap-3 rounded-carte border-2 border-encre bg-jaune p-5">
                  <View
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                    style={{ backgroundColor: evident.lieu.couleurs[0] }}
                    className="h-16 w-16 items-center justify-center rounded-full border-2 border-encre"
                  >
                    <Text className="text-3xl">{evident.lieu.emoji}</Text>
                  </View>
                  <Text accessibilityRole="header" className="text-center font-titre text-2xl text-encre">
                    {lierPonctuation(`Tu es ${direChezLieu(evident.lieu.nom)} ?`)}
                  </Text>
                  <Text className="text-center font-texte-semi text-sm text-encre">
                    {lierPonctuation(`À ${formaterDistance(evident.distanceM / 1000)} de toi · ${evident.lieu.quartier}`)}
                  </Text>
                  <View className="self-stretch">
                    <BoutonDemanderAddition lieu={evident.lieu} variante="blanc" libelle="Oui, demander l'addition" />
                  </View>
                </View>
              </View>
            ) : null}

            {autour.length > 0 ? (
              <View className="gap-3">
                <Text accessibilityRole="header" className="font-titre-gras text-xl text-encre">
                  {evident ? "Pas le bon lieu ?" : "Autour de toi"}
                </Text>
                {autour.map(({ lieu, distanceM }) => (
                  <LigneLieuProche key={lieu.id} lieu={lieu} distanceM={distanceM} />
                ))}
              </View>
            ) : null}

            {!demo && lecture.etat === "ok" && proches.length === 0 ? (
              <Text className="text-center font-texte text-base leading-6 text-gris">
                {lierPonctuation(`Aucun lieu qui valide les visites à moins de ${RAYON_LIEUX_PROCHES_M} m. Cherche-le par son nom :`)}
              </Text>
            ) : null}

            {demo || lecture.etat !== "attente" ? (
              <View className="gap-3">
                <ChampTexte
                  libelle={demo ? "Filtrer les lieux" : proches.length > 0 ? "Pas dans la liste ? Cherche le lieu" : "Cherche le lieu"}
                  valeur={recherche}
                  onChangeTexte={setRecherche}
                  placeholder="Nom, quartier ou ville"
                  autoCorrect={false}
                  returnKeyType="search"
                />
                {trouves.map((lieu) => (
                  <LigneLieuProche key={lieu.id} lieu={lieu} />
                ))}
                {(demo || assezDeLettres) && trouves.length === 0 && ids !== null ? (
                  <Text className="text-center font-texte text-base text-gris">
                    {lierPonctuation("Aucun lieu qui valide les visites ne correspond. Il n'est peut-être pas encore équipé !")}
                  </Text>
                ) : null}
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
      <FeuillePositionVisite {...position.propsFeuille} />
    </SafeAreaView>
  );
}
