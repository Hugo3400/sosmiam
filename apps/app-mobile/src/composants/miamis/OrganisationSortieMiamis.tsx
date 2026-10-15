import { useRouter } from "expo-router";
import { Text, View } from "react-native";

import type { SortieMiamisApi } from "@sos-miam/commun/types/communaute";
import { Bouton } from "~/composants/interface/Bouton";
import { RondMiami } from "~/composants/miamis/RondMiami";
import { TEXTES_SORTIE_MIAMIS } from "~/contenus/textes-sorties-miamis";

type Props = {
  sortie: SortieMiamisApi;
};

export function OrganisationSortieMiamis({ sortie }: Props) {
  const router = useRouter();
  const moi = sortie.moi.place === "organisateur";
  const { tenues, prevues } = sortie.sortiesTenuesOrganisateur;
  const details = [TEXTES_SORTIE_MIAMIS.tenues(tenues, prevues), TEXTES_SORTIE_MIAMIS.rescousses(sortie.rescoussesOrganisateur)].filter(Boolean).join(" · ");

  return (
    <View className="flex-row items-center gap-3">
      <RondMiami personne={sortie.organisateur} taille={48} />
      <View className="flex-1 gap-0.5">
        <Text className="font-texte text-sm text-encre">
          {moi ? (
            <Text className="font-texte-gras">{TEXTES_SORTIE_MIAMIS.tuOrganises}</Text>
          ) : (
            <>
              <Text className="font-texte-gras">{`@${sortie.organisateur.pseudo}`}</Text>
              {` ${TEXTES_SORTIE_MIAMIS.organise}`}
            </>
          )}
        </Text>
        <Text className="font-texte text-xs text-gris">{details}</Text>
      </View>
      {moi ? null : (
        <Bouton
          libelle={TEXTES_SORTIE_MIAMIS.profil}
          variante="blanc"
          petit
          libelleLu={`Profil de @${sortie.organisateur.pseudo}`}
          onPress={() => router.push({ pathname: "/potes/profil/[id]", params: { id: sortie.organisateur.id } })}
        />
      )}
    </View>
  );
}
