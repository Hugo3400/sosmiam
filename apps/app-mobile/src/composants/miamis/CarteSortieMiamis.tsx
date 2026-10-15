import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

import type { SortieMiamisApi } from "@sos-miam/commun/types/communaute";
import { Bouton } from "~/composants/interface/Bouton";
import { BadgePublicSortie } from "~/composants/miamis/BadgePublicSortie";
import { PuceEtiquetteSortie } from "~/composants/miamis/PuceEtiquetteSortie";
import { RondMiami } from "~/composants/miamis/RondMiami";
import { TEXTES_SORTIE_MIAMIS } from "~/contenus/textes-sorties-miamis";
import { correspondAMesEnvies } from "~/fonctions/miamis/correspond-a-mes-envies";
import { ecrireQuandCourt } from "~/fonctions/miamis/ecrire-quand-court";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";

type Props = {
  sortie: SortieMiamisApi;
  envies: readonly string[];
  envoi: boolean;
  onDemander: () => void;
};

const ETIQUETTES_MONTREES = 3;

function libelleBouton(sortie: SortieMiamisApi): string | null {
  switch (sortie.moi.place) {
    case "organisateur":
      return TEXTES_SORTIE_MIAMIS.carteOrganise;
    case "accepte":
      return TEXTES_SORTIE_MIAMIS.carteAccepte;
    case "attente":
      return TEXTES_SORTIE_MIAMIS.carteAttente;
    case "demande":
      return TEXTES_SORTIE_MIAMIS.carteDemande;
    case "aucune":
      return null;
  }
}

export function CarteSortieMiamis({ sortie, envies, envoi, onDemander }: Props) {
  const router = useRouter();
  const ouvrir = () => {
    vibrerLegerement();
    router.push({ pathname: "/potes/miamis/sortie/[id]", params: { id: sortie.id } });
  };
  const etat = libelleBouton(sortie);
  const quand = ecrireQuandCourt(sortie.quand);
  const places = `${sortie.participants.length} / ${sortie.places} places`;
  const organisateur = sortie.moi.place === "organisateur";

  return (
    <View style={{ width: 276 }} className="gap-2.5 rounded-carte border-2 border-encre bg-white p-4">
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
        accessibilityHint="Ouvre la sortie"
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
        {correspondAMesEnvies(sortie, envies) ? <PuceEtiquetteSortie nom={TEXTES_SORTIE_MIAMIS.carteCorrespond} accent /> : null}
        {sortie.etiquettes.slice(0, ETIQUETTES_MONTREES).map((e) => (
          <PuceEtiquetteSortie key={e.nom} nom={e.nom} libre={!e.officielle} />
        ))}
      </View>
      <View className="flex-row items-center gap-2">
        <RondMiami personne={sortie.organisateur} taille={28} />
        <Text numberOfLines={1} className="flex-1 font-texte text-[13px] text-encre">
          {organisateur ? (
            TEXTES_SORTIE_MIAMIS.tuOrganises
          ) : (
            <>
              <Text className="font-texte-semi">{`@${sortie.organisateur.pseudo}`}</Text>
              {` ${TEXTES_SORTIE_MIAMIS.organise}`}
            </>
          )}
        </Text>
      </View>
      {etat ? (
        <Bouton libelle={etat} variante={sortie.moi.place === "accepte" ? "jaune" : "blanc"} petit onPress={ouvrir} indice="Ouvre la sortie" />
      ) : (
        <Bouton
          libelle={envoi ? "Un instant…" : TEXTES_SORTIE_MIAMIS.carteJeViens}
          variante="encre"
          petit
          desactive={envoi}
          onPress={onDemander}
          libelleLu={`${TEXTES_SORTIE_MIAMIS.carteJeViens} à ${sortie.titre}`}
          indice={`@${sortie.organisateur.pseudo} reçoit ta demande et l'accepte, ou pas`}
        />
      )}
    </View>
  );
}
