import { useEffect, useState } from "react";
import { Pressable, Switch, Text, View } from "react-native";

import { MESSAGES_SERVICE } from "@sos-miam/commun/contenus/messages-services";
import { DUREE_PARTAGE_POSITION_MINUTES } from "@sos-miam/commun/regles/miam-safe";
import type { PartagePositionMiamSafe } from "@sos-miam/commun/types/miam-safe";
import { Bouton } from "~/composants/interface/Bouton";
import { EmojiOuMiami } from "~/composants/profil/EmojiOuMiami";
import { NumerosUrgence } from "~/composants/miam-safe/NumerosUrgence";
import { ecrireHeure } from "~/fonctions/dates/ecrire-heure";
import { lirePositionMiamSafe } from "~/fonctions/miam-safe/lire-position-miam-safe";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import { utiliserServices } from "~/hooks/utiliser-services";
import couleurs from "~/theme/couleurs";

type Props = {
  lieuId: number;
  nomLieu: string;
  /** Ouvre l'écran du partage (telephones : sur combien de téléphones du pote la notification est partie, null si déjà ouvert) */
  onOuvrirPartage: (partageId: number, telephones: number | null) => void;
};

const HEURES = DUREE_PARTAGE_POSITION_MINUTES / 60;

/**
 * « Prévenir un pote » de ta bande : il reçoit une notification urgente (« Léa ne se sent pas en sécurité à… ») et, si tu
 * le veux, voit ta position pendant 1 h dans son app, arrêtable à tout moment. On ne fait JAMAIS croire qu'il est prévenu :
 * l'écran du partage dit si la notification est vraiment partie. Sans compte connecté (démo) ou sans potes, rien ne part, et
 * on le dit. Les secours restent juste en dessous.
 */
export function PrevenirPoteMiamSafe({ lieuId, nomLieu, onOuvrirPartage }: Props) {
  const { miamSafe } = utiliserServices();
  const { source, pret, potes } = utiliserCommunaute();
  const [choisi, setChoisi] = useState<string | null>(null);
  const [avecPosition, setAvecPosition] = useState(true);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState<PartagePositionMiamSafe[]>([]);

  // Un partage déjà en cours (écran quitté) : on le retrouve ici
  useEffect(() => {
    if (source !== "compte") return;
    miamSafe.listerPartages().then((r) => r.ok && setEnCours(r.partages.filter((p) => p.sens === "envoye" && p.actif))).catch(() => {});
  }, [source, miamSafe]);

  if (source !== "compte" || !pret) {
    return (
      <View className="gap-4">
        <View accessible className="gap-2 rounded-2xl border-2 border-dashed border-encre bg-white p-4">
          <Text className="font-texte-gras text-base text-encre">{source === "attente" || !pret ? "Ta bande arrive…" : "Rien ne part en démo"}</Text>
          <Text className="font-texte text-base leading-6 text-encre">
            {source === "attente" || !pret
              ? "Un instant. Si ça traîne, appelle plutôt un proche."
              : `Pour prévenir un pote pour de vrai, il te faut ton compte et tes potes dans ta bande. Là, appelle plutôt un proche et dis-lui que tu es au ${nomLieu}.`}
          </Text>
        </View>
        <NumerosUrgence />
      </View>
    );
  }

  const pote = potes.find((p) => p.id === choisi) ?? null;

  const prevenir = async () => {
    if (!pote || envoi) return;
    setEnvoi(true);
    setErreur(null);
    const lue = avecPosition ? await lirePositionMiamSafe() : null;
    const position = lue === "refusee" ? null : lue;
    const r = await miamSafe.prevenirPote({ pote: pote.id, lieuId, partagerPosition: avecPosition, position }).catch(() => null);
    setEnvoi(false);
    if (r?.ok) return onOuvrirPartage(r.partage.id, r.telephones);
    const message = MESSAGES_SERVICE[r ? r.erreur : "hors-ligne"];
    setErreur(`${message.titre}. ${message.texte}`);
  };

  return (
    <View className="gap-4">
      {enCours.map((p) => (
        <View key={p.id} className="gap-2 rounded-2xl bg-jaune-clair p-4">
          <Text className="font-texte-gras text-base text-encre">
            📍 Tu partages ta position avec {p.personne.prenom} jusqu'à {ecrireHeure(p.expireLe)}.
          </Text>
          <Bouton libelle="Voir le partage" variante="blanc" petit onPress={() => onOuvrirPartage(p.id, null)} />
        </View>
      ))}

      {potes.length === 0 ? (
        <View accessible className="gap-2 rounded-2xl border-2 border-dashed border-encre bg-white p-4">
          <Text className="font-texte-gras text-base text-encre">Ta bande est vide</Text>
          <Text className="font-texte text-base leading-6 text-encre">
            On ne peut prévenir qu'un pote de ta bande. Ajoute tes potes depuis l'onglet Potes ; là, appelle plutôt un proche.
          </Text>
        </View>
      ) : (
        <>
          <Text className="font-texte text-base leading-6 text-gris">
            Ton pote reçoit une notification : tu ne te sens pas en sécurité au {nomLieu}. Qui préviens-tu ?
          </Text>
          <View accessibilityRole="radiogroup" className="gap-2">
            {potes.map((p) => {
              const selectionne = p.id === choisi;
              return (
                <Pressable
                  key={p.id}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selectionne }}
                  accessibilityLabel={`${p.prenom}, @${p.pseudo}`}
                  onPress={() => setChoisi(p.id)}
                  className={`min-h-14 flex-row items-center gap-3 rounded-2xl border-2 px-4 py-2 active:opacity-80 ${selectionne ? "border-encre bg-jaune-clair" : "border-ligne bg-white"}`}
                >
                  <EmojiOuMiami valeur={p.avatar} taille={32} className="text-2xl" />
                  <View className="shrink grow">
                    <Text className="font-texte-gras text-base text-encre">{p.prenom}</Text>
                    <Text className="font-texte text-sm text-gris">@{p.pseudo}</Text>
                  </View>
                  {selectionne ? <Text className="font-texte-gras text-base text-encre">✓</Text> : null}
                </Pressable>
              );
            })}
          </View>

          <View className="flex-row items-center gap-3 rounded-2xl bg-white p-4">
            <View className="shrink grow gap-1">
              <Text className="font-texte-gras text-base text-encre">Partager ma position pendant {HEURES} h</Text>
              <Text className="font-texte text-sm leading-5 text-gris">Ton pote la voit dans son app. Tu arrêtes quand tu veux.</Text>
            </View>
            <Switch
              accessibilityLabel={`Partager ma position pendant ${HEURES} heure`}
              value={avecPosition}
              onValueChange={setAvecPosition}
              trackColor={{ true: couleurs.encre, false: couleurs.ligne }}
            />
          </View>

          {erreur ? <Text accessibilityLiveRegion="polite" className="font-texte-semi text-base leading-6 text-encre">⚠️ {erreur}</Text> : null}
          <Bouton
            libelle={envoi ? "Envoi…" : pote ? `Prévenir ${pote.prenom}` : "Choisis un pote"}
            variante="encre"
            desactive={!pote || envoi}
            onPress={prevenir}
          />
        </>
      )}
      <NumerosUrgence />
    </View>
  );
}
