import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AccessibilityInfo, Platform, Pressable, Text, View } from "react-native";
import Animated, { FadeInUp, FadeOutDown, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";

import type { StatutVisite, Visite } from "@sos-miam/commun/types/visite";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { formaterCodeLu } from "~/fonctions/visites/formater-code-lu";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import { utiliserServices } from "~/hooks/utiliser-services";
import { utiliserVisites } from "~/hooks/utiliser-visites";
import couleurs from "~/theme/couleurs";

type Props = {
  /** Rien n'est affiché (le fil plein écran) ; l'issue d'une demande est quand même repérée et annoncée */
  masque: boolean;
  /** La demande en cours est déjà à l'écran (l'onglet Scan a sa carte) : seule l'issue d'une demande s'affiche ici */
  demandeAffichee: boolean;
};

/** Ce qu'une demande devient quand le lieu a répondu (ou pas) : le bandeau le dit une fois, puis s'efface */
type StatutIssue = Extract<StatutVisite, "validee" | "refusee" | "expiree">;
type Issue = { visite: Visite; statut: StatutIssue };
const STATUTS_ISSUE: readonly StatutVisite[] = ["validee", "refusee", "expiree"];
const estStatutIssue = (statut: StatutVisite): statut is StatutIssue => STATUTS_ISSUE.includes(statut);

// Une issue pas vue au bout d'un quart d'heure n'est plus une nouvelle : le bandeau s'en va tout seul
const DUREE_ISSUE_MS = 15 * 60_000;

const ISSUES: Record<StatutIssue, { emoji: string; etiquette: string; fond: string; texte: (v: Visite) => string; annonce: (v: Visite) => string }> = {
  validee: {
    emoji: "🎉",
    etiquette: "C'est validé !",
    fond: "bg-jaune",
    texte: (v) => `${v.lieu.nom} · +${v.points} points${v.tampon ? " et un tampon" : ""}`,
    annonce: (v) => `${v.lieu.nom} a validé ta visite : plus ${v.points} points${v.tampon ? " et un tampon" : ""} !`,
  },
  refusee: {
    emoji: "🧾",
    etiquette: "Pas validée cette fois",
    fond: "bg-white",
    texte: (v) => `${v.lieu.nom} · voir pourquoi`,
    annonce: (v) => `${v.lieu.nom} n'a pas validé ta visite cette fois.`,
  },
  expiree: {
    emoji: "😴",
    etiquette: "Ta demande s'est endormie",
    fond: "bg-white",
    texte: (v) => `${v.lieu.nom} · 30 min sans réponse`,
    annonce: (v) => `Ta demande d'addition à ${v.lieu.nom} s'est endormie : 30 minutes sans réponse.`,
  },
};

function annoncer(texte: string) {
  // iOS : l'annonce attend la fin de ce que VoiceOver est en train de lire, au lieu de le couper
  if (Platform.OS === "ios") AccessibilityInfo.announceForAccessibilityWithOptions(texte, { queue: true });
  else AccessibilityInfo.announceForAccessibility(texte);
}

/**
 * Repère le moment où ta demande en cours se termine (réglée, refusée ou endormie) pendant que tu es ailleurs que sur
 * son écran : c'est l'issue à montrer. Rien si tu regardais la demande à ce moment-là, ou si c'est toi qui l'as annulée.
 */
function utiliserIssueDemande(): { issue: Issue | null; oublier: () => void } {
  const services = utiliserServices();
  const inscrit = utiliserProfil().profil !== null;
  const { enCours, visites } = utiliserVisites();
  const chemin = usePathname();
  const [issue, setIssue] = useState<Issue | null>(null);
  // La dernière demande en cours vue, et l'écran affiché : lus au moment où la demande se termine
  const suivie = useRef<Visite | null>(null);
  const cheminActuel = useRef(chemin);
  useLayoutEffect(() => {
    cheminActuel.current = chemin;
  }, [chemin]);
  const monte = useRef(true);
  useEffect(
    () => () => {
      monte.current = false;
    },
    [],
  );

  useEffect(() => {
    const avant = suivie.current;
    suivie.current = enCours;
    // Une nouvelle demande passe devant l'ancienne nouvelle
    if (enCours) setIssue(null);
    if (!avant || avant.id === enCours?.id || !inscrit) return;
    // Tu étais sur l'écran de la demande : tu as tout vu là-bas
    if (cheminActuel.current === `/visite/${avant.id}`) return;
    const retenir = (visite: Visite) => {
      // Ignorée si une autre demande est partie entre-temps
      if (!monte.current || suivie.current !== null || !estStatutIssue(visite.statut)) return;
      setIssue({ visite, statut: visite.statut });
      annoncer(ISSUES[visite.statut].annonce(visite));
    };
    const trouvee = visites.find((v) => v.id === avant.id);
    if (trouvee) retenir(trouvee);
    else
      services.visites.lireVisite(avant.id).then(
        (reponse) => {
          if (reponse.ok) retenir(reponse.visite);
        },
        () => {},
      );
  }, [enCours, visites, inscrit, services]);

  // Ouverte autrement (onglet Scan, Mes visites) : c'est vu
  useEffect(() => {
    if (issue && chemin === `/visite/${issue.visite.id}`) setIssue(null);
  }, [chemin, issue]);

  useEffect(() => {
    if (!issue) return;
    const minuterie = setTimeout(() => setIssue(null), DUREE_ISSUE_MS);
    return () => clearTimeout(minuterie);
  }, [issue]);

  return { issue, oublier: () => setIssue(null) };
}

/** Le petit point qui bat doucement, comme un « en direct » (immobile si les animations sont réduites) */
function utiliserStylePoint(actif: boolean) {
  const animationsReduites = useReducedMotion();
  const opacite = useSharedValue(1);
  useEffect(() => {
    opacite.value = actif && !animationsReduites ? withRepeat(withTiming(0.25, { duration: 800 }), -1, true) : 1;
  }, [actif, animationsReduites, opacite]);
  return useAnimatedStyle(() => ({ opacity: opacite.value }));
}

/**
 * Bandeau posé au-dessus de la barre d'onglets : ta demande d'addition en attente (le lieu et le code à montrer), puis,
 * quand le lieu a répondu pendant que tu étais ailleurs, son issue (« C'est validé ! », pas validée, endormie) jusqu'à ce
 * que tu la regardes ou la fermes. Un toucher ouvre la demande ; la célébration attend la première ouverture.
 */
export function BandeauVisiteEnCours({ masque, demandeAffichee }: Props) {
  const router = useRouter();
  const animationsReduites = useReducedMotion();
  const { enCours } = utiliserVisites();
  const { issue, oublier } = utiliserIssueDemande();
  const enAttente = enCours && !demandeAffichee ? enCours : null;
  const stylePoint = utiliserStylePoint(!masque && enAttente !== null);

  if (masque || (!enAttente && !issue)) return null;
  const entree = animationsReduites ? undefined : FadeInUp.duration(220);
  const sortie = animationsReduites ? undefined : FadeOutDown.duration(180);

  if (enAttente) {
    const code = enAttente.code ?? "";
    return (
      <Animated.View key={`attente-${enAttente.id}`} entering={entree} exiting={sortie} style={{ width: "100%" }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Addition demandée, ${enAttente.lieu.nom}${code ? `, ton code : ${formaterCodeLu(code)}` : ""}`}
          accessibilityHint="Ouvre ta demande en cours"
          onPress={() => {
            vibrerLegerement();
            router.push({ pathname: "/visite/[id]", params: { id: String(enAttente.id) } });
          }}
          className="min-h-14 flex-row items-center gap-3 rounded-2xl border-2 border-encre bg-encre py-2 pl-4 pr-3 active:opacity-90"
        >
          <View className="h-2.5 w-2.5">
            <Animated.View style={[{ width: 10, height: 10, borderRadius: 5, backgroundColor: couleurs.tomate }, stylePoint]} />
          </View>
          <View className="flex-1">
            <Text className="font-texte-gras text-[11px] uppercase tracking-wide text-jaune">Addition demandée</Text>
            <Text numberOfLines={1} className="font-texte-gras text-[15px] text-white">
              {enAttente.lieu.emoji} {enAttente.lieu.nom}
            </Text>
          </View>
          {code ? (
            <View className="rounded-xl bg-jaune px-2.5 py-1">
              <Text className="font-titre text-lg tracking-[3px] text-encre">{code}</Text>
            </View>
          ) : null}
          <Ionicons name="chevron-forward" size={18} color={couleurs.jaune} />
        </Pressable>
      </Animated.View>
    );
  }

  if (!issue) return null;
  const { visite, statut } = issue;
  const forme = ISSUES[statut];
  return (
    <Animated.View key={`issue-${visite.id}`} entering={entree} exiting={sortie} style={{ width: "100%" }}>
      <View className={`min-h-14 flex-row items-center rounded-2xl border-2 border-encre ${forme.fond}`}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${forme.etiquette} ${forme.texte(visite)}`}
          accessibilityHint={statut === "validee" ? "Ouvre ta visite pour fêter ça" : "Ouvre ta demande"}
          onPress={() => {
            vibrerLegerement();
            oublier();
            // Réglée pendant que tu étais ailleurs : la célébration t'attend à l'ouverture
            const params = statut === "validee" ? { id: String(visite.id), celebrer: "1" } : { id: String(visite.id) };
            router.push({ pathname: "/visite/[id]", params });
          }}
          className="flex-1 flex-row items-center gap-3 py-2 pl-4 active:opacity-80"
        >
          <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-xl">
            {forme.emoji}
          </Text>
          <View className="flex-1">
            <Text className="font-texte-gras text-[11px] uppercase tracking-wide text-encre">{forme.etiquette}</Text>
            <Text numberOfLines={1} className="font-texte-gras text-[15px] text-encre">
              {forme.texte(visite)}
            </Text>
          </View>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fermer ce message"
          hitSlop={4}
          onPress={oublier}
          className="h-12 w-12 items-center justify-center active:opacity-60"
        >
          <Ionicons name="close" size={20} color={couleurs.encre} />
        </Pressable>
      </View>
    </Animated.View>
  );
}
