// « Proposer une modification » d'une fiche de lieu, pour tout compte connecté (exigerCompte) : vérifiée par
// validerPropositionLieu de packages/commun, débarrassée des champs qui ne changent rien, puis gardée avec la fiche telle
// qu'elle est (« avant »). L'équipe la décide dans le logiciel de gestion. Contrat des adresses : routes/comptes.ts.
import type { Request, Response } from "express";

import { chargerValiderPropositionLieu } from "../fonctions/commun/charger-valider-proposition-lieu.ts";
import { retirerChampsInchanges } from "../fonctions/suggestions/retirer-champs-inchanges.ts";
import { CHAMPS_PROPOSABLES, type FicheSuggerable } from "../services/suggestions-comptes-regles.ts";
import { lireCompteId, lireCorps } from "./comptes-champs.ts";
import type { ServicesComptes } from "./comptes.ts";

const estProposable = (champ: string) => (CHAMPS_PROPOSABLES as readonly string[]).includes(champ);
const estObjet = (valeur: unknown): valeur is Record<string, unknown> => typeof valeur === "object" && valeur !== null && !Array.isArray(valeur);

export function creerControleursSuggestions(services: ServicesComptes, horloge: () => number) {
  return {
    /**
     * POST /comptes/moi/suggestions : 201 { ok, id } ; 400 « proposition-invalide » {champ} ou « rien-a-changer » ; 404
     * « lieu-inconnu » (absent ou pas publié) ; 409 « trop-de-suggestions ».
     */
    async proposer(requete: Request, reponse: Response) {
      const corps = lireCorps(requete);
      const valider = await chargerValiderPropositionLieu();
      const resultat = valider({ proposition: corps.proposition, message: corps.message });
      if (!resultat.ok) return reponse.status(400).json({ ok: false, erreur: resultat.erreur, champ: resultat.champ });
      // Un champ qui n'est pas une colonne de Lieu (ou que la vérification commune ignorerait) est refusé, pas oublié
      const envoyes = estObjet(corps.proposition) ? Object.keys(corps.proposition) : [];
      if (![...envoyes, ...Object.keys(resultat.suggestion.proposition)].every(estProposable)) {
        return reponse.status(400).json({ ok: false, erreur: "proposition-invalide", champ: "autre" });
      }

      const { lieuId } = corps;
      const fiche = typeof lieuId === "number" && Number.isSafeInteger(lieuId) && lieuId > 0 ? await services.lireFichePourSuggestion(lieuId) : null;
      if (!fiche || typeof lieuId !== "number") return reponse.status(404).json({ ok: false, erreur: "lieu-inconnu" });

      const proposition = retirerChampsInchanges(resultat.suggestion.proposition as Partial<FicheSuggerable>, fiche);
      const champs = Object.keys(proposition) as (keyof FicheSuggerable)[];
      if (champs.length === 0) return reponse.status(400).json({ ok: false, erreur: "rien-a-changer" });
      const avant = Object.fromEntries(champs.map((champ) => [champ, fiche[champ] ?? null])) as Partial<FicheSuggerable>;

      const cree = await services.creerSuggestionLieu(
        lireCompteId(reponse), { lieuId, proposition, avant, message: resultat.suggestion.message }, new Date(horloge()),
      );
      if (!cree.ok) return reponse.status(409).json({ ok: false, erreur: cree.erreur });
      reponse.status(201).json({ ok: true, id: cree.id });
    },
  };
}
