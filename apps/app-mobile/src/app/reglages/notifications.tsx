import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, ActivityIndicator, Text, View } from "react-native";

import { Interrupteur } from "~/composants/interface/Interrupteur";
import { Pastille } from "~/composants/interface/Pastille";
import { EcranReglage } from "~/composants/reglages/EcranReglage";
import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import { formaterHeureLangue } from "@sos-miam/commun/fonctions/langue/formater-heure-langue";
import type { Langue } from "@sos-miam/commun/regles/langues";
import { TEXTES_REGLAGES_NOTIFICATIONS_PAR_LANGUE } from "~/contenus/textes-reglages-notifications";
import { TYPES_NOTIFICATIONS_PAR_LANGUE } from "~/contenus/types-notifications";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import {
  enregistrerReglagesNotifications,
  lireReglagesNotifications,
  type ReglagesNotifications as ChoixNotifications,
  type TypeNotification,
} from "~/stockage/reglages-notifications";
import { utiliserAppareilPush } from "~/hooks/utiliser-appareil-push";
import { utiliserChoixOffresEnAttente } from "~/hooks/utiliser-choix-offres-en-attente";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";

/** Heures proposées pour le mode nuit (au format HH:MM du stockage) */
const HEURES_DEBUT = ["21:00", "22:00", "23:00", "00:00"];
const HEURES_FIN = ["07:00", "08:00", "09:00", "10:00"];

/** Heure affichée comme ailleurs dans l'app : « 23h », « 9h », et « minuit » plutôt que « 0h ». */
function afficherHeure(heure: string, langue: Langue): string {
  if (heure === "00:00") return choisirTextes(TEXTES_REGLAGES_NOTIFICATIONS_PAR_LANGUE, langue).minuit;
  const [h, m] = heure.split(":").map(Number);
  return formaterHeureLangue(h, m, langue);
}

/** Réglages > Notifications : tout couper, choisir les sortes d'alertes et le mode nuit. Chaque choix est gardé tout de suite. */
export default function ReglagesNotifications() {
  const couleurs = utiliserCouleurs();
  const T = utiliserTextes(TEXTES_REGLAGES_NOTIFICATIONS_PAR_LANGUE);
  const typesNotifications = utiliserTextes(TYPES_NOTIFICATIONS_PAR_LANGUE);
  const { langue } = utiliserLangue();
  const [reglages, setReglages] = useState<ChoixNotifications | null>(null);
  // Dernière version connue, pour enchaîner deux changements rapides sans en perdre un
  const derniers = useRef<ChoixNotifications | null>(null);
  const [echecEnregistrement, setEchecEnregistrement] = useState(false);
  const telephone = utiliserAppareilPush();
  const choixOffresEnAttente = utiliserChoixOffresEnAttente();

  useEffect(() => {
    let monte = true;
    lireReglagesNotifications().then((lus) => {
      if (!monte) return;
      derniers.current = lus;
      setReglages(lus);
    });
    return () => {
      monte = false;
    };
  }, []);

  function modifier(transformer: (actuels: ChoixNotifications) => ChoixNotifications) {
    if (!derniers.current) return;
    const nouveaux = transformer(derniers.current);
    derniers.current = nouveaux;
    setReglages(nouveaux);
    enregistrerReglagesNotifications(nouveaux).then(
      () => setEchecEnregistrement(false),
      () => {
        setEchecEnregistrement(true);
        AccessibilityInfo.announceForAccessibility(T.echec);
      },
    );
  }

  const changerType = (type: TypeNotification, valeur: boolean) => {
    modifier((r) => ({ ...r, types: { ...r.types, [type]: valeur } }));
    if (type === "offre" && derniers.current?.actives) void telephone.choisir(valeur ? "oui" : "non");
  };
  const changerSilence = (silence: Partial<ChoixNotifications["silence"]>) => modifier((r) => ({ ...r, silence: { ...r.silence, ...silence } }));

  return (
    <EcranReglage titre={T.titre} sousTitre={T.sousTitre}>
      <View
        accessible
        accessibilityLabel={T.introduction}
        className="flex-row gap-3 rounded-carte border-2 border-encre bg-jaune-clair p-4"
      >
        <Text className="text-xl">🔔</Text>
        <Text className="flex-1 font-texte text-sm leading-5 text-encre">
          {lierPonctuation(T.introduction)}
        </Text>
      </View>

      {!reglages ? (
        <View className="mt-8 items-center">
          <ActivityIndicator color={couleurs.encre} accessibilityLabel={T.chargement} />
        </View>
      ) : (
        <>
          <View className="mt-4">
            <Interrupteur
              emoji="🔔"
              titre={T.recevoir}
              detail={T.recevoirDetail}
              valeur={reglages.actives}
              onChanger={(actives) => {
                modifier((r) => ({ ...r, actives }));
                // Allumé : on inscrit le téléphone (la question du système si besoin) ; coupé : le serveur l'oublie
                void (actives ? telephone.inscrire() : telephone.couper());
              }}
            />
          </View>

          <Text accessibilityRole="header" className="mt-8 font-titre-gras text-xl text-encre">
            {T.interesse}
          </Text>
          {!reglages.actives ? (
            <Text className="mt-1 font-texte text-sm leading-5 text-gris">
              {lierPonctuation(T.toutCoupe)}
            </Text>
          ) : null}
          <View className="mt-1">
            {typesNotifications
              .filter((t) => t.groupe === "lieux")
              .map((t) => (
                <Interrupteur
                  key={t.type}
                  emoji={t.emoji}
                  titre={t.titre}
                  detail={t.detail}
                  valeur={reglages.types[t.type]}
                  desactive={!reglages.actives}
                  onChanger={(valeur) => changerType(t.type, valeur)}
                />
              ))}
          </View>
          {choixOffresEnAttente ? (
            <Text accessibilityLiveRegion="polite" className="mt-2 font-texte text-sm leading-5 text-gris">
              {lierPonctuation(reglages.actives ? T.offresEnAttente : T.chutEnAttente)}
            </Text>
          ) : null}

          <Text accessibilityRole="header" className="mt-8 font-titre-gras text-xl text-encre">
            {T.abonnements}
          </Text>
          <View className="mt-1">
            {typesNotifications
              .filter((t) => t.groupe === "abonnements")
              .map((t) => (
                <Interrupteur
                  key={t.type}
                  emoji={t.emoji}
                  titre={t.titre}
                  detail={t.detail}
                  valeur={reglages.types[t.type]}
                  desactive={!reglages.actives}
                  onChanger={(valeur) => changerType(t.type, valeur)}
                />
              ))}
          </View>

          <Text accessibilityRole="header" className="mt-8 font-titre-gras text-xl text-encre">
            {T.nuit}
          </Text>
          <View className="mt-1">
            <Interrupteur
              emoji="🌙"
              titre={T.modeNuit}
              detail={T.modeNuitDetail}
              valeur={reglages.silence.actif}
              desactive={!reglages.actives}
              onChanger={(actif) => changerSilence({ actif })}
            />
          </View>

          {reglages.actives && reglages.silence.actif ? (
            <View className="mt-4 gap-4">
              <View className="gap-2">
                <Text className="font-texte-semi text-base text-encre">{T.aPartirDe}</Text>
                <View accessibilityRole="radiogroup" accessibilityLabel={T.debutLu} className="flex-row flex-wrap gap-2">
                  {HEURES_DEBUT.map((heure, i) => (
                    <Pastille
                      key={heure}
                      role="radio"
                      libelle={afficherHeure(heure, langue)}
                      position={i + 1}
                      total={HEURES_DEBUT.length}
                      choisi={reglages.silence.de === heure}
                      onPress={() => changerSilence({ de: heure })}
                    />
                  ))}
                </View>
              </View>
              <View className="gap-2">
                <Text className="font-texte-semi text-base text-encre">{T.jusqua}</Text>
                <View accessibilityRole="radiogroup" accessibilityLabel={T.finLu} className="flex-row flex-wrap gap-2">
                  {HEURES_FIN.map((heure, i) => (
                    <Pastille
                      key={heure}
                      role="radio"
                      libelle={afficherHeure(heure, langue)}
                      position={i + 1}
                      total={HEURES_FIN.length}
                      choisi={reglages.silence.a === heure}
                      onPress={() => changerSilence({ a: heure })}
                    />
                  ))}
                </View>
              </View>
              <View className="rounded-carte bg-carte px-4 py-3">
                <Text accessibilityLiveRegion="polite" className="font-texte-semi text-base leading-6 text-encre">
                  {T.resume(afficherHeure(reglages.silence.de, langue), afficherHeure(reglages.silence.a, langue))}
                </Text>
              </View>
            </View>
          ) : null}

          {echecEnregistrement ? (
            <Text accessibilityLiveRegion="polite" className="mt-6 font-texte-semi text-sm leading-5 text-rouge-texte">
              {T.echec}
            </Text>
          ) : null}
        </>
      )}
    </EcranReglage>
  );
}
