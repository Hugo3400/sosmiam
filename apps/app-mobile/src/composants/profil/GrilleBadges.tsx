import { useState } from "react";
import { View } from "react-native";

import { BADGES } from "@sos-miam/commun/contenus/badges";
import type { BadgeCatalogue, IdBadge } from "@sos-miam/commun/types/badge";
import { SectionPliable } from "~/composants/interface/SectionPliable";
import { CaseBadge } from "~/composants/profil/CaseBadge";
import { DetailBadge } from "~/composants/profil/DetailBadge";
import { MESURES_BADGES_DEMO } from "~/contenus/badges-demo";
import { PRECISIONS_BADGES } from "~/contenus/precisions-badges";
import { rangerBadges } from "~/fonctions/ambassadeur/ranger-badges";

type Props = {
  /** Identifiants des badges obtenus : ceux du compte, ou en démo ceux comptés sur le téléphone (listerBadgesObtenus) */
  obtenus: string[];
  /** Démo : seuls les badges de MESURES_BADGES_DEMO se gagnent sur le téléphone */
  demo: boolean;
};

const POSSIBLE = "À débloquer, c'est possible dès maintenant !";
const SOUS_CLE_DEMO = "Dans la démo, celui-ci reste sous clé : il se gagne pour de vrai avec un compte.";
const PAR_RANGEE = 4;

/**
 * Tes badges en grille (le catalogue partagé, BADGES) : les obtenus en couleur, les autres estompés avec 🔒. Touche un
 * badge pour savoir comment l'obtenir.
 */
export function GrilleBadges({ obtenus, demo }: Props) {
  const [choisi, setChoisi] = useState<IdBadge | null>(null);
  const ranges = rangerBadges(obtenus);
  const reste = BADGES.length - obtenus.length;
  // Ce qui reste à faire pour un badge pas encore obtenu
  const direCommentObtenir = (id: IdBadge) => {
    const precision = PRECISIONS_BADGES[id];
    if (precision && !precision.possible) return precision.texte;
    if (demo) return MESURES_BADGES_DEMO[id] ? POSSIBLE : SOUS_CLE_DEMO;
    return precision?.texte ?? POSSIBLE;
  };

  const dessinerCases = (badges: readonly BadgeCatalogue[]) => (
    <View className="-m-1 flex-row flex-wrap">
      {badges.map((badge) => {
        const obtenu = obtenus.includes(badge.id);
        const selectionne = badge.id === choisi;
        return (
          <CaseBadge
            key={badge.id}
            badge={badge}
            obtenu={obtenu}
            selectionne={selectionne}
            commentObtenir={obtenu ? null : direCommentObtenir(badge.id)}
            onToucher={() => setChoisi(selectionne ? null : badge.id)}
          />
        );
      })}
    </View>
  );

  const dessinerGrille = (badges: readonly BadgeCatalogue[]) => {
    const position = badges.findIndex((b) => b.id === choisi);
    const detail = position >= 0 ? badges[position] : null;
    const finRangee = detail ? (Math.floor(position / PAR_RANGEE) + 1) * PAR_RANGEE : badges.length;
    const suite = badges.slice(finRangee);
    return (
      <>
        {dessinerCases(badges.slice(0, finRangee))}
        <DetailBadge badge={detail} obtenu={detail !== null && obtenus.includes(detail.id)} commentObtenir={detail ? direCommentObtenir(detail.id) : ""} />
        {suite.length > 0 ? dessinerCases(suite) : null}
      </>
    );
  };

  return (
    <SectionPliable
      section="badges"
      titre="Tes badges"
      resume={[reste > 0 ? `Encore ${reste} à débloquer : la chasse est ouverte !` : "Collection complète : la Brigade en reste bouche bée !"]}
      compteur={{ texte: `${obtenus.length}/${BADGES.length}`, lu: `${obtenus.length} sur ${BADGES.length}` }}
      apercu={dessinerGrille(ranges.slice(0, PAR_RANGEE))}
    >
      {dessinerGrille(ranges)}
    </SectionPliable>
  );
}
