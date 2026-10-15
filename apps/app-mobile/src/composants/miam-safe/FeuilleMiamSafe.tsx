import { useRouter, type Href } from "expo-router";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";

import { PHRASE_MIAM_SAFE } from "@sos-miam/commun/regles/miam-safe";
import { Bouton } from "~/composants/interface/Bouton";
import { FeuilleBas } from "~/composants/interface/FeuilleBas";
import { AlerteComptoirMiamSafe } from "~/composants/miam-safe/AlerteComptoirMiamSafe";
import { ChoixAideMiamSafe, type CharteLueMiamSafe, type VueAideMiamSafe } from "~/composants/miam-safe/ChoixAideMiamSafe";
import { FeuilleSecoursMiamSafe } from "~/composants/miam-safe/FeuilleSecoursMiamSafe";
import { PrevenirPoteMiamSafe } from "~/composants/miam-safe/PrevenirPoteMiamSafe";
import { RaconterMiamSafe } from "~/composants/miam-safe/RaconterMiamSafe";
import { utiliserEtatMiamSafeLieu, type EtatLectureMiamSafeLieu } from "~/hooks/utiliser-etat-miam-safe-lieu";
import { utiliserServices } from "~/hooks/utiliser-services";
import { lireAlerteGardeeMiamSafe } from "~/services/memoire-alertes-miam-safe";

type Props = {
  visible: boolean;
  lieuId: number;
  nomLieu: string;
  engage?: boolean;
  avecCompte: boolean;
  onFermer: () => void;
  onMontrerEcran?: () => void;
  onCreerCompte: () => void;
};

type Vue = "choix" | VueAideMiamSafe;

const TITRES: Record<Vue, string> = {
  choix: "Miam Safe",
  pote: "Prévenir un pote",
  comptoir: "Demander au comptoir",
  alerte: "Alerter le comptoir",
  raconter: "Raconte-nous",
};

const DELAI_FERMETURE_FEUILLE_MS = 450;

const TEXTES_COMPTOIR_SANS_PHRASE: Record<Exclude<CharteLueMiamSafe, "signee">, string> = {
  "pas-signee": "Ce lieu n'a pas signé la charte Miam Safe : son équipe ne connaît peut-être pas Miam Safe. L'écran lui dit en clair que tu as besoin d'aide, et quoi faire.",
  "en-cours": "On vérifie si ce lieu a signé la charte Miam Safe. L'écran dit en clair à l'équipe que tu as besoin d'aide, et quoi faire.",
  inconnue: "On n'a pas pu vérifier si ce lieu a signé la charte Miam Safe. L'écran dit en clair à l'équipe que tu as besoin d'aide, et quoi faire.",
};

function lireCharte({ lecture, engage }: EtatLectureMiamSafeLieu): CharteLueMiamSafe {
  if (lecture === "lue") return engage ? "signee" : "pas-signee";
  return lecture === "en-cours" ? "en-cours" : "inconnue";
}

export function FeuilleMiamSafe({ visible, lieuId, nomLieu, avecCompte, onFermer, onCreerCompte }: Props) {
  const router = useRouter();
  const { source } = utiliserServices();
  const etatLieu = utiliserEtatMiamSafeLieu(lieuId);
  const charte = lireCharte(etatLieu);
  const { lecture, relire } = etatLieu;
  const [vue, setVue] = useState<Vue>("choix");
  const [ouverte, setOuverte] = useState(false);

  if (visible !== ouverte) {
    setOuverte(visible);
    if (visible) setVue(lireAlerteGardeeMiamSafe(source, lieuId) ? "alerte" : "choix");
  }

  useEffect(() => {
    if (visible && lecture === "ratee") relire();
  }, [visible, lecture, relire]);

  if (!avecCompte) return <FeuilleSecoursMiamSafe visible={visible} nomLieu={nomLieu} onFermer={onFermer} onCreerCompte={onCreerCompte} />;

  const ouvrirApresFermeture = (chemin: Href) => {
    onFermer();
    setTimeout(() => router.push(chemin), DELAI_FERMETURE_FEUILLE_MS);
  };

  return (
    <FeuilleBas
      visible={visible}
      titre={TITRES[vue]}
      sousTitre={vue === "choix" ? `${nomLieu} · on est là, prends ton temps.` : undefined}
      onFermer={onFermer}
      pied={vue === "choix" ? <Bouton libelle="Fermer" variante="blanc" onPress={onFermer} /> : <Bouton libelle="Retour" variante="blanc" onPress={() => setVue("choix")} />}
    >
      {vue === "choix" ? <ChoixAideMiamSafe charte={charte} onChoisir={setVue} /> : null}
      {vue === "pote" ? (
        <PrevenirPoteMiamSafe
          lieuId={lieuId}
          nomLieu={nomLieu}
          onOuvrirPartage={(partageId, telephones) => {
            onFermer();
            router.push((telephones === null ? `/miam-safe/partage/${partageId}` : `/miam-safe/partage/${partageId}?telephones=${telephones}`) as Href);
          }}
        />
      ) : null}
      {vue === "alerte" ? <AlerteComptoirMiamSafe lieuId={lieuId} onPrevenirPote={() => setVue("pote")} /> : null}
      {vue === "raconter" ? <RaconterMiamSafe lieuId={lieuId} nomLieu={nomLieu} /> : null}
      {vue === "comptoir" && charte === "signee" ? (
        <View className="gap-4">
          <Text className="font-texte text-base leading-6 text-gris">Dis cette phrase à quelqu'un de l'équipe. Elle ne veut rien dire pour les autres.</Text>
          <Text className="font-titre-gras text-3xl text-encre">« {PHRASE_MIAM_SAFE} »</Text>
          <Text className="font-texte text-base leading-6 text-gris">Pas envie de parler ? Montre l'écran : il est sombre et discret, la consigne n'est écrite qu'en petit.</Text>
          <Bouton libelle="Montrer l'écran au personnel" variante="encre" onPress={() => ouvrirApresFermeture("/miam-safe/comptoir?phrase=1" as Href)} />
        </View>
      ) : null}
      {vue === "comptoir" && charte !== "signee" ? (
        <View className="gap-4">
          <Text accessibilityLiveRegion="polite" className="font-texte text-base leading-6 text-gris">{TEXTES_COMPTOIR_SANS_PHRASE[charte]}</Text>
          <Bouton libelle="Montrer l'écran à l'équipe" variante="encre" onPress={() => ouvrirApresFermeture("/miam-safe/comptoir" as Href)} />
          <Text className="font-texte text-sm leading-5 text-gris">Le souci vient de l'équipe ? Appelle plutôt un proche ou les secours.</Text>
        </View>
      ) : null}
    </FeuilleBas>
  );
}
