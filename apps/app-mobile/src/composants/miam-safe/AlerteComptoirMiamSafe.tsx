import { useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";

import { DELAI_RELANCE_ALERTE_SECONDES, ENDROITS_ALERTE, LONGUEUR_MAX_DETAIL_ALERTE, type EndroitAlerte } from "@sos-miam/commun/regles/miam-safe";
import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import type { StatutAlerteMiamSafe } from "@sos-miam/commun/types/miam-safe";
import { Bouton } from "~/composants/interface/Bouton";
import { ChampTexte } from "~/composants/interface/ChampTexte";
import { Pastille } from "~/composants/interface/Pastille";
import { NumerosUrgence } from "~/composants/miam-safe/NumerosUrgence";
import { ECHEC_ALERTE_MIAM_SAFE_PAR_LANGUE, ECHECS_ALERTE_MIAM_SAFE_PAR_LANGUE, LIBELLES_ENDROIT_ALERTE_PAR_LANGUE } from "~/contenus/miam-safe";
import { TEXTES_MIAM_SAFE_ALERTE_PAR_LANGUE } from "~/contenus/textes-miam-safe-alerte";
import { deplacerFocusLecteurEcran } from "~/fonctions/interaction/deplacer-focus-lecteur-ecran";
import { ecrireHeureLangue } from "~/fonctions/langue/ecrire-heure-langue";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserServices } from "~/hooks/utiliser-services";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import { garderAlerteMiamSafe, type AlerteGardeeMiamSafe } from "~/services/memoire-alertes-miam-safe";
import { oublierMiamSafeLieu } from "~/services/memoire-miam-safe-lieux";

type Props = {
  lieuId: number;
  cle: string;
  alerte: AlerteGardeeMiamSafe | null;
  aRelire: boolean;
  renvoi: StatutAlerteMiamSafe | null;
  onRenvoyer: (statut: StatutAlerteMiamSafe | null) => void;
  onPrevenirPote: () => void;
};

const MINUTES_RELANCE = DELAI_RELANCE_ALERTE_SECONDES / 60;
const DELAI_FOCUS_ECHEC_MS = 200;

export function AlerteComptoirMiamSafe({ lieuId, cle, alerte, aRelire, renvoi, onRenvoyer, onPrevenirPote }: Props) {
  const T = utiliserTextes(TEXTES_MIAM_SAFE_ALERTE_PAR_LANGUE);
  const echecs = utiliserTextes(ECHECS_ALERTE_MIAM_SAFE_PAR_LANGUE);
  const echecParDefaut = utiliserTextes(ECHEC_ALERTE_MIAM_SAFE_PAR_LANGUE);
  const endroits = utiliserTextes(LIBELLES_ENDROIT_ALERTE_PAR_LANGUE);
  const { langue } = utiliserLangue();
  const { miamSafe } = utiliserServices();
  const [endroit, setEndroit] = useState<EndroitAlerte | null>(null);
  const [detail, setDetail] = useState("");
  const [echec, setEchec] = useState<ErreurService | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const refEchec = useRef<View>(null);

  useEffect(() => {
    if (!echec) return;
    const minuterie = setTimeout(() => deplacerFocusLecteurEcran(refEchec.current), DELAI_FOCUS_ECHEC_MS);
    return () => clearTimeout(minuterie);
  }, [echec]);

  const suivie = renvoi === null ? alerte : null;
  const etat = suivie?.statut ?? "a-envoyer";
  const heure = (instant: number) => ecrireHeureLangue(new Date(instant), langue);
  const decrireEnvoi = (telephones: number | null, quand: string) =>
    lierPonctuation(telephones === null ? T.envoiVersLieu(quand) : T.envoiSurTelephones(quand, telephones));

  const envoyer = async () => {
    if (endroit === null || envoi) return;
    setEnvoi(true);
    setEchec(null);
    const r = await miamSafe.envoyerAlerte({ lieuId, endroit, detail }).catch(() => null);
    setEnvoi(false);
    if (r?.ok) {
      garderAlerteMiamSafe(cle, { id: r.id, envoyeeLe: Date.now(), telephones: typeof r.telephones === "number" ? r.telephones : null });
      onRenvoyer(null);
      setEndroit(null);
      setDetail("");
      return;
    }
    if (r?.erreur === "pas-miam-safe") oublierMiamSafeLieu(lieuId);
    setEchec(r ? r.erreur : "hors-ligne");
  };

  const recommencer = () => {
    onRenvoyer(alerte?.statut ?? null);
    setEndroit(null);
    setDetail("");
    setEchec(null);
  };

  const renvoyer = (
    <Bouton libelle={T.renvoyer} variante="blanc" petit indice={T.renvoyerIndice} onPress={recommencer} />
  );

  if (suivie && etat === "sans-reponse") {
    return (
      <View className="gap-4">
        <Text accessibilityRole="alert" className="font-texte-gras text-lg text-encre">{aRelire ? T.relecture : T.pasEncoreRepondu}</Text>
        <Text className="font-texte text-base leading-6 text-gris">
          {lierPonctuation(`${T.remontee(heure(suivie.envoyeeLe))} ${T.pasSeul}`)}
        </Text>
        <NumerosUrgence />
        <Bouton libelle={T.prevenirPote} variante="encre" onPress={onPrevenirPote} />
        {renvoyer}
      </View>
    );
  }

  if (suivie && etat === "envoyee" && suivie.telephones === 0) {
    return (
      <View className="gap-4">
        <View accessible accessibilityRole="alert" className="gap-2 rounded-2xl bg-tomate p-4">
          <Text className="font-texte-gras text-base text-nuit">{T.rienRecuTitre}</Text>
          <Text className="font-texte text-base leading-6 text-nuit">{lierPonctuation(T.rienRecuTexte)}</Text>
        </View>
        <NumerosUrgence />
        <Bouton libelle={T.prevenirPote} variante="encre" onPress={onPrevenirPote} />
        {renvoyer}
      </View>
    );
  }

  if (suivie) {
    const enRoute = etat === "en-route";
    const texte = enRoute
      ? lierPonctuation(T.enRoute(heure(suivie.reponduLe ?? suivie.envoyeeLe)))
      : decrireEnvoi(suivie.telephones, heure(suivie.envoyeeLe));
    return (
      <View className="gap-4">
        <View accessible accessibilityLiveRegion="polite" className={`gap-1 rounded-2xl p-4 ${enRoute ? "bg-jaune" : "bg-carte"}`}>
          <Text className={`font-texte-gras text-lg ${enRoute ? "text-nuit" : "text-encre"}`}>{enRoute ? T.equipeArrive : T.alerteEnvoyee}</Text>
          <Text className={`font-texte text-base leading-6 ${enRoute ? "text-nuit" : "text-encre"}`}>{texte}</Text>
        </View>
        {enRoute ? null : (
          <Text className="font-texte text-sm leading-5 text-gris">
            {lierPonctuation(T.relance(MINUTES_RELANCE))}
          </Text>
        )}
        <NumerosUrgence />
        {enRoute ? <Bouton libelle={T.nouvelleAlerte} variante="blanc" petit indice={T.nouvelleAlerteIndice} onPress={recommencer} /> : null}
      </View>
    );
  }

  return (
    <View className="gap-4">
      {echec ? (
        <>
          <View ref={refEchec} accessible accessibilityRole="alert" className="gap-2 rounded-2xl bg-tomate p-4">
            <Text className="font-texte-gras text-base text-nuit">{T.pasPartieTitre}</Text>
            <Text className="font-texte text-base leading-6 text-nuit">{lierPonctuation(`${echecs[echec] ?? echecParDefaut} ${T.pasSeul}`)}</Text>
          </View>
          <NumerosUrgence />
          <Bouton libelle={T.prevenirPote} variante="encre" onPress={onPrevenirPote} />
        </>
      ) : null}
      <Text className="font-texte text-base leading-6 text-gris">{T.donnees}</Text>
      <View className="flex-row flex-wrap gap-2">
        {ENDROITS_ALERTE.map((e, i) => (
          <Pastille key={e} libelle={endroits[e]} role="radio" position={i + 1} total={ENDROITS_ALERTE.length} choisi={endroit === e} onPress={() => setEndroit(e)} />
        ))}
      </View>
      <ChampTexte
        libelle={T.detailLibelle}
        mention={T.facultatif}
        valeur={detail}
        onChangeTexte={setDetail}
        placeholder={T.detailPlaceholder}
        aide={T.detailAide || undefined}
        maxLength={LONGUEUR_MAX_DETAIL_ALERTE}
      />
      <Bouton
        libelle={envoi ? T.envoi : T.envoyer}
        variante="encre"
        desactive={endroit === null || envoi}
        indice={endroit === null ? T.indiceEndroit : T.indiceEnvoyer}
        onPress={() => void envoyer()}
      />
      <Text className="text-center font-texte text-sm leading-5 text-gris">{lierPonctuation(T.souciEquipe)}</Text>
    </View>
  );
}
