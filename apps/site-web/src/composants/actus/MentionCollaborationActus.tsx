import { LIBELLES_ACTUS_PAR_LANGUE } from "../../../../../packages/commun/src/contenus/libelles-actus.ts";
import { PastilleArticleActus } from "~/composants/actus/PastilleArticleActus";
import { utiliserTextes } from "~/hooks/utiliser-textes";

export function MentionCollaborationActus() {
  const L = utiliserTextes(LIBELLES_ACTUS_PAR_LANGUE);
  return (
    <PastilleArticleActus variante="blanc">
      <span lang="fr">{L.collaboration}</span>
      {L.collaborationGlose && ` · ${L.collaborationGlose}`}
    </PastilleArticleActus>
  );
}
