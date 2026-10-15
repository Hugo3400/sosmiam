import { useState } from "react";
import { Text, View } from "react-native";

import { MESSAGES_SERVICE } from "@sos-miam/commun/contenus/messages-services";
import { DELAI_RELANCE_ALERTE_SECONDES, ENDROITS_ALERTE, LONGUEUR_MAX_DETAIL_ALERTE, type EndroitAlerte } from "@sos-miam/commun/regles/miam-safe";
import type { StatutAlerteMiamSafe } from "@sos-miam/commun/types/miam-safe";
import { Bouton } from "~/composants/interface/Bouton";
import { ChampTexte } from "~/composants/interface/ChampTexte";
import { Pastille } from "~/composants/interface/Pastille";
import { NumerosUrgence } from "~/composants/miam-safe/NumerosUrgence";
import { LIBELLES_ENDROIT_ALERTE } from "~/contenus/miam-safe";
import { ecrireHeure } from "~/fonctions/dates/ecrire-heure";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserServices } from "~/hooks/utiliser-services";
import { garderAlerteMiamSafe, type AlerteGardeeMiamSafe } from "~/services/memoire-alertes-miam-safe";
import { oublierMiamSafeLieu } from "~/services/memoire-miam-safe-lieux";

type Props = { lieuId: number; cle: string; alerte: AlerteGardeeMiamSafe | null; aRelire: boolean; onPrevenirPote: () => void };

const MINUTES_RELANCE = DELAI_RELANCE_ALERTE_SECONDES / 60;
const SOUCI_EQUIPE = lierPonctuation("Le souci vient de l'équipe ? Appelle plutôt un proche ou les secours.");

function decrireEnvoi(telephones: number | null, heure: string): string {
  if (telephones === null) return lierPonctuation(`Elle est partie à ${heure} vers l'équipe du lieu, avec ton prénom et où tu es. Rien ne sonne de ton côté.`);
  const vers = `${telephones} téléphone${telephones > 1 ? "s" : ""}`;
  return lierPonctuation(`Elle est partie à ${heure} sur ${vers} de l'équipe, avec ton prénom et où tu es. Rien ne sonne de ton côté.`);
}

export function AlerteComptoirMiamSafe({ lieuId, cle, alerte, aRelire, onPrevenirPote }: Props) {
  const { miamSafe } = utiliserServices();
  const [endroit, setEndroit] = useState<EndroitAlerte | null>(null);
  const [detail, setDetail] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [nouvelle, setNouvelle] = useState<StatutAlerteMiamSafe | null>(null);

  if (nouvelle !== null && (alerte === null || (alerte.statut === "en-route" && nouvelle !== "en-route"))) setNouvelle(null);

  const suivie = nouvelle === null ? alerte : null;
  const etat = suivie?.statut ?? "a-envoyer";

  const envoyer = async () => {
    if (endroit === null || envoi) return;
    setEnvoi(true);
    setErreur(null);
    const r = await miamSafe.envoyerAlerte({ lieuId, endroit, detail }).catch(() => null);
    setEnvoi(false);
    if (r?.ok) {
      garderAlerteMiamSafe(cle, { id: r.id, envoyeeLe: Date.now(), telephones: typeof r.telephones === "number" ? r.telephones : null });
      setNouvelle(null);
      setEndroit(null);
      setDetail("");
      return;
    }
    if (r?.erreur === "pas-miam-safe") oublierMiamSafeLieu(lieuId);
    const message = MESSAGES_SERVICE[r ? r.erreur : "hors-ligne"];
    setErreur(`${message.titre}. ${message.texte}`);
  };

  const recommencer = () => {
    if (alerte) setNouvelle(alerte.statut);
    setEndroit(null);
    setDetail("");
    setErreur(null);
  };

  const renvoyer = (
    <Bouton libelle="Renvoyer une alerte" variante="blanc" petit indice="Une nouvelle alerte silencieuse à l'équipe du lieu" onPress={recommencer} />
  );

  if (suivie && etat === "sans-reponse") {
    return (
      <View className="gap-4">
        <Text accessibilityRole="alert" className="font-texte-gras text-lg text-encre">{aRelire ? "On regarde si l'équipe a répondu…" : "L'équipe n'a pas encore répondu."}</Text>
        <Text className="font-texte text-base leading-6 text-gris">
          {lierPonctuation(`Ton alerte de ${ecrireHeure(new Date(suivie.envoyeeLe))} est remontée à l'équipe SOS Miam. Ne reste pas seul·e : appelle les secours, ou préviens un pote.`)}
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
          <Text className="font-texte-gras text-base text-encre">⚠️ L'équipe n'a rien reçu</Text>
          <Text className="font-texte text-base leading-6 text-encre">
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
        <View accessible accessibilityLiveRegion="polite" className={`gap-1 rounded-2xl p-4 ${enRoute ? "bg-jaune" : "bg-white"}`}>
          <Text className="font-texte-gras text-lg text-encre">{enRoute ? "L'équipe arrive" : "Alerte envoyée"}</Text>
          <Text className="font-texte text-base leading-6 text-encre">{texte}</Text>
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
      <Text className="font-texte text-base leading-6 text-gris">L'alerte donne à l'équipe ton prénom et où tu es, jamais ton nom ni ta photo.</Text>
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
      {erreur ? (
        <>
          <Text accessibilityRole="alert" className="font-texte-semi text-base leading-6 text-rouge-texte">{lierPonctuation(erreur)}</Text>
          <NumerosUrgence />
          <Bouton libelle="Prévenir un pote" variante="encre" onPress={onPrevenirPote} />
        </>
      ) : null}
    </View>
  );
}
