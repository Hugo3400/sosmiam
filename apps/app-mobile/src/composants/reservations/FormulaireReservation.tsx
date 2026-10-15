import { Text, View } from "react-native";

import { parleDAlcool } from "@sos-miam/commun/fonctions/prevention/parle-d-alcool";
import { remplirModele } from "@sos-miam/commun/fonctions/texte/remplir-modele";
import { MESSAGE_RESERVATION_MAX, PERSONNES_RESERVATION_MAX, PERSONNES_RESERVATION_MIN } from "@sos-miam/commun/regles/reservations";
import type { Lieu } from "@sos-miam/commun/types/lieu";
import { ChampTexte } from "~/composants/interface/ChampTexte";
import { CompteurPlusMoins } from "~/composants/interface/CompteurPlusMoins";
import { MentionPrevention } from "~/composants/prevention/MentionPrevention";
import { ChoixCreneauReservation } from "~/composants/reservations/ChoixCreneauReservation";
import { ChoixJourReservation } from "~/composants/reservations/ChoixJourReservation";
import { EncadreReservation } from "~/composants/reservations/EncadreReservation";
import { EnTeteLieuReservation } from "~/composants/reservations/EnTeteLieuReservation";
import { RecapitulatifReservation } from "~/composants/reservations/RecapitulatifReservation";
import { TitreEtapeReservation } from "~/composants/reservations/TitreEtapeReservation";
import { SANS_CRENEAU, TEXTES_RESERVER_TABLE } from "~/contenus/textes-reserver-table";
import type { JourReservation } from "~/contenus/type-jour-reservation";
import { ecrireNombrePersonnes } from "~/fonctions/reservations/ecrire-nombre-personnes";
import { lireRaisonSansCreneau } from "~/fonctions/reservations/lire-raison-sans-creneau";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { direDeLieu } from "~/fonctions/visites/dire-de-lieu";

type Props = {
  lieu: Lieu;
  jours: readonly JourReservation[];
  aujourdhui: string;
  jour: JourReservation;
  heure: string | null;
  personnes: number;
  petitMot: string;
  erreurPetitMot: string | null;
  quand: string | null;
  onChoisirJour: (jour: string) => void;
  onChoisirHeure: (heure: string) => void;
  onChangerPersonnes: (personnes: number) => void;
  onChangerPetitMot: (texte: string) => void;
  onProchainJourOuvert: (() => void) | null;
};

function dessinerJourEtHeure(props: Props) {
  const { lieu, jours, aujourdhui, jour, heure } = props;
  const deLieu = direDeLieu(lieu.nom);
  if (lieu.ouverture.length === 0) {
    return (
      <EncadreReservation
        ton="doux"
        emoji="🕰️"
        titre={TEXTES_RESERVER_TABLE.sansHorairesTitre}
        texte={remplirModele(TEXTES_RESERVER_TABLE.sansHorairesTexte, { deLieu })}
      />
    );
  }
  const raison = lireRaisonSansCreneau(jour, aujourdhui);
  const sansCreneau = raison ? SANS_CRENEAU[raison] : null;
  return (
    <>
      <View className="gap-3">
        <TitreEtapeReservation titre={TEXTES_RESERVER_TABLE.jour} />
        <ChoixJourReservation jours={jours} aujourdhui={aujourdhui} choisi={jour.jour} onChoisir={props.onChoisirJour} />
      </View>

      <View className="gap-3">
        <TitreEtapeReservation titre={TEXTES_RESERVER_TABLE.heure} />
        {sansCreneau ? (
          <EncadreReservation
            ton="doux"
            emoji={sansCreneau.emoji}
            titre={sansCreneau.titre}
            texte={remplirModele(sansCreneau.texte, { deLieu })}
            action={
              props.onProchainJourOuvert
                ? { libelle: TEXTES_RESERVER_TABLE.prochainJourOuvert, indice: TEXTES_RESERVER_TABLE.indiceProchainJourOuvert, onPress: props.onProchainJourOuvert }
                : undefined
            }
          />
        ) : (
          <ChoixCreneauReservation creneaux={jour.creneaux} choisi={heure} onChoisir={props.onChoisirHeure} />
        )}
      </View>
    </>
  );
}

export function FormulaireReservation(props: Props) {
  const { lieu, personnes, petitMot, erreurPetitMot, quand } = props;
  const petitMotEnvoye = petitMot.trim().replace(/\s+/g, " ");
  const estBar = lieu.type === "bar";

  return (
    <View className="gap-7">
      <View className="gap-3">
        <EnTeteLieuReservation lieu={lieu} />
        {estBar ? <MentionPrevention /> : null}
      </View>

      {dessinerJourEtHeure(props)}

      <View className="gap-3">
        <TitreEtapeReservation titre={TEXTES_RESERVER_TABLE.personnes} />
        <CompteurPlusMoins
          libelle={TEXTES_RESERVER_TABLE.personnesLu}
          valeur={personnes}
          min={PERSONNES_RESERVATION_MIN}
          max={PERSONNES_RESERVATION_MAX}
          unite={ecrireNombrePersonnes}
          onChanger={props.onChangerPersonnes}
        />
        <Text className="font-texte text-sm leading-5 text-gris">{lierPonctuation(TEXTES_RESERVER_TABLE.grandeTablee)}</Text>
      </View>

      <View className="gap-3">
        <ChampTexte
          libelle={TEXTES_RESERVER_TABLE.petitMot}
          mention={TEXTES_RESERVER_TABLE.petitMotMention}
          valeur={petitMot}
          onChangeTexte={props.onChangerPetitMot}
          placeholder={TEXTES_RESERVER_TABLE.petitMotExemple}
          multiline
          maxLength={MESSAGE_RESERVATION_MAX}
          aide={`${TEXTES_RESERVER_TABLE.petitMotAide} · ${petitMot.length}/${MESSAGE_RESERVATION_MAX}`}
          erreur={erreurPetitMot}
        />
        {!estBar && parleDAlcool(petitMotEnvoye) ? <MentionPrevention variante="courte" /> : null}
      </View>

      {quand ? <RecapitulatifReservation nomLieu={lieu.nom} emojiLieu={lieu.emoji} quand={quand} personnes={personnes} petitMot={petitMotEnvoye || null} /> : null}
    </View>
  );
}
