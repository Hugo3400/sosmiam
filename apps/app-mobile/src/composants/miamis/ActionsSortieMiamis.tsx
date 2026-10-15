import { Text, View } from "react-native";

import type { SortieMiamisApi } from "@sos-miam/commun/types/communaute";
import { Bouton } from "~/composants/interface/Bouton";
import { LienDiscretMiamis } from "~/composants/miamis/LienDiscretMiamis";
import { TEXTES_SORTIE_MIAMIS } from "~/contenus/textes-sorties-miamis";
import { ecrireJourLong } from "~/fonctions/dates/ecrire-jour-long";
import { ecrireRappelVeille } from "~/fonctions/miamis/ecrire-rappel-veille";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  sortie: SortieMiamisApi;
  complet: boolean;
  enCours: string | null;
  presenceOuverte: boolean;
  onDemander: () => void;
  onAnnulerDemande: () => void;
  onQuitter: () => void;
  onDiscussion: () => void;
  onPresence: () => void;
};

export function ActionsSortieMiamis({ sortie, complet, enCours, presenceOuverte, onDemander, onAnnulerDemande, onQuitter, onDiscussion, onPresence }: Props) {
  const { place, rangAttente, present } = sortie.moi;
  const pseudo = sortie.organisateur.pseudo;

  if (place === "aucune") {
    const habitue = sortie.invitationHabitue;
    return (
      <View className="gap-2">
        {habitue ? (
          <Text className="overflow-hidden rounded-2xl bg-jaune-clair px-3.5 py-2.5 text-center font-texte-semi text-[13px] leading-5 text-encre">
            {lierPonctuation(TEXTES_SORTIE_MIAMIS.placeHabitue(ecrireJourLong(habitue.jusqua).toLowerCase()))}
          </Text>
        ) : null}
        <Bouton
          libelle={enCours === "venir" ? "Un instant…" : habitue ? TEXTES_SORTIE_MIAMIS.jeReviens : complet ? TEXTES_SORTIE_MIAMIS.rejoindreAttente : TEXTES_SORTIE_MIAMIS.jeViens}
          variante="encre"
          desactive={enCours === "venir"}
          onPress={onDemander}
        />
        <Text className="text-center font-texte text-xs leading-4 text-gris">
          {lierPonctuation(habitue ? TEXTES_SORTIE_MIAMIS.habitueNote : complet ? TEXTES_SORTIE_MIAMIS.complet : TEXTES_SORTIE_MIAMIS.jeViensNote(pseudo))}
        </Text>
      </View>
    );
  }

  if (place === "demande" || place === "attente") {
    return (
      <View className="gap-1">
        <View className="min-h-14 items-center justify-center rounded-2xl bg-jaune-clair px-4 py-3">
          <Text className="text-center font-texte-gras text-[15px] text-encre">
            {place === "demande" ? TEXTES_SORTIE_MIAMIS.demandeEnvoyee(pseudo) : TEXTES_SORTIE_MIAMIS.rangAttente(rangAttente ?? 1)}
          </Text>
        </View>
        <LienDiscretMiamis
          libelle={place === "demande" ? TEXTES_SORTIE_MIAMIS.annulerDemande : TEXTES_SORTIE_MIAMIS.quitterAttente}
          desactive={enCours !== null}
          onPress={place === "demande" ? onAnnulerDemande : onQuitter}
        />
      </View>
    );
  }

  const rappel = ecrireRappelVeille(sortie.quand);
  return (
    <View className="gap-2">
      <View className="flex-row gap-2">
        {sortie.conversationId ? <Bouton libelle={TEXTES_SORTIE_MIAMIS.discussion} onPress={onDiscussion} className="flex-1" indice="Ouvre la discussion de la sortie" /> : null}
        <Bouton
          libelle={present ? TEXTES_SORTIE_MIAMIS.present : enCours === "presence" ? "Un instant…" : TEXTES_SORTIE_MIAMIS.jeSuisLa}
          variante={present ? "blanc" : "encre"}
          desactive={present || !presenceOuverte || enCours === "presence"}
          onPress={onPresence}
          indice={presenceOuverte ? "Valide ta présence avec le QR du comptoir" : TEXTES_SORTIE_MIAMIS.presenceBientot}
          className="flex-1"
        />
      </View>
      <Text className="text-center font-texte text-xs leading-4 text-gris">
        {lierPonctuation(present ? TEXTES_SORTIE_MIAMIS.presenceValidee : !presenceOuverte && rappel ? TEXTES_SORTIE_MIAMIS.rappel(rappel.jour, rappel.heure) : presenceOuverte ? TEXTES_SORTIE_MIAMIS.presenceOuverte : TEXTES_SORTIE_MIAMIS.rappelPasse)}
      </Text>
      {place === "accepte" ? <LienDiscretMiamis libelle={TEXTES_SORTIE_MIAMIS.nePlusVenir} desactive={enCours !== null} onPress={onQuitter} /> : null}
    </View>
  );
}
