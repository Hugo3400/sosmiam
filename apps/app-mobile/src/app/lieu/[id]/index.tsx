import { Ionicons } from "@expo/vector-icons";
import { useIsFocused, useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useMemo, useState } from "react";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { POINTS_AMBASSADEUR } from "@sos-miam/commun/regles/ambassadeurs";
import { calculerAge } from "@sos-miam/commun/regles/calculer-age";
import { estLieuVerifie } from "@sos-miam/commun/fonctions/lieux/est-lieu-verifie";
import { Annonce } from "~/composants/interface/Annonce";
import { Bouton } from "~/composants/interface/Bouton";
import { BlocVisiteLieu } from "~/composants/lieux/BlocVisiteLieu";
import { EnTeteFicheLieu } from "~/composants/lieux/EnTeteFicheLieu";
import { LieuReserveAdultes } from "~/composants/lieux/LieuReserveAdultes";
import { FeuilleMiamSafe } from "~/composants/miam-safe/FeuilleMiamSafe";
import { SuiteFicheLieu } from "~/composants/lieux/SuiteFicheLieu";
import { EnvoyerAPote } from "~/composants/potes/EnvoyerAPote";
import { lieuxExemples } from "~/contenus/lieux-exemples";
import { calculerKmLieu } from "~/fonctions/lieux/calculer-km-lieu";
import { filtrerLieuxSelonAge } from "~/fonctions/lieux/filtrer-lieux-selon-age";
import { lireMiamSafeLieu } from "~/fonctions/miam-safe/lire-miam-safe-lieu";
import { estPremierSauvetagePossible } from "~/fonctions/lieux/est-premier-sauvetage-possible";
import { ouvrirItineraire } from "~/fonctions/lieux/ouvrir-itineraire";
import { utiliserActivite } from "~/hooks/utiliser-activite";
import { utiliserCompteRequis } from "~/hooks/utiliser-compte-requis";
import { utiliserInviterLieu } from "~/hooks/utiliser-inviter-lieu";
import { utiliserPointDeDepart } from "~/hooks/utiliser-point-de-depart";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import couleurs from "~/theme/couleurs";

/** Une feuille (« Envoyer à un pote », « Miam Safe ») : pas encore ouverte (donc pas encore préparée), ouverte, ou refermée */
type EtatEnvoi = "jamais" | "ouvert" | "ferme";

/**
 * Fiche d'un lieu (première version) : ses infos, ses horaires, son plat signature, de quoi y faire compter sa visite
 * (addition, QR du comptoir, fidélité, réserver), et de quoi y aller ou l'aider.
 * Pour une arrivée fluide, seul le haut est dessiné tout de suite ; la suite (horaires, carte, tags) vient juste après l'animation.
 * Sans compte, on regarde tout et « Y aller » marche ; rescousse, suivre et « Envoyer à un pote » proposent de créer un compte.
 * Un bar ouvert par un lien, sous 18 ans ou âge inconnu : un mot gentil à la place de la fiche.
 */
export default function FicheLieu() {
  const router = useRouter();
  const focus = useIsFocused();
  const marges = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profil } = utiliserProfil();
  const avecCompte = profil !== null;
  // Stable : « Envoyer à un pote » reste une fonction stable pour l'en-tête mémorisé
  const exiger = utiliserCompteRequis();
  const activite = utiliserActivite();
  // Distance depuis le centre de ta ville (partout en France), pas depuis Montpellier
  const depart = utiliserPointDeDepart();
  const [annonce, setAnnonce] = useState<{ texte: string; numero: number } | null>(null);
  const finAnnonce = useCallback(() => setAnnonce(null), []);
  // Stable : l'en-tête mémorisé la reçoit pour « Suivre », sans se redessiner à chaque rescousse
  const annoncer = useCallback((texte: string) => setAnnonce({ texte, numero: Date.now() }), []);
  const [envoi, setEnvoi] = useState<EtatEnvoi>("jamais");
  const ouvrirEnvoi = useCallback(() => {
    if (exiger("envoyer")) setEnvoi("ouvert");
  }, [exiger]);
  const fermerEnvoi = useCallback(() => setEnvoi("ferme"), []);
  // Miam Safe s'ouvre même sans compte : les secours restent toujours accessibles
  const [miamSafe, setMiamSafe] = useState<EtatEnvoi>("jamais");
  const ouvrirMiamSafe = useCallback(() => setMiamSafe("ouvert"), []);
  const fermerMiamSafe = useCallback(() => setMiamSafe("ferme"), []);
  // iOS n'ouvre pas une fenêtre pendant qu'une autre se referme : on laisse la feuille descendre d'abord
  const apresFeuille = useCallback((suite: () => void) => {
    setMiamSafe("ferme");
    setTimeout(suite, 450);
  }, []);
  const retour = useCallback(() => router.back(), [router]);
  const age = useMemo(() => (profil ? calculerAge(profil.dateNaissance) : null), [profil]);
  const lieu = useMemo(() => filtrerLieuxSelonAge(lieuxExemples, age).find((l) => String(l.id) === id), [age, id]);
  const contenuDefilant = useMemo(() => ({ paddingBottom: marges.bottom + 120 }), [marges.bottom]);
  const inviter = utiliserInviterLieu();

  if (!lieu) {
    // Le lieu existe, mais c'est un bar : réservé aux 18 ans et plus (et tout public tant qu'on ne connaît pas ton âge)
    if (lieuxExemples.some((l) => String(l.id) === id)) return <LieuReserveAdultes />;
    return (
      <View style={{ flex: 1, paddingTop: marges.top + 24 }} className="items-center gap-4 bg-creme px-8">
        <Text className="text-center font-titre text-2xl text-encre">Ce lieu n'est pas disponible</Text>
        <Bouton libelle="Retour" variante="blanc" onPress={retour} />
      </View>
    );
  }

  // Sans compte SOS Miam : ni visite validée ni rescousse comptée (décidé le 9 octobre 2026)
  const verifie = estLieuVerifie(lieu);
  // En visite, pas encore de rescousses : le bouton invite à en donner (et propose de créer un compte)
  const sauve = avecCompte && activite.aSauve(lieu.id);
  // Plus de rescousse cette semaine : le bouton est désactivé (pas de vibration pour rien) et dit pourquoi
  const epuisee = avecCompte && !sauve && activite.restantes <= 0;

  // Mêmes règles et mêmes messages que dans le fil (onglet « Pour toi »)
  const basculerRescousse = () => {
    if (!exiger("rescousse")) return;
    // activite est l'état d'avant l'appui : un lieu déjà compté ne refait pas « Premier sauveteur »
    const premierSauveteur = estPremierSauvetagePossible(lieu, activite.premiersSauvetages);
    const resultat = activite.basculerRescousse(lieu);
    if (resultat === "non-verifie") return annoncer("Ce lieu n'a pas encore de compte SOS Miam : invite-le ! 📣");
    if (resultat === "epuisee") return annoncer("Plus de rescousse cette semaine, reviens lundi ! 🛟");
    if (resultat === "annulee") return annoncer("Rescousse reprise");
    const reste = activite.restantes - 1;
    if (premierSauveteur) {
      activite.noterPremierSauvetage(lieu.id);
      annoncer(`🚀 Premier sauveteur ! ${lieu.nom} vient d'arriver et tu es déjà là : +${POINTS_AMBASSADEUR.premierSauveteur} points`);
    } else annoncer(reste > 0 ? `🛟 Merci ! Encore ${reste} rescousse${reste > 1 ? "s" : ""} cette semaine` : "Dernière rescousse donnée, merci pour eux ! 🦸");
  };

  return (
    <View className="flex-1 bg-creme">
      {/* Fiche préparée en coulisses depuis le fil : sa barre claire ne s'applique que quand elle est vraiment affichée */}
      {focus ? <StatusBar style="light" /> : null}
      <ScrollView contentContainerStyle={contenuDefilant}>
        {/* Haut (mémorisé) tout de suite, suite (mémorisée) après l'animation d'arrivée : une rescousse ne redessine ni l'un ni l'autre */}
        <EnTeteFicheLieu
          lieu={lieu}
          km={calculerKmLieu(lieu, depart)}
          margeHaut={marges.top}
          onEnvoyer={ouvrirEnvoi}
          onAnnoncer={annoncer}
        />
        {/* « Tu passes chez eux ? » : demander l'addition, scanner, fidélité, réserver (mémorisé, relu avec tes visites) */}
        {/* Sans compte SOS Miam, pas de visite validée : la fiche dit pourquoi (CarteLieuNonVerifie, dans le haut) */}
        {verifie ? <BlocVisiteLieu lieu={lieu} /> : null}
        <SuiteFicheLieu lieu={lieu} age={age} />
      </ScrollView>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Retour"
        hitSlop={8}
        onPress={retour}
        style={{ top: marges.top + 8 }}
        className="absolute left-4 h-11 w-11 items-center justify-center rounded-full border-2 border-encre bg-white active:opacity-80"
      >
        <Ionicons name="arrow-back" size={20} color={couleurs.encre} />
      </Pressable>

      {/* Miam Safe, toujours à portée de pouce, en miroir du retour : les secours, un pote, le comptoir (même sans compte, les
          secours restent accessibles) */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Miam Safe"
        accessibilityHint="Tu ne te sens pas en sécurité ici ? Les secours, un pote, le comptoir"
        hitSlop={8}
        onPress={ouvrirMiamSafe}
        style={{ top: marges.top + 8 }}
        className="absolute right-4 h-11 w-11 items-center justify-center rounded-full border-2 border-encre bg-white active:opacity-80"
      >
        <Text className="text-lg">🚨</Text>
      </Pressable>

      {/* Libellés sans emoji : Bouton les fait lire tels quels, VoiceOver et TalkBack diraient « bouée de sauvetage » ; l'état (donnée ou pas) est dans le libellé */}
      <View style={{ paddingBottom: marges.bottom + 12 }} className="absolute inset-x-0 bottom-0 flex-row gap-3 border-t border-ligne bg-creme px-5 pt-3">
        {/* 3/5 pour « À la rescousse » : à moitié-moitié, le libellé passait sur deux lignes sous 440 pt de large.
            Lieu non vérifié : pas de rescousse comptée, on l'invite à nous rejoindre à la place (une rescousse déjà donnée
            se reprend encore : le bouton « Sauvé ! » reste, comme dans le menu du fil) */}
        {verifie || sauve ? (
          <Bouton
            className="flex-[3]"
            libelle={sauve ? "Sauvé !" : epuisee ? "Reviens lundi" : "À la rescousse"}
            variante={sauve ? "encre" : "jaune"}
            desactive={epuisee}
            indice={
              !avecCompte
                ? "Il te faut un compte pour donner une rescousse à ce lieu, une minute suffit"
                : sauve
                  ? "Reprend ta rescousse, elle te sera rendue pour un autre lieu"
                  : epuisee
                    ? "Plus de rescousse cette semaine, elles reviennent lundi"
                    : `Donne une de tes rescousses à ce lieu, il t'en reste ${activite.restantes} cette semaine`
            }
            onPress={basculerRescousse}
          />
        ) : (
          <Bouton className="flex-[3]" libelle="Inviter ce lieu" indice="Partage-lui le lien d'inscription, c'est gratuit" onPress={() => inviter(lieu)} />
        )}
        <Bouton
          className="flex-[2]"
          libelle="Y aller"
          variante="blanc"
          indice={Platform.OS === "ios" ? "Ouvre l'itinéraire dans Plans" : "Ouvre l'itinéraire dans ton app de cartes"}
          onPress={() => ouvrirItineraire(lieu)}
        />
      </View>

      {/* Préparée seulement au premier « Envoyer à un pote » : rien de plus à dessiner à l'arrivée sur la fiche */}
      {envoi !== "jamais" ? <EnvoyerAPote visible={envoi === "ouvert"} lieuId={lieu.id} onFermer={fermerEnvoi} /> : null}
      {miamSafe !== "jamais" ? (
        <FeuilleMiamSafe
          visible={miamSafe === "ouvert"}
          nomLieu={lieu.nom}
          engage={lireMiamSafeLieu(lieu.id).engage}
          avecCompte={avecCompte}
          onFermer={fermerMiamSafe}
          onMontrerEcran={() => apresFeuille(() => router.push("/miam-safe/comptoir"))}
          onCreerCompte={() => apresFeuille(() => exiger("miam-safe"))}
        />
      ) : null}
      <Annonce annonce={annonce} haut={marges.top + 60} onFin={finAnnonce} />
    </View>
  );
}
