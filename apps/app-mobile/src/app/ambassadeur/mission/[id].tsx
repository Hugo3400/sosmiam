import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Linking, Text, View } from "react-native";

import { RAYON_VALIDATION_M } from "@sos-miam/commun/regles/visites";
import type { MissionAmbassadeur } from "@sos-miam/commun/types/espace-ambassadeur";
import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import { Annonce } from "~/composants/interface/Annonce";
import { Bouton } from "~/composants/interface/Bouton";
import { ChampTexte } from "~/composants/interface/ChampTexte";
import { FeuilleConfirmation } from "~/composants/interface/FeuilleConfirmation";
import { EcranReglage } from "~/composants/reglages/EcranReglage";
import { FeuilleEchecVisite, type EchecVisite } from "~/composants/visites/FeuilleEchecVisite";
import type { ActionEchecVisite } from "~/composants/visites/MessageEchecVisite";
import { TYPES_MISSION_PAR_LANGUE } from "~/contenus/textes-espace-ambassadeur";
import { TEXTES_ECHEC_MISSION_PAR_LANGUE, TEXTES_MISSION_AMBASSADEUR_PAR_LANGUE } from "~/contenus/textes-espace-ambassadeur-mission";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { direChezLieuLangue } from "~/fonctions/langue/dire-chez-lieu-langue";
import { ecrireHeureLangue } from "~/fonctions/langue/ecrire-heure-langue";
import { ecrireJourLongLangue } from "~/fonctions/langue/ecrire-jour-long-langue";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { decrireEchecVisite } from "~/fonctions/visites/decrire-echec-visite";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserPositionValidation } from "~/hooks/utiliser-position-validation";
import { utiliserServices } from "~/hooks/utiliser-services";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import { enregistrerExplicationPositionVue, lireExplicationPositionVue } from "~/stockage/explication-position-vue";

const COMPTE_RENDU_MIN = 5;
const COMPTE_RENDU_MAX = 2000;

/** « Je suis sur place » : on lit la position, puis on l'envoie (l'équipe ne garde que l'heure) */
type EtapePresence = "repos" | "position" | "envoi";

/** Ce qui vaut la peine d'être retenté tout de suite (position floue, réseau, un peu loin…), comme pour une addition */
const A_REESSAYER: readonly ErreurService[] = [
  "position-refusee", "position-coupee", "position-introuvable", "position-imprecise", "position-perimee", "position-simulee", "hors-zone", "hors-ligne",
];

/**
 * Une mission : ce qu'il faut faire, où et avant quand, « 📍 Je suis sur place » (position vérifiée comme pour une visite, la
 * première fois expliquée), puis « J'ai fini la mission » avec un petit compte rendu pour l'équipe.
 */
export default function EcranMission() {
  const couleurs = utiliserCouleurs();
  const T = utiliserTextes(TEXTES_MISSION_AMBASSADEUR_PAR_LANGUE);
  const textesEchec = utiliserTextes(TEXTES_ECHEC_MISSION_PAR_LANGUE);
  const types = utiliserTextes(TYPES_MISSION_PAR_LANGUE);
  const { langue } = utiliserLangue();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { ambassadeur } = utiliserServices();
  const { lire: lirePosition } = utiliserPositionValidation();
  const [mission, setMission] = useState<MissionAmbassadeur | null | undefined>(undefined);
  const [compteRendu, setCompteRendu] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [annonce, setAnnonce] = useState<{ texte: string; numero: number } | null>(null);
  const [presence, setPresence] = useState<EtapePresence>("repos");
  const [explication, setExplication] = useState(false);
  const [echec, setEchec] = useState<EchecVisite | null>(null);
  // Une seule vérification à la fois, même sur deux appuis rapides
  const occupe = useRef(false);

  const recharger = useCallback(async () => {
    const r = await ambassadeur.listerMissions();
    setMission(r.ok ? (r.missions.find((m) => String(m.id) === id) ?? null) : null);
  }, [ambassadeur, id]);

  useEffect(() => {
    void recharger();
  }, [recharger]);

  /** Lit la position, puis la fait vérifier */
  const verifierPresence = useCallback(async () => {
    const cible = mission?.lieu?.position;
    if (!mission || !cible || occupe.current) return;
    occupe.current = true;
    try {
      setPresence("position");
      const lecture = await lirePosition();
      if (!lecture.ok) return setEchec({ erreur: lecture.erreur });
      setPresence("envoi");
      const r = await ambassadeur.signalerPresence(mission.id, lecture.position);
      if (!r.ok) {
        setEchec({ erreur: r.erreur, details: r.details });
        // Déjà pointée, ou plus à faire : l'écran se remet à jour
        if (r.erreur === "deja-sur-place" || r.erreur === "transition-interdite") void recharger();
        return;
      }
      vibrerLegerement();
      setMission(r.mission);
      setAnnonce({ texte: T.presenceNotee, numero: Date.now() });
    } finally {
      occupe.current = false;
      setPresence("repos");
    }
  }, [mission, lirePosition, ambassadeur, recharger, T]);

  /** La toute première fois, on dit pourquoi on lit la position (même mémoire que l'addition et le QR du comptoir) */
  const demanderPresence = useCallback(async () => {
    if (occupe.current) return;
    if (await lireExplicationPositionVue()) void verifierPresence();
    else setExplication(true);
  }, [verifierPresence]);

  if (mission === undefined) {
    return (
      <EcranReglage titre={T.chargement}>
        <ActivityIndicator color={couleurs.encre} />
      </EcranReglage>
    );
  }
  if (mission === null) {
    return (
      <EcranReglage titre={T.introuvable} sousTitre={T.introuvableDetail}>
        <Bouton libelle={T.retour} variante="blanc" onPress={() => router.back()} />
      </EcranReglage>
    );
  }

  const type = types[mission.type];
  const aFaire = mission.statut === "a-faire";
  const lieu = mission.lieu;
  // « ✓ Sur place à 15h42 », avec le jour si ce n'était pas aujourd'hui
  const pointee = mission.presenceVerifieeLe ? new Date(mission.presenceVerifieeLe) : null;
  const surPlace = pointee
    ? T.surPlace(pointee.toDateString() === new Date().toDateString() ? null : ecrireJourLongLangue(pointee, langue), ecrireHeureLangue(pointee, langue))
    : null;

  const actions: ActionEchecVisite[] = [];
  if (echec?.erreur === "position-bloquee" || echec?.erreur === "position-approximative") {
    actions.push({ libelle: T.ouvrirReglages, onPress: () => void Linking.openSettings().catch(() => {}) });
  }
  if (echec && A_REESSAYER.includes(echec.erreur)) {
    actions.push({ libelle: T.reessayer, variante: actions.length > 0 ? "blanc" : "jaune", onPress: () => void verifierPresence() });
  }

  async function terminer() {
    if (!mission) return;
    setEnCours(true);
    const r = await ambassadeur.terminerMission(mission.id, compteRendu.trim());
    setEnCours(false);
    if (!r.ok) return setAnnonce({ texte: decrireEchecVisite(r.erreur, r.details).texte, numero: Date.now() });
    vibrerLegerement();
    setMission(r.mission);
    setAnnonce({ texte: T.accomplie, numero: Date.now() });
  }

  return (
    <EcranReglage
      titre={mission.titre}
      sousTitre={T.sousTitre(type.emoji, type.nom, mission.echeance && aFaire ? ecrireJourLongLangue(mission.echeance, langue) : null)}
      boutonPrincipal={
        aFaire
          ? { libelle: enCours ? T.unInstant : T.fini, onPress: () => void terminer(), desactive: enCours || compteRendu.trim().length < COMPTE_RENDU_MIN }
          : undefined
      }
    >
      <View className="gap-5">
        {mission.detail ? <Text className="font-texte text-base leading-6 text-encre">{lierPonctuation(mission.detail)}</Text> : null}
        {lieu ? (
          <View className="gap-3 rounded-carte border-2 border-encre bg-carte p-4">
            <Text className="font-texte-gras text-base text-encre">{`${lieu.emoji} ${lieu.nom}`}</Text>
            <Text className="font-texte text-sm text-gris">{lieu.ville}</Text>
            {surPlace ? <Text className="font-texte-gras text-base text-encre">{surPlace}</Text> : null}
            {aFaire && !surPlace && lieu.position ? (
              <View className="gap-2">
                {presence === "repos" ? (
                  <Bouton
                    libelle={T.surPlaceBouton}
                    libelleLu={T.surPlaceBoutonLu}
                    indice={T.indiceSurPlace(direChezLieuLangue(lieu.nom, langue))}
                    onPress={() => void demanderPresence()}
                  />
                ) : (
                  // Même place que le bouton : rien ne saute pendant qu'on cherche ta position
                  <View
                    accessible
                    accessibilityLabel={T.presence[presence]}
                    accessibilityLiveRegion="polite"
                    className="min-h-[60px] flex-row items-center justify-center gap-3 rounded-full border-2 border-encre bg-carte px-6 py-2"
                  >
                    <ActivityIndicator color={couleurs.encre} />
                    <Text className="font-texte-gras text-base text-encre">{T.presence[presence]}</Text>
                  </View>
                )}
                <Text className="font-texte text-sm text-gris">{T.positionNonGardee}</Text>
              </View>
            ) : null}
            <Bouton libelle={T.voirFiche} variante="blanc" petit onPress={() => router.push({ pathname: "/lieu/[id]", params: { id: String(lieu.id) } })} />
          </View>
        ) : null}
        {aFaire ? (
          <ChampTexte
            libelle={T.compteRendu}
            valeur={compteRendu}
            onChangeTexte={setCompteRendu}
            multiline
            maxLength={COMPTE_RENDU_MAX}
            placeholder={T.placeholder}
            aide={T.aide(COMPTE_RENDU_MIN)}
          />
        ) : (
          <View className="gap-2 rounded-carte border-2 border-encre bg-creme p-4">
            <Text className="font-texte-gras text-base text-encre">{mission.statut === "annulee" ? T.annulee : T.faiteLe(mission.faiteLe ? ecrireJourLongLangue(mission.faiteLe, langue) : "")}</Text>
            {mission.compteRendu ? <Text className="font-texte text-[15px] leading-[21px] text-encre">{mission.compteRendu}</Text> : null}
          </View>
        )}
      </View>
      <Annonce annonce={annonce} haut={8} onFin={() => setAnnonce(null)} />
      <FeuilleConfirmation
        visible={explication}
        emoji="📍"
        titre={T.verifTitre}
        detail={T.verifDetail(lieu ? direChezLieuLangue(lieu.nom, langue) : T.surPlaceSeul, RAYON_VALIDATION_M)}
        libelleConfirmer={T.verifConfirmer}
        libelleRester={T.verifRester}
        indiceRester={T.verifIndiceRester}
        onConfirmer={() => void enregistrerExplicationPositionVue()}
        onFermer={() => setExplication(false)}
        onRefermee={() => void verifierPresence()}
      />
      <FeuilleEchecVisite echec={echec} lieuNom={lieu?.nom} textes={textesEchec} actions={actions} onFermer={() => setEchec(null)} />
    </EcranReglage>
  );
}
