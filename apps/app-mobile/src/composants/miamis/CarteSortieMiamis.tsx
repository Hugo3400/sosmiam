import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { NOMS_ETIQUETTES_OFFICIELLES_PAR_LANGUE } from "@sos-miam/commun/contenus/etiquettes-officielles";
import type { SortieMiamisApi } from "@sos-miam/commun/types/communaute";
import type { Traduction } from "@sos-miam/commun/types/traduction";
import { Bouton } from "~/composants/interface/Bouton";
import { BadgePublicSortie } from "~/composants/miamis/BadgePublicSortie";
import { PuceEtiquetteSortie } from "~/composants/miamis/PuceEtiquetteSortie";
import { RondMiami } from "~/composants/miamis/RondMiami";
import { TEXTES_ECRANS_MIAMIS_PAR_LANGUE } from "~/contenus/textes-ecrans-miamis";
import { type TEXTES_SORTIE_MIAMIS, TEXTES_SORTIE_MIAMIS_PAR_LANGUE } from "~/contenus/textes-sorties-miamis";
import { correspondAMesEnvies } from "~/fonctions/miamis/correspond-a-mes-envies";
import { ecrireQuandCourt } from "~/fonctions/miamis/ecrire-quand-court";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  sortie: SortieMiamisApi;
  envies: readonly string[];
  envoi: boolean;
  onDemander: () => void;
};

const ETIQUETTES_MONTREES = 3;

function libelleBouton(sortie: SortieMiamisApi, T: Traduction<typeof TEXTES_SORTIE_MIAMIS>): string | null {
  switch (sortie.moi.place) {
    case "organisateur":
      return T.carteOrganise;
    case "accepte":
      return T.carteAccepte;
    case "attente":
      return T.carteAttente;
    case "demande":
      return T.carteDemande;
    case "aucune":
      return null;
  }
}

export function CarteSortieMiamis({ sortie, envies, envoi, onDemander }: Props) {
  const { langue } = utiliserLangue();
  const T = utiliserTextes(TEXTES_SORTIE_MIAMIS_PAR_LANGUE);
  const TE = utiliserTextes(TEXTES_ECRANS_MIAMIS_PAR_LANGUE);
  const nomsEtiquettes = utiliserTextes(NOMS_ETIQUETTES_OFFICIELLES_PAR_LANGUE);
  const router = useRouter();
  const ouvrir = () => {
    vibrerLegerement();
    router.push({ pathname: "/potes/miamis/sortie/[id]", params: { id: sortie.id } });
  };
  const etat = libelleBouton(sortie, T);
  const quand = ecrireQuandCourt(sortie.quand, langue);
  const places = TE.placesSortie(sortie.participants.length, sortie.places);
  const organisateur = sortie.moi.place === "organisateur";

  return (
    <View style={{ width: 276 }} className="gap-2.5 rounded-carte border-2 border-encre bg-carte p-4">
      <View className="flex-row items-center justify-between gap-2">
        <View className="rounded-full bg-jaune-clair px-2.5 py-1">
          <Text className="font-texte-gras text-xs text-encre">{quand}</Text>
        </View>
        <Text className="font-texte text-xs text-gris">{places}</Text>
      </View>
      <BadgePublicSortie publicSortie={sortie.public} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${sortie.titre}, ${sortie.lieu.nom}, ${quand}, ${places}`}
        accessibilityHint={TE.ouvrirSortie}
        onPress={ouvrir}
        className="gap-0.5 active:opacity-70"
      >
        <Text numberOfLines={2} className="font-titre-gras text-lg leading-6 text-encre">
          {sortie.titre}
        </Text>
        <Text numberOfLines={1} className="font-texte text-[13px] text-gris">
          {`${sortie.lieu.emoji} ${sortie.lieu.nom}`}
        </Text>
      </Pressable>
      <View className="flex-row flex-wrap gap-1.5">
        {correspondAMesEnvies(sortie, envies) ? <PuceEtiquetteSortie nom={T.carteCorrespond} accent /> : null}
        {sortie.etiquettes.slice(0, ETIQUETTES_MONTREES).map((e) => (
          <PuceEtiquetteSortie key={e.nom} nom={e.officielle ? (nomsEtiquettes[e.nom] ?? e.nom) : e.nom} libre={!e.officielle} />
        ))}
      </View>
      <View className="flex-row items-center gap-2">
        <RondMiami personne={sortie.organisateur} taille={28} />
        <Text numberOfLines={1} className="flex-1 font-texte text-[13px] text-encre">
          {organisateur ? (
            T.tuOrganises
          ) : (
            <>
              <Text className="font-texte-semi">{`@${sortie.organisateur.pseudo}`}</Text>
              {` ${T.organise}`}
            </>
          )}
        </Text>
      </View>
      {etat ? (
        <Bouton libelle={etat} variante={sortie.moi.place === "accepte" ? "jaune" : "blanc"} petit onPress={ouvrir} indice={TE.ouvrirSortie} />
      ) : (
        <Bouton
          libelle={envoi ? TE.unInstant : T.carteJeViens}
          variante="encre"
          petit
          desactive={envoi}
          onPress={onDemander}
          libelleLu={TE.jeViensA(sortie.titre)}
          indice={TE.demandeIndice(sortie.organisateur.pseudo)}
        />
      )}
    </View>
  );
}
