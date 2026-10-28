import { useState } from "react";
import { Text, View } from "react-native";

import type { ReglageMessageMoment } from "@sos-miam/commun/client-api/contrat-lieu-pro";
import { citer } from "@sos-miam/commun/fonctions/langue/citer";
import { MESSAGE_MOMENT_MAX } from "@sos-miam/commun/regles/sos-lieu";
import type { MomentLieu } from "@sos-miam/commun/types/moment-lieu";
import { RefusLimitationEnPlace } from "~/composants/compte/RefusLimitationEnPlace";
import { Bouton } from "~/composants/interface/Bouton";
import { ChampTexte } from "~/composants/interface/ChampTexte";
import { ChoixFin } from "~/composants/pro/ChoixFin";
import { TEXTES_MESSAGE_MOMENT_PAR_LANGUE } from "~/contenus/textes-blocs-ce-soir";
import { ecrireHeureLangue } from "~/fonctions/langue/ecrire-heure-langue";
import { listerDureesMessage } from "~/fonctions/pro/lister-durees-message";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";

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
  const { langue } = utiliserLangue();
  const T = utiliserTextes(TEXTES_MESSAGE_MOMENT_PAR_LANGUE);
  const [texte, setTexte] = useState("");
  const durees = listerDureesMessage(new Date(), moment.fermeture, langue);
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
        <View className="gap-3 rounded-carte border-2 border-encre bg-carte p-4">
          <Text className="font-texte-gras text-base text-encre">{`📣 ${citer(actuel.texte, langue)}`}</Text>
          <Text className="font-texte text-sm text-gris">{actuel.jusqua ? T.afficheJusqua(ecrireHeureLangue(actuel.jusqua, langue)) : T.afficheParEquipe}</Text>
          <RefusLimitationEnPlace texte={refusEffacer} />
          <Bouton libelle={T.effacer} variante="blanc" petit desactive={enCours} onPress={onEffacer} />
        </View>
      ) : (
        <Text className="font-texte text-base leading-6 text-gris">
          {lierPonctuation(T.intro)}
        </Text>
      )}
      <ChampTexte
        libelle={actuel ? T.remplacerPar : T.tonMessage}
        valeur={texte}
        onChangeTexte={(t) => {
          setTexte(t);
          if (erreur === "texte") setErreur(null);
        }}
        maxLength={MESSAGE_MOMENT_MAX}
        placeholder={T.exemple}
        aide={`${texte.length}/${MESSAGE_MOMENT_MAX}`}
        erreur={erreur === "texte" ? T.erreurTexte(MESSAGE_MOMENT_MAX) : null}
      />
      <ChoixFin libelle={T.combienDeTemps} choix={durees} choisi={duree} onChoisir={setDuree} />
      {erreur === "jusqua" ? <Text className="font-texte text-sm text-rouge-texte">{T.erreurDuree}</Text> : null}
      <RefusLimitationEnPlace texte={refusLimite} />
      <Bouton libelle={actuel ? T.remplacer : T.afficher} desactive={enCours || texte.trim() === ""} onPress={() => void afficher()} />
    </View>
  );
}
