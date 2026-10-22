import { useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";

import { DELAI_RELANCE_ALERTE_SECONDES, ENDROITS_ALERTE, LONGUEUR_MAX_DETAIL_ALERTE, type EndroitAlerte } from "@sos-miam/commun/regles/miam-safe";
import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import type { StatutAlerteMiamSafe } from "@sos-miam/commun/types/miam-safe";
import { Bouton } from "~/composants/interface/Bouton";
import { ChampTexte } from "~/composants/interface/ChampTexte";
import { Pastille } from "~/composants/interface/Pastille";
import { NumerosUrgence } from "~/composants/miam-safe/NumerosUrgence";
import { ECHEC_ALERTE_MIAM_SAFE, ECHECS_ALERTE_MIAM_SAFE, LIBELLES_ENDROIT_ALERTE } from "~/contenus/miam-safe";
import { ecrireHeure } from "~/fonctions/dates/ecrire-heure";
import { deplacerFocusLecteurEcran } from "~/fonctions/interaction/deplacer-focus-lecteur-ecran";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserServices } from "~/hooks/utiliser-services";
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
const SOUCI_EQUIPE = lierPonctuation("Le souci vient de l'équipe ? Appelle plutôt un proche ou les secours.");
const PAS_SEUL = "Ne reste pas seul·e : appelle les secours, ou préviens un pote.";
const DELAI_FOCUS_ECHEC_MS = 200;

function decrireEnvoi(telephones: number | null, heure: string): string {
  if (telephones === null) return lierPonctuation(`Elle est partie à ${heure} vers l'équipe du lieu, avec ton prénom et où tu es. Rien ne sonne de ton côté.`);
  const vers = `${telephones} téléphone${telephones > 1 ? "s" : ""}`;
  return lierPonctuation(`Elle est partie à ${heure} sur ${vers} de l'équipe, avec ton prénom et où tu es. Rien ne sonne de ton côté.`);
}

export function AlerteComptoirMiamSafe({ lieuId, cle, alerte, aRelire, renvoi, onRenvoyer, onPrevenirPote }: Props) {
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
    <Bouton libelle="Renvoyer une alerte" variante="blanc" petit indice="Une nouvelle alerte silencieuse à l'équipe du lieu" onPress={recommencer} />
  );

  if (suivie && etat === "sans-reponse") {
    return (
      <View className="gap-4">
        <Text accessibilityRole="alert" className="font-texte-gras text-lg text-encre">{aRelire ? "On regarde si l'équipe a répondu…" : "L'équipe n'a pas encore répondu."}</Text>
        <Text className="font-texte text-base leading-6 text-gris">
          {lierPonctuation(`Ton alerte de ${ecrireHeure(new Date(suivie.envoyeeLe))} est remontée à l'équipe SOS Miam. ${PAS_SEUL}`)}
        </Text>
        <NumerosUrgence />
        <Bouton libelle="Prévenir un pote" variante="encre" onPress={onPrevenirPote} />
        {renvoyer}
      </View>
    );
  }

  if (suivie && etat === "envoyee" && suivie.telephones === 0) {
    return (
      <View className="gap-4">
        <View accessible accessibilityRole="alert" className="gap-2 rounded-2xl bg-tomate p-4">
          <Text className="font-texte-gras text-base text-nuit">{"⚠️ L'équipe n'a rien reçu"}</Text>
          <Text className="font-texte text-base leading-6 text-nuit">
            {lierPonctuation("Aucun téléphone de l'équipe n'a reçu l'alerte. Va voir quelqu'un de l'équipe si tu peux, ou préviens un pote.")}
          </Text>
        </View>
        <NumerosUrgence />
        <Bouton libelle="Prévenir un pote" variante="encre" onPress={onPrevenirPote} />
        {renvoyer}
      </View>
    );
  }

  if (suivie) {
    const enRoute = etat === "en-route";
    const texte = enRoute
      ? lierPonctuation(`Elle a répondu « On arrive » à ${ecrireHeure(new Date(suivie.reponduLe ?? suivie.envoyeeLe))}. Reste où tu es si tu peux : quelqu'un vient te voir discrètement.`)
      : decrireEnvoi(suivie.telephones, ecrireHeure(new Date(suivie.envoyeeLe)));
    return (
      <View className="gap-4">
        <View accessible accessibilityLiveRegion="polite" className={`gap-1 rounded-2xl p-4 ${enRoute ? "bg-jaune" : "bg-carte"}`}>
          <Text className={`font-texte-gras text-lg ${enRoute ? "text-nuit" : "text-encre"}`}>{enRoute ? "L'équipe arrive" : "Alerte envoyée"}</Text>
          <Text className={`font-texte text-base leading-6 ${enRoute ? "text-nuit" : "text-encre"}`}>{texte}</Text>
        </View>
        {enRoute ? null : (
          <Text className="font-texte text-sm leading-5 text-gris">
            {lierPonctuation(`Sans réponse dans ${MINUTES_RELANCE} minutes, on te propose d'appeler les secours ou de prévenir un pote.`)}
          </Text>
        )}
        <NumerosUrgence />
        {enRoute ? <Bouton libelle="Nouvelle alerte" variante="blanc" petit indice="Si tu as encore besoin de l'équipe" onPress={recommencer} /> : null}
      </View>
    );
  }

  return (
    <View className="gap-4">
      {echec ? (
        <>
          <View ref={refEchec} accessible accessibilityRole="alert" className="gap-2 rounded-2xl bg-tomate p-4">
            <Text className="font-texte-gras text-base text-nuit">{"⚠️ L'alerte n'est pas partie"}</Text>
            <Text className="font-texte text-base leading-6 text-nuit">{lierPonctuation(`${ECHECS_ALERTE_MIAM_SAFE[echec] ?? ECHEC_ALERTE_MIAM_SAFE} ${PAS_SEUL}`)}</Text>
          </View>
          <NumerosUrgence />
          <Bouton libelle="Prévenir un pote" variante="encre" onPress={onPrevenirPote} />
        </>
      ) : null}
      <Text className="font-texte text-base leading-6 text-gris">{"L'alerte donne à l'équipe ton prénom et où tu es, jamais ton nom ni ta photo."}</Text>
      <View className="flex-row flex-wrap gap-2">
        {ENDROITS_ALERTE.map((e, i) => (
          <Pastille key={e} libelle={LIBELLES_ENDROIT_ALERTE[e]} role="radio" position={i + 1} total={ENDROITS_ALERTE.length} choisi={endroit === e} onPress={() => setEndroit(e)} />
        ))}
      </View>
      <ChampTexte
        libelle="Un détail pour te trouver"
        mention="facultatif"
        valeur={detail}
        onChangeTexte={setDetail}
        placeholder="Table 12, pull vert…"
        maxLength={LONGUEUR_MAX_DETAIL_ALERTE}
      />
      <Bouton
        libelle={envoi ? "Envoi…" : "Envoyer en silence"}
        variante="encre"
        desactive={endroit === null || envoi}
        indice={endroit === null ? "Dis d'abord où tu es" : "L'alerte part sur les téléphones de l'équipe du lieu"}
        onPress={() => void envoyer()}
      />
      <Text className="text-center font-texte text-sm leading-5 text-gris">{SOUCI_EQUIPE}</Text>
    </View>
  );
}
