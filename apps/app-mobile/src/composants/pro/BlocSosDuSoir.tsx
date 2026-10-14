import { useState } from "react";
import { Text, View } from "react-native";

import type { LancementSos } from "@sos-miam/commun/client-api/contrat-lieu-pro";
import { SOS_OFFRE_MAX, SOS_PLACES_MAX, SOS_PLACES_MIN } from "@sos-miam/commun/regles/sos-lieu";
import type { MomentLieu } from "@sos-miam/commun/types/moment-lieu";
import { Bouton } from "~/composants/interface/Bouton";
import { ChampTexte } from "~/composants/interface/ChampTexte";
import { CompteurPlusMoins } from "~/composants/interface/CompteurPlusMoins";
import { FeuilleConfirmation } from "~/composants/interface/FeuilleConfirmation";
import { ChoixFin } from "~/composants/pro/ChoixFin";
import { ecrireHeure } from "~/fonctions/dates/ecrire-heure";
import { listerFinsCeSoir } from "~/fonctions/pro/lister-fins-ce-soir";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

export type ChampSos = "places" | "offre" | "jusqua";

type Props = {
  moment: MomentLieu;
  enCours: boolean;
  /** Rend le champ refusé (ou null si c'est parti) */
  onLancer: (sos: LancementSos) => Promise<ChampSos | null>;
  onArreter: () => void;
};

const ERREURS: Record<ChampSos, string> = {
  places: `Entre ${SOS_PLACES_MIN} et ${SOS_PLACES_MAX} places.`,
  offre: `${SOS_OFFRE_MAX} caractères au plus, et sans gros mot.`,
  jusqua: "Choisis une fin, avant la fermeture de ce soir.",
};

/**
 * Le SOS « place ce soir » : un par jour, jusqu'à la fermeture (ou plus tôt). Lancé, il montre ses places, son offre et
 * jusqu'à quand, avec « Arrêter le SOS » ; arrêté ou fini, il dit qu'on se retrouve demain.
 */
export function BlocSosDuSoir({ moment, enCours, onLancer, onArreter }: Props) {
  const [places, setPlaces] = useState(4);
  const [offre, setOffre] = useState("");
  const fins = listerFinsCeSoir(new Date(), moment.fermeture);
  const [fin, setFin] = useState<string | null>(fins[0]?.cle ?? null);
  const [erreur, setErreur] = useState<ChampSos | null>(null);
  const [confirmation, setConfirmation] = useState<"lancer" | "arreter" | null>(null);
  const sos = moment.sos;

  if (sos?.enCours) {
    return (
      <View className="gap-4 rounded-carte border-2 border-encre bg-jaune p-4">
        <Text className="font-titre text-2xl text-encre">🛟 SOS en cours</Text>
        <Text className="font-texte text-base leading-6 text-encre">
          {lierPonctuation(`${sos.places} place${sos.places > 1 ? "s" : ""} à remplir jusqu'à ${ecrireHeure(sos.jusqua)}${sos.offre ? ` · ${sos.offre}` : ""}.`)}
        </Text>
        <Text className="font-texte text-sm text-encre/75">{`Lancé à ${ecrireHeure(sos.lanceLe)}${sos.lancePar ? ` par ${sos.lancePar}` : ""}. Les gourmands du coin le voient dans l'app.`}</Text>
        <Bouton libelle="Arrêter le SOS" variante="blanc" desactive={enCours} onPress={() => setConfirmation("arreter")} />
        <FeuilleConfirmation
          visible={confirmation === "arreter"}
          emoji="🛟"
          titre="Arrêter le SOS ?"
          detail="Il disparaît tout de suite de l'app, et il ne se relance pas avant demain."
          libelleConfirmer="Arrêter le SOS"
          libelleRester="Je le garde"
          onConfirmer={onArreter}
          onFermer={() => setConfirmation(null)}
        />
      </View>
    );
  }

  if (sos || !moment.sosPossible) {
    const fini = sos?.arreteLe ? `arrêté à ${ecrireHeure(sos.arreteLe)}` : sos ? `fini à ${ecrireHeure(sos.jusqua)}` : "déjà lancé";
    return (
      <View className="gap-2 rounded-carte border-2 border-encre bg-white p-4">
        <Text className="font-texte-gras text-base text-encre">{`🌙 Le SOS de ce soir est ${fini}`}</Text>
        <Text className="font-texte text-sm leading-5 text-gris">Un SOS par jour : le prochain se lance demain. Le message du moment, lui, reste à ta main.</Text>
      </View>
    );
  }

  const choixFin = fins.find((f) => f.cle === fin) ?? null;
  async function lancer() {
    if (!choixFin) return setErreur("jusqua");
    const refus = await onLancer({ places, offre: offre.trim() || null, jusqua: choixFin.jusqua });
    setErreur(refus);
  }

  return (
    <View className="gap-5">
      <Text className="font-texte text-base leading-6 text-gris">
        {lierPonctuation("Des tables vides ce soir ? Lance un SOS : les gourmands du coin le voient tout de suite, avec ton offre si tu en fais une.")}
      </Text>
      <Text className="-mb-3 font-texte-gras text-base text-encre">Places à remplir</Text>
      <CompteurPlusMoins libelle="Places à remplir" valeur={places} min={SOS_PLACES_MIN} max={SOS_PLACES_MAX} unite={(n) => `${n} place${n > 1 ? "s" : ""}`} onChanger={setPlaces} />
      {erreur === "places" ? <Text className="font-texte text-sm text-rouge-texte">{ERREURS.places}</Text> : null}
      <ChampTexte
        libelle="Une petite offre ?"
        mention="facultatif"
        valeur={offre}
        onChangeTexte={(t) => {
          setOffre(t);
          if (erreur === "offre") setErreur(null);
        }}
        maxLength={SOS_OFFRE_MAX}
        placeholder="Un tiramisu offert"
        aide={`${offre.length}/${SOS_OFFRE_MAX}`}
        erreur={erreur === "offre" ? ERREURS.offre : null}
      />
      <ChoixFin libelle="Jusqu'à quand ?" choix={fins} choisi={fin} onChoisir={setFin} />
      {erreur === "jusqua" ? <Text className="font-texte text-sm text-rouge-texte">{ERREURS.jusqua}</Text> : null}
      <Bouton libelle="Lancer le SOS" variante="encre" desactive={enCours || !choixFin} onPress={() => setConfirmation("lancer")} />
      <FeuilleConfirmation
        visible={confirmation === "lancer"}
        emoji="🛟"
        titre="On lance le SOS ?"
        detail={`${places} place${places > 1 ? "s" : ""}, ${choixFin?.libelle.toLowerCase() ?? ""}. Un seul SOS par jour : même arrêté, il ne se relance pas avant demain.`}
        libelleConfirmer="C'est parti"
        libelleRester="Pas encore"
        onConfirmer={() => void lancer()}
        onFermer={() => setConfirmation(null)}
      />
    </View>
  );
}
