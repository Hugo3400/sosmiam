import { useState } from "react";
import { Text, View } from "react-native";

import type { LancementSos } from "@sos-miam/commun/client-api/contrat-lieu-pro";
import { SOS_OFFRE_MAX, SOS_PLACES_MAX, SOS_PLACES_MIN } from "@sos-miam/commun/regles/sos-lieu";
import type { MomentLieu } from "@sos-miam/commun/types/moment-lieu";
import { RefusLimitationEnPlace } from "~/composants/compte/RefusLimitationEnPlace";
import { Bouton } from "~/composants/interface/Bouton";
import { ChampTexte } from "~/composants/interface/ChampTexte";
import { CompteurPlusMoins } from "~/composants/interface/CompteurPlusMoins";
import { FeuilleConfirmation } from "~/composants/interface/FeuilleConfirmation";
import { ChoixFin } from "~/composants/pro/ChoixFin";
import { ZoneClaire } from "~/composants/theme/ZoneClaire";
import { TEXTES_SOS_DU_SOIR_PAR_LANGUE } from "~/contenus/textes-blocs-ce-soir";
import { ecrireHeureLangue } from "~/fonctions/langue/ecrire-heure-langue";
import { listerFinsCeSoir } from "~/fonctions/pro/lister-fins-ce-soir";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";

export type ChampSos = "places" | "offre" | "jusqua";

type Props = {
  moment: MomentLieu;
  enCours: boolean;
  /** Rend le champ refusé, « refuse » (pas parti, l'écran a dit pourquoi), ou null si c'est parti */
  onLancer: (sos: LancementSos) => Promise<ChampSos | "refuse" | null>;
  onArreter: () => void;
  /** Compte limité : pourquoi le SOS n'est pas lancé, dit au-dessus du bouton */
  refusLimite: string | null;
  /** Compte limité : pourquoi le SOS d'un collègue n'est pas arrêté, dit au-dessus d'« Arrêter le SOS » */
  refusArreter: string | null;
};

/**
 * Le SOS « place ce soir » : un par jour, jusqu'à la fermeture (ou plus tôt). Lancé, il montre ses places, son offre et
 * jusqu'à quand, avec « Arrêter le SOS » ; arrêté ou fini, il dit qu'on se retrouve demain.
 */
export function BlocSosDuSoir({ moment, enCours, refusLimite, refusArreter, onLancer, onArreter }: Props) {
  const { langue } = utiliserLangue();
  const T = utiliserTextes(TEXTES_SOS_DU_SOIR_PAR_LANGUE);
  const erreurs: Record<ChampSos, string> = {
    places: T.erreurPlaces(SOS_PLACES_MIN, SOS_PLACES_MAX),
    offre: T.erreurOffre(SOS_OFFRE_MAX),
    jusqua: T.erreurFin,
  };
  const heure = (instant: string) => ecrireHeureLangue(instant, langue);
  const [places, setPlaces] = useState(4);
  const [offre, setOffre] = useState("");
  const fins = listerFinsCeSoir(new Date(), moment.fermeture, langue);
  const [fin, setFin] = useState<string | null>(fins[0]?.cle ?? null);
  const [erreur, setErreur] = useState<ChampSos | null>(null);
  const [confirmation, setConfirmation] = useState<"lancer" | "arreter" | null>(null);
  const sos = moment.sos;

  if (sos?.enCours) {
    return (
      <View className="gap-4 rounded-carte border-2 border-encre bg-jaune p-4">
        <Text className="font-titre text-2xl text-nuit">{T.enCoursTitre}</Text>
        <Text className="font-texte text-base leading-6 text-nuit">
          {lierPonctuation(T.enCours(sos.places, heure(sos.jusqua), sos.offre))}
        </Text>
        <Text className="font-texte text-sm text-nuit/75">{T.lance(heure(sos.lanceLe), sos.lancePar)}</Text>
        <ZoneClaire className="gap-4">
          <RefusLimitationEnPlace texte={refusArreter} />
          <Bouton libelle={T.arreter} variante="blanc" desactive={enCours} onPress={() => setConfirmation("arreter")} />
        </ZoneClaire>
        <FeuilleConfirmation
          visible={confirmation === "arreter"}
          emoji="🛟"
          titre={T.arreterTitre}
          detail={T.arreterDetail}
          libelleConfirmer={T.arreter}
          libelleRester={T.garder}
          onConfirmer={onArreter}
          onFermer={() => setConfirmation(null)}
        />
      </View>
    );
  }

  if (sos || !moment.sosPossible) {
    const fini = sos?.arreteLe ? T.arreteA(heure(sos.arreteLe)) : sos ? T.finiA(heure(sos.jusqua)) : T.dejaLance;
    return (
      <View className="gap-2 rounded-carte border-2 border-encre bg-carte p-4">
        <Text className="font-texte-gras text-base text-encre">{T.finiTitre(fini)}</Text>
        <Text className="font-texte text-sm leading-5 text-gris">{T.finiDetail}</Text>
      </View>
    );
  }

  const choixFin = fins.find((f) => f.cle === fin) ?? null;
  async function lancer() {
    if (!choixFin) return setErreur("jusqua");
    const refus = await onLancer({ places, offre: offre.trim() || null, jusqua: choixFin.jusqua });
    setErreur(refus === "refuse" ? null : refus);
  }

  return (
    <View className="gap-5">
      <Text className="font-texte text-base leading-6 text-gris">
        {lierPonctuation(T.intro)}
      </Text>
      <Text className="-mb-3 font-texte-gras text-base text-encre">{T.places}</Text>
      <CompteurPlusMoins libelle={T.places} valeur={places} min={SOS_PLACES_MIN} max={SOS_PLACES_MAX} unite={T.unite} onChanger={setPlaces} />
      {erreur === "places" ? <Text className="font-texte text-sm text-rouge-texte">{erreurs.places}</Text> : null}
      <ChampTexte
        libelle={T.offre}
        mention={T.facultatif}
        valeur={offre}
        onChangeTexte={(t) => {
          setOffre(t);
          if (erreur === "offre") setErreur(null);
        }}
        maxLength={SOS_OFFRE_MAX}
        placeholder={T.offreExemple}
        aide={`${offre.length}/${SOS_OFFRE_MAX}`}
        erreur={erreur === "offre" ? erreurs.offre : null}
      />
      <ChoixFin libelle={T.jusquaQuand} choix={fins} choisi={fin} onChoisir={setFin} />
      {erreur === "jusqua" ? <Text className="font-texte text-sm text-rouge-texte">{erreurs.jusqua}</Text> : null}
      <RefusLimitationEnPlace texte={refusLimite} />
      <Bouton libelle={T.lancer} variante="encre" desactive={enCours || !choixFin} onPress={() => setConfirmation("lancer")} />
      <FeuilleConfirmation
        visible={confirmation === "lancer"}
        emoji="🛟"
        titre={T.lancerTitre}
        detail={T.lancerDetail(places, choixFin?.libelle ?? "")}
        libelleConfirmer={T.confirmer}
        libelleRester={T.rester}
        onConfirmer={() => void lancer()}
        onFermer={() => setConfirmation(null)}
      />
    </View>
  );
}
