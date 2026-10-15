import { useState } from "react";
import { Text, View } from "react-native";

import type { ReglageMessageMoment } from "@sos-miam/commun/client-api/contrat-lieu-pro";
import { MESSAGE_MOMENT_MAX } from "@sos-miam/commun/regles/sos-lieu";
import type { MomentLieu } from "@sos-miam/commun/types/moment-lieu";
import { RefusLimitationEnPlace } from "~/composants/compte/RefusLimitationEnPlace";
import { Bouton } from "~/composants/interface/Bouton";
import { ChampTexte } from "~/composants/interface/ChampTexte";
import { ChoixFin } from "~/composants/pro/ChoixFin";
import { ecrireHeure } from "~/fonctions/dates/ecrire-heure";
import { listerDureesMessage } from "~/fonctions/pro/lister-durees-message";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

export type ChampMessage = "texte" | "jusqua";

type Props = {
  moment: MomentLieu;
  enCours: boolean;
  /** Rend le champ refusé, « refuse » (pas affiché, l'écran a dit pourquoi : le texte reste), ou null si c'est affiché */
  onAfficher: (message: ReglageMessageMoment) => Promise<ChampMessage | "refuse" | null>;
  onEffacer: () => void;
  /** Compte limité : pourquoi le dernier message n'est pas parti, dit au-dessus du bouton */
  refusLimite: string | null;
  /** Compte limité : pourquoi le message en place n'est pas effacé, dit au-dessus d'« Effacer le message » */
  refusEffacer: string | null;
};

/**
 * Le message du moment (« Happy hour jusqu'à 20 h ») : 80 caractères, affiché sur la fiche du lieu jusqu'à l'heure choisie
 * (24 h au plus), puis effacé tout seul. Un message en place peut être remplacé ou effacé.
 */
export function BlocMessageMoment({ moment, enCours, refusLimite, refusEffacer, onAfficher, onEffacer }: Props) {
  const [texte, setTexte] = useState("");
  const durees = listerDureesMessage(new Date(), moment.fermeture);
  const [duree, setDuree] = useState<string | null>(durees[0]?.cle ?? null);
  const [erreur, setErreur] = useState<ChampMessage | null>(null);
  const actuel = moment.message;

  async function afficher() {
    const choix = durees.find((d) => d.cle === duree);
    if (!choix) return setErreur("jusqua");
    const refus = await onAfficher({ texte: texte.trim(), jusqua: choix.jusqua });
    setErreur(refus === "refuse" ? null : refus);
    if (refus === null) setTexte("");
  }

  return (
    <View className="gap-5">
      {actuel ? (
        <View className="gap-3 rounded-carte border-2 border-encre bg-white p-4">
          <Text className="font-texte-gras text-base text-encre">{`📣 « ${actuel.texte} »`}</Text>
          <Text className="font-texte text-sm text-gris">{actuel.jusqua ? `Affiché sur ta fiche jusqu'à ${ecrireHeure(actuel.jusqua)}.` : "Affiché sur ta fiche par l'équipe SOS Miam."}</Text>
          <RefusLimitationEnPlace texte={refusEffacer} />
          <Bouton libelle="Effacer le message" variante="blanc" petit desactive={enCours} onPress={onEffacer} />
        </View>
      ) : (
        <Text className="font-texte text-base leading-6 text-gris">
          {lierPonctuation("Une happy hour, le plat du jour, un concert improvisé ? Un petit mot sur ta fiche, qui s'efface tout seul.")}
        </Text>
      )}
      <ChampTexte
        libelle={actuel ? "Le remplacer par" : "Ton message"}
        valeur={texte}
        onChangeTexte={(t) => {
          setTexte(t);
          if (erreur === "texte") setErreur(null);
        }}
        maxLength={MESSAGE_MOMENT_MAX}
        placeholder="Happy hour jusqu'à 20h"
        aide={`${texte.length}/${MESSAGE_MOMENT_MAX}`}
        erreur={erreur === "texte" ? `De 1 à ${MESSAGE_MOMENT_MAX} caractères, et sans gros mot.` : null}
      />
      <ChoixFin libelle="Combien de temps ?" choix={durees} choisi={duree} onChoisir={setDuree} />
      {erreur === "jusqua" ? <Text className="font-texte text-sm text-rouge-texte">24 h au plus, et pas dans le passé.</Text> : null}
      <RefusLimitationEnPlace texte={refusLimite} />
      <Bouton libelle={actuel ? "Remplacer le message" : "Afficher le message"} desactive={enCours || texte.trim() === ""} onPress={() => void afficher()} />
    </View>
  );
}
