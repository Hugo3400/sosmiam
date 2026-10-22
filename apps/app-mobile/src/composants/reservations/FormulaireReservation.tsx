import { ActivityIndicator, Text, View } from "react-native";

import { calculerMargeExpirationReservation } from "@sos-miam/commun/fonctions/reservations/calculer-marge-expiration-reservation";
import { parleDAlcool } from "@sos-miam/commun/fonctions/prevention/parle-d-alcool";
import { remplirModele } from "@sos-miam/commun/fonctions/texte/remplir-modele";
import { calculerJourParis } from "@sos-miam/commun/fonctions/temps/calculer-jour-paris";
import { MESSAGE_RESERVATION_MAX, PERSONNES_RESERVATION_MIN } from "@sos-miam/commun/regles/reservations";
import type { Lieu } from "@sos-miam/commun/types/lieu";
import { ChampTexte } from "~/composants/interface/ChampTexte";
import { CompteurPlusMoins } from "~/composants/interface/CompteurPlusMoins";
import { MentionPrevention } from "~/composants/prevention/MentionPrevention";
import { ChoixCreneauReservation } from "~/composants/reservations/ChoixCreneauReservation";
import { ChoixHorairesSecours } from "~/composants/reservations/ChoixHorairesSecours";
import { ChoixJourReservation } from "~/composants/reservations/ChoixJourReservation";
import { EncadreReservation } from "~/composants/reservations/EncadreReservation";
import { EnTeteLieuReservation } from "~/composants/reservations/EnTeteLieuReservation";
import { EtiquetteConfirmationImmediate } from "~/composants/reservations/EtiquetteConfirmationImmediate";
import { RecapitulatifReservation } from "~/composants/reservations/RecapitulatifReservation";
import { TitreEtapeReservation } from "~/composants/reservations/TitreEtapeReservation";
import { DELAIS_RESERVATION_TEXTES } from "~/contenus/textes-reglages-reservations";
import { SANS_CRENEAU, TEXTES_RESERVER_TABLE as T, TROP_TARD_VEILLE } from "~/contenus/textes-reserver-table";
import { estTelephoneALHeureDeParis } from "~/fonctions/dates/est-telephone-a-l-heure-de-paris";
import { decrireCreneauReservation } from "~/fonctions/reservations/decrire-creneau-reservation";
import { ecrireCreneauIso } from "~/fonctions/reservations/ecrire-creneau-iso";
import { ecrireNombrePersonnes } from "~/fonctions/reservations/ecrire-nombre-personnes";
import { lireRaisonSansCreneau } from "~/fonctions/reservations/lire-raison-sans-creneau";
import { rangerCreneauxParService } from "~/fonctions/reservations/ranger-creneaux-par-service";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { direDeLieu } from "~/fonctions/visites/dire-de-lieu";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import type { utiliserFormulaireReservation } from "~/hooks/utiliser-formulaire-reservation";
import type { Palette } from "~/hooks/utiliser-theme";

type Props = {
  lieu: Lieu;
  formulaire: ReturnType<typeof utiliserFormulaireReservation>;
  maintenantMs: number;
  petitMot: string;
  erreurPetitMot: string | null;
  onChangerPetitMot: (texte: string) => void;
};

function dessinerHeures({ lieu, formulaire: f, maintenantMs }: Props, couleurs: Palette) {
  const deLieu = direDeLieu(lieu.nom);
  if (!f.jours.pret) {
    return (
      <View className="items-start py-2">
        <ActivityIndicator color={couleurs.encre} accessibilityLabel={T.chargementCreneaux} />
      </View>
    );
  }
  if (f.jours.source === "local" && lieu.ouverture.length === 0) {
    return <EncadreReservation ton="doux" emoji="🕰️" titre={T.sansHorairesTitre} texte={remplirModele(T.sansHorairesTexte, { deLieu })} />;
  }
  const etat = f.jours.jours.find((j) => j.jour === f.jour)?.etat ?? "ouvert";
  const raison = lireRaisonSansCreneau(etat, f.creneaux.frais ? f.disponibles.length : null);
  if (raison) {
    const modele = SANS_CRENEAU[raison];
    const texte = raison === "trop-tard" && f.jours.delai === "veille" ? TROP_TARD_VEILLE : modele.texte;
    const valeurs = { deLieu, personnes: ecrireNombrePersonnes(f.personnes), delai: DELAIS_RESERVATION_TEXTES[f.jours.delai].court };
    const prochain = f.jours.jours.find((j) => j.jour > f.jour && j.etat === "ouvert");
    return (
      <EncadreReservation
        ton="doux"
        emoji={modele.emoji}
        titre={remplirModele(modele.titre, valeurs)}
        texte={remplirModele(texte, valeurs)}
        action={prochain ? { libelle: T.prochainJourOuvert, indice: T.indiceProchainJourOuvert, onPress: () => f.choisirJour(prochain.jour) } : undefined}
      />
    );
  }
  if (!f.creneaux.lus) {
    if (f.creneaux.horsLigne) {
      return <EncadreReservation ton="doux" emoji="📶" titre={T.horsLigneCreneauxTitre} texte={T.horsLigneCreneauxTexte} action={{ libelle: T.reessayer, indice: T.indiceReessayer, onPress: f.relire }} />;
    }
    return (
      <View className="items-start py-2">
        <ActivityIndicator color={couleurs.encre} accessibilityLabel={T.chargementCreneaux} />
      </View>
    );
  }
  const groupes = rangerCreneauxParService(f.disponibles, f.creneaux.lus.services);
  return (
    <View className="gap-3">
      <ChoixCreneauReservation groupes={groupes} choisi={f.choix.principal} personnes={f.personnes} delai={f.jours.delai} onChoisir={f.choisirHeure} />
      {f.ajustement ? <Text accessibilityLiveRegion="polite" className="font-texte-semi text-[14px] leading-5 text-encre">{lierPonctuation(f.ajustement)}</Text> : null}
      {f.creneaux.horsLigne ? <Text className="font-texte text-[13px] text-gris">{lierPonctuation(T.horsLigneCourt)}</Text> : null}
      {f.choix.principal && f.jours.source === "api" ? (
        <ChoixHorairesSecours
          groupes={groupes}
          principal={f.choix.principal}
          secours={f.choix.secours}
          automatique={f.acceptation === "automatique"}
          ouvert={f.planBOuvert}
          onOuvrir={f.ouvrirPlanB}
          onBasculer={f.basculerSecours}
          onFermer={f.fermerPlanB}
        />
      ) : null}
      {estTelephoneALHeureDeParis(maintenantMs) ? null : <Text className="font-texte text-[13px] leading-[18px] text-gris">{lierPonctuation(T.heureDeParis)}</Text>}
    </View>
  );
}

export function FormulaireReservation(props: Props) {
  const couleurs = utiliserCouleurs();
  const { lieu, formulaire: f, maintenantMs, petitMot, erreurPetitMot } = props;
  const petitMotEnvoye = petitMot.trim().replace(/\s+/g, " ");
  const estBar = lieu.type === "bar";
  const automatique = f.acceptation === "automatique";
  const aujourdhui = calculerJourParis(maintenantMs);
  const quand = f.choix.principal ? decrireCreneauReservation(ecrireCreneauIso(f.jour, f.choix.principal), maintenantMs).lu : null;
  const minutesExpiration = Math.round(calculerMargeExpirationReservation({ acceptation: f.acceptation, delai: f.jours.delai }) / 60_000);

  return (
    <View className="gap-7">
      <View className="gap-3">
        <EnTeteLieuReservation lieu={lieu} />
        {automatique ? <EtiquetteConfirmationImmediate /> : null}
        {estBar ? <MentionPrevention /> : null}
      </View>

      <View className="gap-3">
        <TitreEtapeReservation titre={T.personnes} />
        <CompteurPlusMoins
          libelle={T.personnesLu}
          valeur={f.personnes}
          min={PERSONNES_RESERVATION_MIN}
          max={f.jours.personnesMax}
          unite={ecrireNombrePersonnes}
          onChanger={f.changerPersonnes}
        />
        <Text className="font-texte text-sm leading-5 text-gris">{lierPonctuation(remplirModele(T.grandeTablee, { max: String(f.jours.personnesMax) }))}</Text>
      </View>

      <View className="gap-3">
        <TitreEtapeReservation titre={T.jour} />
        <ChoixJourReservation jours={f.jours.jours} aujourdhui={aujourdhui} choisi={f.jour} onChoisir={f.choisirJour} />
      </View>

      <View className="gap-3">
        <TitreEtapeReservation titre={T.heure} />
        {dessinerHeures(props, couleurs)}
      </View>

      <View className="gap-3">
        <ChampTexte
          libelle={T.petitMot}
          mention={T.petitMotMention}
          valeur={petitMot}
          onChangeTexte={props.onChangerPetitMot}
          placeholder={T.petitMotExemple}
          multiline
          maxLength={MESSAGE_RESERVATION_MAX}
          aide={`${T.petitMotAide} · ${petitMot.length}/${MESSAGE_RESERVATION_MAX}`}
          erreur={erreurPetitMot}
        />
        {!estBar && parleDAlcool(petitMotEnvoye) ? <MentionPrevention variante="courte" /> : null}
      </View>

      {quand ? (
        <RecapitulatifReservation
          nomLieu={lieu.nom}
          emojiLieu={lieu.emoji}
          quand={quand}
          secours={f.choix.secours}
          personnes={f.personnes}
          petitMot={petitMotEnvoye || null}
          automatique={automatique}
          minutesExpiration={minutesExpiration}
        />
      ) : null}
    </View>
  );
}
