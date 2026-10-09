import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { AccessibilityInfo, ActivityIndicator, Linking, Text, View } from "react-native";

import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import type { Lieu } from "@sos-miam/commun/types/lieu";
import { Bouton } from "~/composants/interface/Bouton";
import { FeuilleEchecVisite, type EchecVisite } from "~/composants/visites/FeuilleEchecVisite";
import { FeuillePositionVisite } from "~/composants/visites/FeuillePositionVisite";
import type { ActionEchecVisite } from "~/composants/visites/MessageEchecVisite";
import { direChezLieu } from "~/fonctions/visites/dire-chez-lieu";
import { utiliserDemandeCompte } from "~/hooks/utiliser-demande-compte";
import { utiliserPositionExpliquee } from "~/hooks/utiliser-position-expliquee";
import { utiliserServices } from "~/hooks/utiliser-services";
import couleurs from "~/theme/couleurs";

type Props = {
  lieu: Lieu;
  variante?: "jaune" | "blanc";
  libelle?: string;
};

type Etape = "repos" | "position" | "envoi";

const TEXTES_ETAPE: Record<Exclude<Etape, "repos">, string> = {
  position: "On regarde où tu es…",
  envoi: "On envoie ta demande…",
};

/** Ce qui vaut la peine d'être retenté tout de suite (position floue, réseau, un peu loin…) */
const A_REESSAYER: readonly ErreurService[] = [
  "position-refusee",
  "position-coupee",
  "position-introuvable",
  "position-approximative",
  "position-imprecise",
  "position-perimee",
  "position-simulee",
  "hors-zone",
  "hors-ligne",
];

// Une étape qui dure plus que ça est dite à VoiceOver (en démo, tout va trop vite pour la peine)
const DELAI_ANNONCE_ETAPE = 700;

/**
 * « Demander l'addition SOS Miam » : vérifie que tu as un compte, explique la position la première fois, la lit, puis
 * envoie la demande et ouvre l'écran du code. Si ça coince (position, réseau, une addition déjà en attente…), une feuille
 * dit pourquoi, avec « Réessayer », « Ouvrir les réglages » ou « Voir ma demande ». Une seule demande à la fois.
 */
export function BoutonDemanderAddition({ lieu, variante = "jaune", libelle = "Demander l'addition SOS Miam" }: Props) {
  const router = useRouter();
  const services = utiliserServices();
  const demanderCompte = utiliserDemandeCompte();
  const position = utiliserPositionExpliquee();
  const [etape, setEtape] = useState<Etape>("repos");
  const [echec, setEchec] = useState<EchecVisite | null>(null);
  const occupe = useRef(false);
  const monte = useRef(true);

  useEffect(() => {
    monte.current = true;
    return () => {
      monte.current = false;
    };
  }, []);

  useEffect(() => {
    if (etape === "repos") return;
    const attente = setTimeout(() => AccessibilityInfo.announceForAccessibility(TEXTES_ETAPE[etape]), DELAI_ANNONCE_ETAPE);
    return () => clearTimeout(attente);
  }, [etape]);

  const { lire } = position;
  const demander = useCallback(async () => {
    if (occupe.current || !demanderCompte("addition")) return;
    // Version publiée sans comptes : inutile de lire la position pour rien
    if (services.source === "indisponible") {
      setEchec({ erreur: "service-indisponible" });
      return;
    }
    occupe.current = true;
    try {
      setEtape("position");
      const lecture = await lire(lieu.position ?? null, lieu.nom);
      if (!lecture.ok) {
        if (lecture.erreur !== "annulee" && monte.current) setEchec({ erreur: lecture.erreur });
        return;
      }
      if (monte.current) setEtape("envoi");
      const reponse = await services.visites.demanderAddition(lieu.id, lecture.position);
      if (!monte.current) return;
      if (reponse.ok) router.push({ pathname: "/visite/[id]", params: { id: String(reponse.visite.id) } });
      else setEchec({ erreur: reponse.erreur, details: reponse.details });
    } catch {
      if (monte.current) setEchec({ erreur: "hors-ligne" });
    } finally {
      occupe.current = false;
      if (monte.current) setEtape("repos");
    }
  }, [demanderCompte, services, lire, lieu, router]);

  /** Ouvre la demande déjà en attente (chez ce lieu ou ailleurs) */
  const voirMaDemande = useCallback(async () => {
    const liste = await services.visites.listerVisites().catch(() => null);
    if (liste?.ok && liste.enCours) router.push({ pathname: "/visite/[id]", params: { id: String(liste.enCours.id) } });
  }, [services, router]);

  const actions: ActionEchecVisite[] = [];
  if (echec?.erreur === "demande-en-cours") actions.push({ libelle: "Voir ma demande", onPress: () => void voirMaDemande() });
  if (echec?.erreur === "position-bloquee" || echec?.erreur === "position-approximative") {
    actions.push({ libelle: "Ouvrir les réglages", onPress: () => void Linking.openSettings().catch(() => {}) });
  }
  if (echec && A_REESSAYER.includes(echec.erreur)) {
    actions.push({ libelle: "Réessayer", variante: actions.length > 0 ? "blanc" : "jaune", onPress: () => void demander() });
  }

  return (
    <>
      {etape === "repos" ? (
        <Bouton
          libelle={libelle}
          // Dans « Tu es chez qui ? », chaque ligne dit « Demander l'addition ici » : VoiceOver, lui, entend le lieu
          libelleLu={libelle.endsWith(" ici") ? `${libelle.slice(0, -" ici".length)} ${direChezLieu(lieu.nom)}` : undefined}
          variante={variante}
          indice={`On vérifie que tu es bien ${direChezLieu(lieu.nom)}, puis tu reçois un code à montrer en payant`}
          onPress={() => void demander()}
        />
      ) : (
        // Même place que le bouton : rien ne saute pendant qu'on cherche ta position
        <View
          accessible
          accessibilityLabel={TEXTES_ETAPE[etape]}
          accessibilityLiveRegion="polite"
          className="min-h-[60px] flex-row items-center justify-center gap-3 rounded-full border-2 border-encre bg-white px-6 py-2"
        >
          <ActivityIndicator color={couleurs.encre} />
          <Text className="font-texte-gras text-base text-encre">{TEXTES_ETAPE[etape]}</Text>
        </View>
      )}
      <FeuillePositionVisite {...position.propsFeuille} />
      <FeuilleEchecVisite echec={echec} lieuNom={lieu.nom} actions={actions} onFermer={() => setEchec(null)} />
    </>
  );
}
