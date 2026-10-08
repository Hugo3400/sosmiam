import { useMemo } from "react";

import { calculerAge } from "@sos-miam/commun/regles/calculer-age";
import { ID_MOI } from "@sos-miam/commun/regles/potes";
import { lieuxExemples } from "~/contenus/lieux-exemples";
import { publicationsExemples } from "~/contenus/publications-exemples";
import { bandesExemples } from "~/contenus/suivis-exemples";
import type { Suggestion, TypeSuggestion } from "~/contenus/type-suggestion";
import { filtrerLieuxSelonAge } from "~/fonctions/lieux/filtrer-lieux-selon-age";
import { suggererCreateurs } from "~/fonctions/suivi/suggerer-createurs";
import { suggererLieux } from "~/fonctions/suivi/suggerer-lieux";
import { suggererPersonnes } from "~/fonctions/suivi/suggerer-personnes";
import { utiliserActivite } from "~/hooks/utiliser-activite";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import { utiliserPointDeDepart } from "~/hooks/utiliser-point-de-depart";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import { utiliserSuivisPersonnes } from "~/hooks/utiliser-suivis-personnes";

/**
 * Suggestions « Tu pourrais suivre », dans l'ordre de `types` (personnes : potes de potes puis ta bande ; créateurs : de ta ville
 * puis populaires ; lieux : les plus proches), coupées à `max`. Jamais : toi, une personne bloquée ou signalée, un mineur quand tu es
 * adulte (ni rien que la règle peutSuivre refuse), ce que tu suis ou as déjà demandé, une suggestion masquée (✕), une publication
 * masquée, un lieu que ton âge écarte (bars sous 18 ans). Vide tant que l'activité et les suivis ne sont pas relus.
 * Visite sans compte : des créateurs (et des lieux si ta ville est connue), aucune personne.
 */
export function utiliserSuggestionsSuivi(types: readonly TypeSuggestion[], max = 10): Suggestion[] {
  const { profil, invite } = utiliserProfil();
  const activite = utiliserActivite();
  const communaute = utiliserCommunaute();
  const suivis = utiliserSuivisPersonnes();
  const depart = utiliserPointDeDepart();
  const pret = activite.chargee && (suivis.pret || invite);
  // Les appelants passent souvent un tableau écrit sur place : on compare son contenu, pas son identité
  const cleTypes = types.join(",");
  const age = profil ? calculerAge(profil.dateNaissance) : null;
  const ville = profil?.ville ?? null;

  const { suivis: clesSuivies, estMasquee } = activite;
  const { potes, bloques, trouverPote, estSignale, moiMineur } = communaute;
  const { relationAvec, suggestionsMasquees } = suivis;

  return useMemo(() => {
    if (!pret) return [];
    const masquees = new Set(suggestionsMasquees);
    const suivies = new Set(clesSuivies);
    const lieux = filtrerLieuxSelonAge(lieuxExemples, age);
    const publications = publicationsExemples.filter((p) => !estMasquee(p.id) && lieux.some((l) => l.id === p.lieuId));

    const listes: Record<TypeSuggestion, () => Suggestion[]> = {
      personne: () => {
        if (!suivis.pret) return [];
        const estCandidat = (id: string) => {
          const pote = trouverPote(id);
          if (id === ID_MOI || !pote || bloques.some((b) => b.id === id) || estSignale(id) || masquees.has(`personne:${id}`)) return false;
          // Un adulte ne voit jamais de mineur en suggestion (même là où la règle permettrait une demande)
          if (pote.mineur && !moiMineur) return false;
          const relation = relationAvec(id);
          return relation !== null && relation.jeSuis === "aucun" && relation.verdict.permis;
        };
        const prenomDe = (id: string) => trouverPote(id)?.prenom ?? id;
        return suggererPersonnes({ bande: potes.map((p) => p.id), bandes: bandesExemples, estCandidat, prenomDe }).flatMap(({ id, raison }) => {
          const pote = trouverPote(id);
          return pote
            ? [{ cle: `personne:${id}`, type: "personne" as const, emoji: pote.avatar, nom: pote.prenom, raison, ouvrir: { pathname: "/potes/profil/[id]" as const, params: { id } } }]
            : [];
        });
      },
      createur: () => {
        const exclus = new Set(
          publications.flatMap((p) => (p.auteur.type === "createur" ? [p.auteur.pseudo] : [])).filter((pseudo) => suivies.has(`createur:${pseudo}`) || masquees.has(`createur:${pseudo}`)),
        );
        return suggererCreateurs({ publications, lieux, ville, exclus }).map(({ pseudo, raison }) => ({
          cle: `createur:${pseudo}`,
          type: "createur" as const,
          emoji: "🎬",
          nom: `@${pseudo}`,
          raison,
          ouvrir: { pathname: "/createur/[pseudo]" as const, params: { pseudo } },
        }));
      },
      lieu: () => {
        const exclus = new Set(lieux.filter((l) => suivies.has(`lieu:${l.id}`) || masquees.has(`lieu:${l.id}`)).map((l) => l.id));
        return suggererLieux({ lieux, depart, exclus, max }).map(({ lieu, raison }) => ({
          cle: `lieu:${lieu.id}`,
          type: "lieu" as const,
          emoji: lieu.emoji,
          nom: lieu.nom,
          raison,
          degrade: lieu.couleurs,
          ouvrir: { pathname: "/lieu/[id]" as const, params: { id: String(lieu.id) } },
        }));
      },
    };

    const demandes = cleTypes.split(",").filter((t): t is TypeSuggestion => t === "personne" || t === "createur" || t === "lieu");
    return [...new Set(demandes)].flatMap((type) => listes[type]()).slice(0, max);
  }, [pret, suivis.pret, cleTypes, max, age, ville, depart, clesSuivies, estMasquee, potes, bloques, trouverPote, estSignale, moiMineur, relationAvec, suggestionsMasquees]);
}
