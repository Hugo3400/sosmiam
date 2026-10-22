import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { DELAI_ANNULATION_LIEU_MS } from "@sos-miam/commun/regles/visites";
import { BarreEtatTheme } from "~/composants/interface/BarreEtatTheme";
import { FeuilleMiamSafe } from "~/composants/miam-safe/FeuilleMiamSafe";
import { QuestionSentiBien } from "~/composants/miam-safe/QuestionSentiBien";
import { CarteAttenteAddition } from "~/composants/visites/CarteAttenteAddition";
import { CelebrationVisite } from "~/composants/visites/CelebrationVisite";
import { EtatVisiteTerminee } from "~/composants/visites/EtatVisiteTerminee";
import { FeuilleContestation } from "~/composants/visites/FeuilleContestation";
import { MessageEchecVisite } from "~/composants/visites/MessageEchecVisite";
import { deplacerFocusLecteurEcran } from "~/fonctions/interaction/deplacer-focus-lecteur-ecran";
import { ecrireAvatarPublic } from "~/fonctions/compte/ecrire-avatar-public";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserLieuParId } from "~/hooks/utiliser-lieu-par-id";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import { utiliserVisiteEnDirect } from "~/hooks/utiliser-visite-en-direct";

/** Visites déjà fêtées depuis le lancement de l'app : rouvertes, elles montrent leur résumé (ou « C'est déjà validé ») */
const visitesFetees = new Set<number>();

// Le temps que l'écran (ou le nouvel état) soit posé avant d'y placer le lecteur d'écran
const DELAI_FOCUS_MS = 450;

/**
 * Une visite (modal), suivie en direct. Addition en attente : le code à montrer en payant, et en démo de quoi jouer le lieu.
 * Validée : la petite fête juste après (scan du comptoir, réponse du lieu pendant que l'écran est ouvert, ou première
 * ouverture dans le quart d'heure), sinon le résumé. Refusée, expirée, annulée ou retirée : ce qui s'est passé et quoi faire.
 * À chaque changement d'état, le lecteur d'écran se place sur le titre (la fête, elle, se lit d'un bloc).
 */
export default function EcranVisite() {
  const couleurs = utiliserCouleurs();
  const router = useRouter();
  const navigation = useNavigation();
  const { id, celebrer, deja } = useLocalSearchParams<{ id: string; celebrer?: string; deja?: string }>();
  const visiteId = typeof id === "string" && /^\d+$/.test(id) ? Number(id) : null;
  const { profil, avatar } = utiliserProfil();
  const { pret, resultat, echec } = utiliserVisiteEnDirect(visiteId);
  const refTitre = useRef<Text>(null);
  const [contestation, setContestation] = useState(false);
  // Miam Safe pendant une visite (décidé le 9 octobre 2026) : le même bouton 🚨 que sur la fiche du lieu
  const [miamSafeOuvert, setMiamSafeOuvert] = useState(false);
  // La fête en cours, et si cette visite avait déjà été fêtée (un second scan du même QR : « C'est déjà validé »)
  const [fete, setFete] = useState<{ deja: boolean } | null>(null);
  const vueEnAttente = useRef(false);
  const feteDemandee = useRef(celebrer === "1");

  const visite = resultat?.visite ?? null;
  const idLu = visite?.id ?? null;
  const statut = visite?.statut ?? null;
  const valideLe = visite?.valideLe ?? null;

  useEffect(() => {
    if (idLu === null) return;
    if (statut === "demandee") {
      vueEnAttente.current = true;
      return;
    }
    if (statut !== "validee") return;
    const recente = valideLe !== null && Date.now() - Date.parse(valideLe) < DELAI_ANNULATION_LIEU_MS;
    const dejaFetee = visitesFetees.has(idLu);
    const aFeter = feteDemandee.current || vueEnAttente.current || (recente && !dejaFetee);
    const deuxiemeScan = feteDemandee.current && (dejaFetee || deja === "1");
    feteDemandee.current = false;
    vueEnAttente.current = false;
    if (!aFeter) return;
    visitesFetees.add(idLu);
    setFete({ deja: deuxiemeScan });
  }, [idLu, statut, valideLe, deja]);

  const enFete = fete !== null && resultat !== null && statut === "validee";
  const etatAffiche = !pret ? null : enFete ? "fete" : (statut ?? "echec");

  // Une seule annonce par changement : VoiceOver lit le titre du nouvel état (la fête place le lecteur elle-même)
  useEffect(() => {
    if (etatAffiche === null || etatAffiche === "fete") return;
    const minuterie = setTimeout(() => deplacerFocusLecteurEcran(refTitre.current), DELAI_FOCUS_MS);
    return () => clearTimeout(minuterie);
  }, [etatAffiche]);

  const lieuId = visite?.lieu.id ?? null;
  // Dans le lieu : addition demandée, ou visite validée (on y est encore, souvent)
  const dansLeLieu = statut === "demandee" || statut === "validee";
  const { lieu: lieuConnu } = utiliserLieuParId(lieuId);
  // Écran réservé aux inscrits (PileRacine) : le lieu de la visite s'affiche tel quel, bar compris
  const lieu = lieuConnu ?? null;

  // Comme le voit l'équipe du lieu : prénom, initiale du nom, emoji ou Miami (jamais la photo)
  const initiale = profil?.nom?.trim().charAt(0).toLocaleUpperCase("fr-FR");
  const signature = profil ? (initiale ? `${profil.prenom} ${initiale}.` : profil.prenom) : "Toi";
  const emoji = ecrireAvatarPublic(avatar) ?? "🙂";

  // Ouverte par-dessus le parcours du Scan (« Tu es chez qui ? », le scanner) : on referme tout le parcours d'un coup, pour
  // retrouver l'onglet (ou la fiche) d'où l'on était parti, plutôt que de retomber sur « Tu es chez qui ? » une fois la visite faite
  const fermer = () => {
    const etat = navigation.getState();
    const routes = etat?.routes ?? [];
    const ici = etat?.index ?? routes.length - 1;
    const parcours = routes.findIndex((r, i) => i < ici && r.name === "scan");
    if (parcours > 0) router.dismiss(ici - parcours + 1);
    else if (navigation.canGoBack()) navigation.goBack();
    else router.replace("/scan");
  };

  let contenu;
  if (!pret) {
    contenu = (
      <View accessible accessibilityLabel="On ouvre ta visite…" className="flex-1 items-center justify-center">
        <ActivityIndicator color={couleurs.encre} size="large" />
      </View>
    );
  } else if (!resultat || !visite) {
    contenu = (
      <ScrollView contentContainerClassName="flex-grow justify-center px-6 pb-10">
        <MessageEchecVisite
          erreur={echec?.erreur ?? "introuvable"}
          details={echec?.details}
          refTitre={refTitre}
          actions={[{ libelle: "Fermer", onPress: fermer }]}
        />
      </ScrollView>
    );
  } else if (enFete) {
    contenu = <CelebrationVisite resultat={fete.deja ? { ...resultat, dejaValidee: true } : resultat} onFermer={fermer} />;
  } else {
    contenu = (
      <ScrollView contentContainerClassName="gap-6 px-5 pb-10 pt-2">
        {visite.statut === "demandee" ? (
          <CarteAttenteAddition visite={visite} prenom={signature} avatar={emoji} refTitre={refTitre} />
        ) : (
          <EtatVisiteTerminee resultat={resultat} lieu={lieu} refTitre={refTitre} onContester={() => setContestation(true)} />
        )}
        {/* Miam Safe : après une visite validée, « Tu t'es senti·e bien ici ? » */}
        {visite.statut === "validee" ? <QuestionSentiBien lieuId={visite.lieu.id} nomLieu={visite.lieu.nom} /> : null}
      </ScrollView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: couleurs.creme }} edges={["top", "bottom"]}>
      <BarreEtatTheme />
      <View className="min-h-14 flex-row items-center justify-between px-5 pb-2 pt-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fermer"
          hitSlop={8}
          onPress={fermer}
          className="h-11 w-11 items-center justify-center rounded-full border-2 border-encre bg-carte active:opacity-80"
        >
          <Ionicons name="close" size={20} color={couleurs.encre} />
        </Pressable>
        <View className="flex-row items-center gap-3">
          {/* La fête porte sa propre étiquette « Démo » */}
          {visite?.demo && !enFete ? (
            <View
              accessible
              accessibilityLabel="Visite de démo : elle reste sur ce téléphone"
              className="rotate-3 rounded-full border-2 border-encre bg-nuit px-3 py-0.5"
            >
              <Text className="font-texte-gras text-xs text-jaune">Démo</Text>
            </View>
          ) : null}
          {visite && dansLeLieu && !enFete ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Miam Safe"
              accessibilityHint="Tu ne te sens pas en sécurité ici ? Les secours, un pote, le comptoir"
              hitSlop={8}
              onPress={() => setMiamSafeOuvert(true)}
              className="h-11 w-11 items-center justify-center rounded-full border-2 border-encre bg-carte active:opacity-80"
            >
              <Text className="text-lg">🚨</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
      {contenu}
      <FeuilleContestation visible={contestation} visite={visite} onFermer={() => setContestation(false)} />
      {visite ? (
        <FeuilleMiamSafe
          visible={miamSafeOuvert}
          lieuId={visite.lieu.id}
          nomLieu={visite.lieu.nom}
          avecCompte
          onFermer={() => setMiamSafeOuvert(false)}
          onCreerCompte={() => setMiamSafeOuvert(false)}
        />
      ) : null}
    </SafeAreaView>
  );
}
