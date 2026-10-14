import { useMemo } from "react";

import { calculerAge } from "@sos-miam/commun/regles/calculer-age";
import { bandesExemples } from "~/contenus/suivis-exemples";
import type { Suggestion, TypeSuggestion } from "~/contenus/type-suggestion";
import { filtrerLieuxSelonAge } from "~/fonctions/lieux/filtrer-lieux-selon-age";
import { suggererCreateurs } from "~/fonctions/suivi/suggerer-createurs";
import { suggererLieux } from "~/fonctions/suivi/suggerer-lieux";
import { suggererPersonnes } from "~/fonctions/suivi/suggerer-personnes";
import { utiliserActivite } from "~/hooks/utiliser-activite";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import { utiliserLieux } from "~/hooks/utiliser-lieux";
import { utiliserMonId } from "~/hooks/utiliser-mon-id";
import { utiliserPointDeDepart } from "~/hooks/utiliser-point-de-depart";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import { utiliserPublications } from "~/hooks/utiliser-publications";
import { RAISONS_SUGGESTION, utiliserSuggestionsPersonnesCompte } from "~/hooks/utiliser-suggestions-personnes-compte";
import { utiliserSuivisPersonnes } from "~/hooks/utiliser-suivis-personnes";

/**
 * Suggestions « Tu pourrais suivre », dans l'ordre de `types` (personnes : celles qui te suivent sans que tu les suives, potes de
 * potes puis ta bande ; créateurs : de ta ville puis populaires ; lieux : les plus proches), coupées à `max`. Jamais : toi, une personne bloquée ou signalée
 * (ni rien que la règle peutSuivre refuse), ce que tu suis ou as déjà demandé, une suggestion masquée (✕), une publication
 * masquée, un bar en visite sans compte (âge inconnu, filtrerLieuxSelonAge). Vide tant que l'activité et les suivis ne sont pas relus.
 * Visite sans compte : des créateurs (et des lieux si ta ville est connue), aucune personne. Compte connecté : les personnes
 * viennent du serveur (« Te suit », « Ta bande », « Dans la bande de tes potes »), revérifiées ici de la même façon.
 */
export function utiliserSuggestionsSuivi(types: readonly TypeSuggestion[], max = 10): Suggestion[] {
  const { profil, invite } = utiliserProfil();
  const activite = utiliserActivite();
  const communaute = utiliserCommunaute();
  const monId = utiliserMonId();
  const suivis = utiliserSuivisPersonnes();
  const depart = utiliserPointDeDepart();
  const { lieux: tousLesLieux } = utiliserLieux();
  const { publications: toutesLesPublications } = utiliserPublications();
  const pret = activite.chargee && (suivis.pret || invite);
  const duServeur = utiliserSuggestionsPersonnesCompte(suivis.source === "compte" && types.includes("personne"));
  // Les appelants passent souvent un tableau écrit sur place : on compare son contenu, pas son identité
  const cleTypes = types.join(",");
  const age = profil ? calculerAge(profil.dateNaissance) : null;
  const ville = profil?.ville ?? null;

  const { suivis: clesSuivies, estMasquee } = activite;
  const { potes, bloques, trouverPote, estSignale } = communaute;
  const { relationAvec, suggestionsMasquees, abonnes } = suivis;

  return useMemo(() => {
    if (!pret) return [];
    const masquees = new Set(suggestionsMasquees);
    const suivies = new Set(clesSuivies);
    const lieux = filtrerLieuxSelonAge(tousLesLieux, age);
    const publications = toutesLesPublications.filter((p) => !estMasquee(p.id) && lieux.some((l) => l.id === p.lieuId));

    const listes: Record<TypeSuggestion, () => Suggestion[]> = {
      personne: () => {
        if (!suivis.pret) return [];
        const estCandidat = (id: string) => {
          if (id === monId || !trouverPote(id) || bloques.some((b) => b.id === id) || estSignale(id) || masquees.has(`personne:${id}`)) return false;
          const relation = relationAvec(id);
          return relation !== null && relation.jeSuis === "aucun" && relation.verdict.permis;
        };
        if (suivis.source === "compte") {
          return (duServeur ?? []).flatMap(({ personne, raison }) => {
            const pote = trouverPote(personne.id);
            if (!pote || !estCandidat(personne.id)) return [];
            const ouvrir = { pathname: "/potes/profil/[id]" as const, params: { id: personne.id } };
            return [{ cle: `personne:${personne.id}`, type: "personne" as const, emoji: pote.avatar, nom: pote.prenom, raison: RAISONS_SUGGESTION[raison], ouvrir }];
          });
        }
        const prenomDe = (id: string) => trouverPote(id)?.prenom ?? id;
        // Celles qui te suivent déjà, en tête et avec « Te suit » : la carte n'a que le nom et la raison pour le dire
        // (son bouton compact affiche « Suivre », pas « Suivre en retour »)
        const teSuivent = abonnes.map((a) => a.pote.id).filter(estCandidat).map((id) => ({ id, raison: "Te suit" }));
        const potesDePotes = suggererPersonnes({ monId, bande: potes.map((p) => p.id), bandes: bandesExemples, estCandidat, prenomDe }).filter((s) => !teSuivent.some((t) => t.id === s.id));
        return [...teSuivent, ...potesDePotes].flatMap(({ id, raison }) => {
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
  }, [pret, suivis.pret, suivis.source, duServeur, cleTypes, max, tousLesLieux, toutesLesPublications, age, ville, depart, clesSuivies, estMasquee, potes, bloques, trouverPote, estSignale, relationAvec, suggestionsMasquees, abonnes, monId]);
}
