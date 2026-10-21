import { Text, View } from "react-native";

import type { BadgeCatalogue, IdBadge } from "@sos-miam/commun/types/badge";
import { CaseBadge } from "~/composants/profil/CaseBadge";
import { DetailBadge } from "~/composants/profil/DetailBadge";
import { TEXTES_BADGES } from "~/contenus/textes-badges";
import { direCommentObtenirBadge } from "~/fonctions/ambassadeur/dire-comment-obtenir-badge";

type Props = {
  titre: string;
  badges: readonly BadgeCatalogue[];
  obtenus: readonly string[];
  choisi: IdBadge | null;
  demo: boolean;
  onChoisir: (id: IdBadge | null) => void;
};

const PAR_RANGEE = 4;

export function FamilleBadges({ titre, badges, obtenus, choisi, demo, onChoisir }: Props) {
  const compte = TEXTES_BADGES.compteFamille(badges.filter((b) => obtenus.includes(b.id)).length, badges.length);
  const position = badges.findIndex((b) => b.id === choisi);
  const detail = position >= 0 ? badges[position] : null;
  const finRangee = detail ? (Math.floor(position / PAR_RANGEE) + 1) * PAR_RANGEE : badges.length;

  const dessinerCases = (liste: readonly BadgeCatalogue[]) => (
    <View className="-m-1 flex-row flex-wrap">
      {liste.map((badge) => {
        const obtenu = obtenus.includes(badge.id);
        const selectionne = badge.id === choisi;
        return (
          <CaseBadge
            key={badge.id}
            badge={badge}
            obtenu={obtenu}
            selectionne={selectionne}
            commentObtenir={obtenu ? null : direCommentObtenirBadge(badge.id, demo)}
            onToucher={() => onChoisir(selectionne ? null : badge.id)}
          />
        );
      })}
    </View>
  );

  return (
    <View className="gap-2">
      <View className="flex-row items-baseline justify-between gap-2">
        <Text accessibilityRole="header" className="flex-1 font-titre-gras text-xl text-encre">
          {titre}
        </Text>
        <Text accessibilityLabel={compte.lu} className="font-texte-semi text-sm text-gris">
          {compte.texte}
        </Text>
      </View>
      {dessinerCases(badges.slice(0, finRangee))}
      {detail ? <DetailBadge badge={detail} obtenu={obtenus.includes(detail.id)} commentObtenir={direCommentObtenirBadge(detail.id, demo)} /> : null}
      {finRangee < badges.length ? dessinerCases(badges.slice(finRangee)) : null}
    </View>
  );
}
