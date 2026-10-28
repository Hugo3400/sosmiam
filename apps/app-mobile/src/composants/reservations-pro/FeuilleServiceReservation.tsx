import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { CALENDRIER_PAR_LANGUE } from "@sos-miam/commun/contenus/calendrier";
import { nommerServiceReservation } from "@sos-miam/commun/fonctions/reservations/nommer-service-reservation";
import { remplirModele } from "@sos-miam/commun/fonctions/texte/remplir-modele";
import { lireMinutesHeure } from "@sos-miam/commun/fonctions/temps/lire-minutes-heure";
import { PAS_CRENEAUX_POSSIBLES } from "@sos-miam/commun/regles/reglages-reservations";
import type { PasCreneaux, ServiceReservation } from "@sos-miam/commun/types/reglages-reservations";
import { Bouton } from "~/composants/interface/Bouton";
import { ChampTexte } from "~/composants/interface/ChampTexte";
import { ChoixJoursSemaine } from "~/composants/interface/ChoixJoursSemaine";
import { FeuilleBas } from "~/composants/interface/FeuilleBas";
import { Pastille } from "~/composants/interface/Pastille";
import { ApercuServiceReservation } from "~/composants/reservations-pro/ApercuServiceReservation";
import { ChampHeureService } from "~/composants/reservations-pro/ChampHeureService";
import { GrilleChoixHeure } from "~/composants/reservations-pro/GrilleChoixHeure";
import { ERREURS_SERVICE_PAR_LANGUE, TEXTES_FEUILLE_SERVICE_PAR_LANGUE } from "~/contenus/textes-reglages-reservations";
import { annoncerLecteurEcran } from "~/fonctions/interaction/annoncer-lecteur-ecran";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { formaterHeureTexteLangue } from "~/fonctions/langue/formater-heure-texte-langue";
import { ajusterDerniereArrivee } from "~/fonctions/reservations/ajuster-derniere-arrivee";
import { ecrireNomService } from "~/fonctions/reservations/ecrire-nom-service";
import { lireNombreCouverts } from "~/fonctions/reservations/lire-nombre-couverts";
import { listerMinutesArrivee } from "~/fonctions/reservations/lister-minutes-arrivee";
import { verifierServiceReservation, type BrouillonService } from "~/fonctions/reservations/verifier-service-reservation";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  visible: boolean;
  titre: string;
  depart: BrouillonService;
  autres: readonly ServiceReservation[];
  supprimable: boolean;
  onGarder: (service: ServiceReservation) => void;
  onSupprimer: () => void;
  onFermer: () => void;
};

type Erreur = { champ: string; texte: string } | null;

const HEURES = Array.from({ length: 18 }, (_, i) => i + 6);
const garderChiffres = (texte: string) => texte.replace(/\D/g, "").slice(0, 4);

export function FeuilleServiceReservation({ visible, titre, depart, autres, supprimable, onGarder, onSupprimer, onFermer }: Props) {
  const T = utiliserTextes(TEXTES_FEUILLE_SERVICE_PAR_LANGUE);
  const erreurs = utiliserTextes(ERREURS_SERVICE_PAR_LANGUE);
  const { jours: nomsJours } = utiliserTextes(CALENDRIER_PAR_LANGUE);
  const { langue } = utiliserLangue();
  const [b, setB] = useState<BrouillonService>(depart);
  const [ouvert, setOuvert] = useState<"premier" | "dernier" | null>(null);
  const [erreur, setErreur] = useState<Erreur>(null);
  const [ajustement, setAjustement] = useState<string | null>(null);

  const changer = (suite: Partial<BrouillonService>) => {
    const prochain = { ...b, ...suite };
    const dernier = ajusterDerniereArrivee(prochain.premier, prochain.dernier, prochain.pas);
    if (dernier !== prochain.dernier && suite.dernier === undefined) {
      const texte = remplirModele(T.heuresAjustees, { premier: formaterHeureTexteLangue(prochain.premier, langue), dernier: formaterHeureTexteLangue(dernier, langue) });
      setAjustement(texte);
      annoncerLecteurEcran(texte);
    }
    setB({ ...prochain, dernier });
    setErreur(null);
  };

  function garder() {
    const verifie = verifierServiceReservation(b, autres);
    if (verifie.ok) return onGarder(verifie.service);
    vibrerLegerement();
    if (verifie.champ === "chevauchement") {
      const nom = ecrireNomService(nommerServiceReservation(verifie.autre, autres), langue).titre;
      const service = nom.charAt(0).toLocaleLowerCase(langue === "en" ? "en-GB" : "fr-FR") + nom.slice(1);
      const texte = remplirModele(erreurs.chevauchement, { service, jour: nomsJours[verifie.jour] ?? "" });
      setErreur({ champ: "premier", texte });
      return annoncerLecteurEcran(texte);
    }
    const texte = erreurs[verifie.champ] ?? erreurs.autre;
    setErreur({ champ: verifie.champ, texte });
    annoncerLecteurEcran(texte);
  }

  const erreurDe = (champ: string) => (erreur?.champ === champ ? erreur.texte : null);
  const premierMin = lireMinutesHeure(b.premier) ?? 0;
  const heuresDernier = HEURES.filter((h) => h >= Math.floor(premierMin / 60) && listerMinutesArrivee(h, { premier: b.premier, pas: b.pas }).length > 0);
  const couverts = lireNombreCouverts(b.couverts);

  return (
    <FeuilleBas
      visible={visible}
      titre={titre}
      onFermer={onFermer}
      pied={
        <>
          <Bouton libelle={T.garder} onPress={garder} />
          <Bouton libelle={T.annuler} variante="blanc" onPress={onFermer} />
        </>
      }
    >
      <View className="gap-2">
        <Text className="font-texte-semi text-base text-encre">{T.jours}</Text>
        <ChoixJoursSemaine jours={b.jours} onChanger={(jours) => changer({ jours })} />
        <Text className={`font-texte text-[13px] leading-[18px] ${erreurDe("jours") ? "text-rouge-texte" : "text-gris"}`}>{lierPonctuation(erreurDe("jours") ?? T.joursAide)}</Text>
      </View>

      <View className="gap-3">
        <ChampHeureService libelle={T.premier} valeur={b.premier} ouvert={ouvert === "premier"} erreur={erreurDe("premier")} onBasculer={() => setOuvert(ouvert === "premier" ? null : "premier")} />
        {ouvert === "premier" ? (
          <GrilleChoixHeure
            valeur={b.premier}
            heures={HEURES}
            minutesPour={(heure) => listerMinutesArrivee(heure, null)}
            onChoisir={(premier, fini) => {
              changer({ premier });
              if (fini) setOuvert(null);
            }}
          />
        ) : null}
        <ChampHeureService
          libelle={T.dernier}
          valeur={b.dernier}
          ouvert={ouvert === "dernier"}
          aide={T.dernierAide}
          erreur={erreurDe("dernier")}
          onBasculer={() => setOuvert(ouvert === "dernier" ? null : "dernier")}
        />
        {ouvert === "dernier" ? (
          <GrilleChoixHeure
            valeur={b.dernier}
            heures={heuresDernier}
            minutesPour={(heure) => listerMinutesArrivee(heure, { premier: b.premier, pas: b.pas })}
            onChoisir={(dernier, fini) => {
              changer({ dernier });
              if (fini) setOuvert(null);
            }}
          />
        ) : null}
      </View>

      <View className="gap-2">
        <Text className="font-texte-semi text-base text-encre">{T.pas}</Text>
        <View accessibilityRole="radiogroup" className="flex-row flex-wrap gap-2">
          {PAS_CRENEAUX_POSSIBLES.map((pas: PasCreneaux, i) => (
            <Pastille
              key={pas}
              role="radio"
              libelle={remplirModele(T.pasLibelle, { minutes: String(pas) })}
              choisi={b.pas === pas}
              position={i + 1}
              total={PAS_CRENEAUX_POSSIBLES.length}
              onPress={() => changer({ pas })}
            />
          ))}
        </View>
        {ajustement ? <Text className="font-texte text-[13px] leading-[18px] text-encre">{lierPonctuation(ajustement)}</Text> : null}
      </View>

      <ChampTexte
        libelle={T.couvertsService}
        valeur={b.couverts}
        onChangeTexte={(texte) => changer({ couverts: garderChiffres(texte) })}
        placeholder="40"
        keyboardType="number-pad"
        inputMode="numeric"
        maxLength={4}
        aide={T.couvertsServiceAide}
        erreur={erreurDe("couvertsParService")}
      />

      {b.arrivees === null ? (
        <Pressable
          accessibilityRole="button"
          accessibilityHint={T.arriveesOuvrirIndice}
          onPress={() => {
            vibrerLegerement();
            changer({ arrivees: b.couverts });
          }}
          className="min-h-11 justify-center self-start active:opacity-60"
        >
          <Text className="font-texte-gras text-[15px] text-encre underline">{`${T.arriveesOuvrir} (${T.arriveesMention})`}</Text>
        </Pressable>
      ) : (
        <View className="gap-2">
          <ChampTexte
            libelle={T.arrivees}
            mention={T.arriveesMention}
            valeur={b.arrivees}
            onChangeTexte={(texte) => changer({ arrivees: garderChiffres(texte) })}
            placeholder={b.couverts || "8"}
            keyboardType="number-pad"
            inputMode="numeric"
            maxLength={4}
            aide={T.arriveesAide}
            erreur={erreurDe("couvertsParCreneau")}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityHint={T.arriveesFermerIndice}
            onPress={() => {
              vibrerLegerement();
              changer({ arrivees: null });
            }}
            className="min-h-11 justify-center self-start active:opacity-60"
          >
            <Text className="font-texte-gras text-[15px] text-encre underline">{T.arriveesFermer}</Text>
          </Pressable>
        </View>
      )}

      <ApercuServiceReservation
        premier={b.premier}
        dernier={b.dernier}
        pas={b.pas}
        couvertsParService={couverts}
        couvertsParCreneau={b.arrivees === null ? couverts : lireNombreCouverts(b.arrivees)}
      />

      {supprimable ? <Bouton libelle={T.supprimer} variante="blanc" petit onPress={onSupprimer} /> : null}
    </FeuilleBas>
  );
}
