import { type RefObject, useEffect, useRef } from "react";
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
  repere: RefObject<View | null>;
  onChoisir: (id: IdBadge | null) => void;
  onMontrer: (haut: number, bas: number) => void;
};

const PAR_RANGEE = 4;

export function FamilleBadges({ titre, badges, obtenus, choisi, demo, repere, onChoisir, onMontrer }: Props) {
  const rangeeChoisie = useRef<View>(null);
  const cadreDetail = useRef<View>(null);
  const compte = TEXTES_BADGES.compteFamille(badges.filter((b) => obtenus.includes(b.id)).length, badges.length);
  const position = badges.findIndex((b) => b.id === choisi);
  const detail = position >= 0 ? badges[position] : null;
  const rangees = Array.from({ length: Math.ceil(badges.length / PAR_RANGEE) }, (_, i) => badges.slice(i * PAR_RANGEE, (i + 1) * PAR_RANGEE));
  const derniereAvantDetail = detail ? Math.floor(position / PAR_RANGEE) : rangees.length - 1;

  useEffect(() => {
    const base = repere.current;
    const haut = rangeeChoisie.current;
    const bas = cadreDetail.current;
    if (!detail || !base || !haut || !bas) return;
    haut.measureLayout(base, (_x, yRangee) => {
      bas.measureLayout(base, (_xDetail, yDetail, _largeur, hauteurDetail) => onMontrer(yRangee, yDetail + hauteurDetail));
    });
  }, [detail, repere, onMontrer]);

  const dessinerRangees = (premiere: number, derniere: number) => (
    <View className="-m-1">
      {rangees.slice(premiere, derniere + 1).map((rangee, i) => (
        <View key={premiere + i} ref={detail && premiere + i === derniereAvantDetail ? rangeeChoisie : undefined} className="flex-row">
          {rangee.map((badge) => {
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
      ))}
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
      {dessinerRangees(0, derniereAvantDetail)}
      {detail ? (
        <View ref={cadreDetail}>
          <DetailBadge badge={detail} obtenu={obtenus.includes(detail.id)} commentObtenir={direCommentObtenirBadge(detail.id, demo)} />
        </View>
      ) : null}
      {derniereAvantDetail < rangees.length - 1 ? dessinerRangees(derniereAvantDetail + 1, rangees.length - 1) : null}
    </View>
  );
}
