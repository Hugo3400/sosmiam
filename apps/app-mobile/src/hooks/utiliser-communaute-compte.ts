import { useMemo } from "react";

import { calculerClassement } from "@sos-miam/commun/fonctions/potes/calculer-classement";
import { ID_MOI } from "@sos-miam/commun/regles/potes";
import type { Pote } from "@sos-miam/commun/types/potes";
import { utiliserBandeCompte } from "~/hooks/utiliser-bande-compte";
import type { EtatCommunaute } from "~/hooks/utiliser-communaute";

/**
 * La communauté d'un compte connecté : la bande vient du serveur (toi, tes potes, les demandes, les blocages, « Quoi de
 * neuf », le classement, ce que tu as masqué), le reste vient encore du téléphone (sorties, listes, lieux envoyés,
 * commentaires : lots A3 et A6). Ton identifiant est l'identifiant public de ton profil social (« » tant qu'il n'existe pas).
 * Les données du téléphone te désignent toujours par « moi » : trouverPote le reconnaît encore.
 */
export function utiliserCommunauteCompte(actif: boolean, locale: EtatCommunaute): EtatCommunaute {
  const bande = utiliserBandeCompte(actif);

  return useMemo((): EtatCommunaute => {
    const personne = bande.moiSocial?.personne;
    const moi: Pote = {
      ...locale.moi,
      id: personne?.id ?? "",
      pseudo: personne?.pseudo ?? locale.moi.pseudo,
      prenom: personne?.prenom ?? locale.moi.prenom,
      ...(bande.maPlace ?? {}),
    };
    const potes = bande.potes;
    const trouverPote = (id: string) => (id === moi.id || id === ID_MOI ? moi : (bande.trouverPote(id) ?? locale.trouverPote(id)));
    return {
      ...locale,
      source: "compte",
      pret: locale.pret && bande.pret,
      moi,
      potes,
      trouverPote,
      rejoindreParInvitation: bande.rejoindre,
      demanderAjout: bande.demander,
      demandesRecues: bande.demandesRecues,
      demandesEnvoyees: bande.demandesEnvoyees,
      accepterDemandeBande: bande.accepter,
      retirerDemandeBande: bande.retirerDemande,
      ouvrirProfilSocial: bande.ouvrirProfil,
      pseudoRequis: bande.pseudoRequis,
      noterPersonne: bande.noterPersonne,
      relireBande: bande.relire,
      retirerPote: bande.retirer,
      // Plus de notion « ajouté en vrai » : le serveur a vérifié chaque arrivée dans la bande (lien, QR code ou demande acceptée)
      moyenAjout: (id) => (potes.some((p) => p.id === id) ? "lien" : undefined),
      bloques: bande.bloques,
      bloquer: bande.bloquer,
      debloquer: bande.debloquer,
      activites: bande.activites,
      // Toi compris, avec tes points du mois d'après le serveur
      classement: calculerClassement([...potes, moi], moi.id),
      masquer: bande.masquer,
      estMasque: bande.estMasque,
      demasquer: bande.demasquer,
    };
  }, [locale, bande]);
}
