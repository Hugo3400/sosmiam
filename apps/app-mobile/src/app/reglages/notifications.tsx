import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, ActivityIndicator, Text, View } from "react-native";

import { Interrupteur } from "~/composants/interface/Interrupteur";
import { Pastille } from "~/composants/interface/Pastille";
import { EcranReglage } from "~/composants/reglages/EcranReglage";
import { typesNotifications } from "~/contenus/types-notifications";
import { formaterHeure } from "~/fonctions/dates/formater-heure";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import {
  enregistrerReglagesNotifications,
  lireReglagesNotifications,
  type ReglagesNotifications as ChoixNotifications,
  type TypeNotification,
} from "~/stockage/reglages-notifications";
import couleurs from "~/theme/couleurs";

/** Heures proposées pour le mode nuit (au format HH:MM du stockage) */
const HEURES_DEBUT = ["21:00", "22:00", "23:00", "00:00"];
const HEURES_FIN = ["07:00", "08:00", "09:00", "10:00"];

/** Heure affichée comme ailleurs dans l'app : « 23h », « 9h », et « minuit » plutôt que « 0h ». */
const afficherHeure = (heure: string) => (heure === "00:00" ? "minuit" : formaterHeure(heure));

const MESSAGE_ECHEC = "Oups, ce choix n'a pas pu être gardé sur ton téléphone. Réessaie un peu plus tard.";

/** Réglages > Notifications : tout couper, choisir les sortes d'alertes et le mode nuit. Chaque choix est gardé tout de suite. */
export default function ReglagesNotifications() {
  const [reglages, setReglages] = useState<ChoixNotifications | null>(null);
  // Dernière version connue, pour enchaîner deux changements rapides sans en perdre un
  const derniers = useRef<ChoixNotifications | null>(null);
  const [echecEnregistrement, setEchecEnregistrement] = useState(false);

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
        AccessibilityInfo.announceForAccessibility(MESSAGE_ECHEC);
      },
    );
  }

  const changerType = (type: TypeNotification, valeur: boolean) => modifier((r) => ({ ...r, types: { ...r.types, [type]: valeur } }));
  const changerSilence = (silence: Partial<ChoixNotifications["silence"]>) => modifier((r) => ({ ...r, silence: { ...r.silence, ...silence } }));

  return (
    <EcranReglage titre="Notifications" sousTitre="Choisis ce qui mérite de faire vibrer ta poche.">
      <View
        accessible
        accessibilityLabel="Les notifications sur ton téléphone arrivent avec une prochaine version : tes choix sont déjà gardés. En attendant, tes abonnés et tes demandes t'attendent derrière la cloche du fil."
        className="flex-row gap-3 rounded-carte border-2 border-encre bg-jaune-clair p-4"
      >
        <Text className="text-xl">🚧</Text>
        <Text className="flex-1 font-texte text-sm leading-5 text-encre">
          {lierPonctuation(
            "Les notifications sur ton téléphone arrivent avec une prochaine version : tes choix sont déjà gardés. En attendant, tes abonnés et tes demandes t'attendent derrière la cloche du fil.",
          )}
        </Text>
      </View>

      {!reglages ? (
        <View className="mt-8 items-center">
          <ActivityIndicator color={couleurs.encre} accessibilityLabel="Chargement de tes réglages" />
        </View>
      ) : (
        <>
          <View className="mt-4">
            <Interrupteur
              emoji="🔔"
              titre="Recevoir des notifications"
              detail="Tu peux tout couper d'un coup, sans rancune"
              valeur={reglages.actives}
              onChanger={(actives) => modifier((r) => ({ ...r, actives }))}
            />
          </View>

          <Text accessibilityRole="header" className="mt-8 font-titre-gras text-xl text-encre">
            Ce qui t'intéresse
          </Text>
          {!reglages.actives ? (
            <Text className="mt-1 font-texte text-sm leading-5 text-gris">
              {lierPonctuation("Tout est coupé pour l'instant : rallume les notifications juste au-dessus pour choisir lesquelles tu veux.")}
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

          <Text accessibilityRole="header" className="mt-8 font-titre-gras text-xl text-encre">
            Tes abonnements
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
            La nuit
          </Text>
          <View className="mt-1">
            <Interrupteur
              emoji="🌙"
              titre="Mode nuit"
              detail="Pas de notification pendant que tu dors"
              valeur={reglages.silence.actif}
              desactive={!reglages.actives}
              onChanger={(actif) => changerSilence({ actif })}
            />
          </View>

          {reglages.actives && reglages.silence.actif ? (
            <View className="mt-4 gap-4">
              <View className="gap-2">
                <Text className="font-texte-semi text-base text-encre">À partir de</Text>
                <View accessibilityRole="radiogroup" accessibilityLabel="Début du mode nuit" className="flex-row flex-wrap gap-2">
                  {HEURES_DEBUT.map((heure, i) => (
                    <Pastille
                      key={heure}
                      role="radio"
                      libelle={afficherHeure(heure)}
                      position={i + 1}
                      total={HEURES_DEBUT.length}
                      choisi={reglages.silence.de === heure}
                      onPress={() => changerSilence({ de: heure })}
                    />
                  ))}
                </View>
              </View>
              <View className="gap-2">
                <Text className="font-texte-semi text-base text-encre">Jusqu'à</Text>
                <View accessibilityRole="radiogroup" accessibilityLabel="Fin du mode nuit" className="flex-row flex-wrap gap-2">
                  {HEURES_FIN.map((heure, i) => (
                    <Pastille
                      key={heure}
                      role="radio"
                      libelle={afficherHeure(heure)}
                      position={i + 1}
                      total={HEURES_FIN.length}
                      choisi={reglages.silence.a === heure}
                      onPress={() => changerSilence({ a: heure })}
                    />
                  ))}
                </View>
              </View>
              <View className="rounded-carte bg-white px-4 py-3">
                <Text accessibilityLiveRegion="polite" className="font-texte-semi text-base leading-6 text-encre">
                  De {afficherHeure(reglages.silence.de)} à {afficherHeure(reglages.silence.a)}, ton téléphone reste tranquille.
                </Text>
              </View>
            </View>
          ) : null}

          {echecEnregistrement ? (
            <Text accessibilityLiveRegion="polite" className="mt-6 font-texte-semi text-sm leading-5 text-rouge-texte">
              {MESSAGE_ECHEC}
            </Text>
          ) : null}
        </>
      )}
    </EcranReglage>
  );
}
