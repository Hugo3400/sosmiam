import { Text, View } from "react-native";

import type { SortieMiamisApi } from "@sos-miam/commun/types/communaute";
import { Bouton } from "~/composants/interface/Bouton";
import { LienDiscretMiamis } from "~/composants/miamis/LienDiscretMiamis";
import { TEXTES_ECRANS_MIAMIS_PAR_LANGUE } from "~/contenus/textes-ecrans-miamis";
import { TEXTES_SORTIE_MIAMIS_PAR_LANGUE } from "~/contenus/textes-sorties-miamis";
import { ecrireJourLongLangue } from "~/fonctions/langue/ecrire-jour-long-langue";
import { ecrireRappelVeille } from "~/fonctions/miamis/ecrire-rappel-veille";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";

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
  const TE = utiliserTextes(TEXTES_ECRANS_MIAMIS_PAR_LANGUE);
  const { langue } = utiliserLangue();
  const T = utiliserTextes(TEXTES_SORTIE_MIAMIS_PAR_LANGUE);
  const { place, rangAttente, present } = sortie.moi;
  const pseudo = sortie.organisateur.pseudo;

  if (place === "aucune") {
    const habitue = sortie.invitationHabitue;
    const jusqua = habitue ? ecrireJourLongLangue(habitue.jusqua, langue) : "";
    return (
      <View className="gap-2">
        {habitue ? (
          <Text className="overflow-hidden rounded-2xl bg-jaune-clair px-3.5 py-2.5 text-center font-texte-semi text-[13px] leading-5 text-encre">
            {lierPonctuation(T.placeHabitue(langue === "en" ? jusqua : jusqua.toLowerCase()))}
          </Text>
        ) : null}
        <Bouton
          libelle={enCours === "venir" ? TE.unInstant : habitue ? T.jeReviens : complet ? T.rejoindreAttente : T.jeViens}
          variante="encre"
          desactive={enCours === "venir"}
          onPress={onDemander}
        />
        <Text className="text-center font-texte text-xs leading-4 text-gris">
          {lierPonctuation(habitue ? T.habitueNote : complet ? T.complet : T.jeViensNote(pseudo))}
        </Text>
      </View>
    );
  }

  if (place === "demande" || place === "attente") {
    return (
      <View className="gap-1">
        <View className="min-h-14 items-center justify-center rounded-2xl bg-jaune-clair px-4 py-3">
          <Text className="text-center font-texte-gras text-[15px] text-encre">
            {place === "demande" ? T.demandeEnvoyee(pseudo) : T.rangAttente(rangAttente ?? 1)}
          </Text>
        </View>
        <LienDiscretMiamis
          libelle={place === "demande" ? T.annulerDemande : T.quitterAttente}
          desactive={enCours !== null}
          onPress={place === "demande" ? onAnnulerDemande : onQuitter}
        />
      </View>
    );
  }

  const rappel = ecrireRappelVeille(sortie.quand, langue);
  return (
    <View className="gap-2">
      <View className="flex-row gap-2">
        {sortie.conversationId ? <Bouton libelle={T.discussion} onPress={onDiscussion} className="flex-1" indice={TE.ouvrirDiscussion} /> : null}
        <Bouton
          libelle={present ? T.present : enCours === "presence" ? TE.unInstant : T.jeSuisLa}
          variante={present ? "blanc" : "encre"}
          desactive={present || !presenceOuverte || enCours === "presence"}
          onPress={onPresence}
          indice={presenceOuverte ? TE.validerPresence : T.presenceBientot}
          className="flex-1"
        />
      </View>
      <Text className="text-center font-texte text-xs leading-4 text-gris">
        {lierPonctuation(present ? T.presenceValidee : !presenceOuverte && rappel ? T.rappel(rappel.jour, rappel.heure) : presenceOuverte ? T.presenceOuverte : T.rappelPasse)}
      </Text>
      {place === "accepte" ? <LienDiscretMiamis libelle={T.nePlusVenir} desactive={enCours !== null} onPress={onQuitter} /> : null}
    </View>
  );
}
