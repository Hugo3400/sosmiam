import { useRouter } from "expo-router";
import { Text, View } from "react-native";

import type { SortieMiamisApi } from "@sos-miam/commun/types/communaute";
import { Bouton } from "~/composants/interface/Bouton";
import { RondMiami } from "~/composants/miamis/RondMiami";
import { TEXTES_ECRANS_MIAMIS_PAR_LANGUE } from "~/contenus/textes-ecrans-miamis";
import { TEXTES_SORTIE_MIAMIS_PAR_LANGUE } from "~/contenus/textes-sorties-miamis";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  sortie: SortieMiamisApi;
};

export function OrganisationSortieMiamis({ sortie }: Props) {
  const TE = utiliserTextes(TEXTES_ECRANS_MIAMIS_PAR_LANGUE);
  const T = utiliserTextes(TEXTES_SORTIE_MIAMIS_PAR_LANGUE);
  const router = useRouter();
  const moi = sortie.moi.place === "organisateur";
  const { tenues, prevues } = sortie.sortiesTenuesOrganisateur;
  const details = [T.tenues(tenues, prevues), T.rescousses(sortie.rescoussesOrganisateur)].filter(Boolean).join(" · ");

  return (
    <View className="flex-row items-center gap-3">
      <RondMiami personne={sortie.organisateur} taille={48} />
      <View className="flex-1 gap-0.5">
        <Text className="font-texte text-sm text-encre">
          {moi ? (
            <Text className="font-texte-gras">{T.tuOrganises}</Text>
          ) : (
            <>
              <Text className="font-texte-gras">{`@${sortie.organisateur.pseudo}`}</Text>
              {` ${T.organise}`}
            </>
          )}
        </Text>
        <Text className="font-texte text-xs text-gris">{details}</Text>
      </View>
      {moi ? null : (
        <Bouton
          libelle={T.profil}
          variante="blanc"
          petit
          libelleLu={TE.profilDe(sortie.organisateur.pseudo)}
          onPress={() => router.push({ pathname: "/potes/profil/[id]", params: { id: sortie.organisateur.id } })}
        />
      )}
    </View>
  );
}
