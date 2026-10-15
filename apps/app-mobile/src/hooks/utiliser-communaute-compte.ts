import { useMemo } from "react";

import { calculerClassement } from "@sos-miam/commun/fonctions/potes/calculer-classement";
import { ID_MOI } from "@sos-miam/commun/regles/potes";
import type { Pote } from "@sos-miam/commun/types/potes";
import { utiliserBandeCompte } from "~/hooks/utiliser-bande-compte";
import type { EtatCommunaute } from "~/hooks/utiliser-communaute";
import { utiliserLieuxEnvoyesCompte } from "~/hooks/utiliser-lieux-envoyes-compte";
import { utiliserListesCompte } from "~/hooks/utiliser-listes-compte";
import { utiliserSignalementsCompte } from "~/hooks/utiliser-signalements-compte";
import { utiliserSortiesCompte } from "~/hooks/utiliser-sorties-compte";

/**
 * La communauté d'un compte connecté : la bande vient du serveur (toi, tes potes, les demandes, les blocages, « Quoi de
 * neuf », le classement, ce que tu as masqué), comme les sorties, les listes, les lieux envoyés et tes signalements ; les
 * commentaires ont leur propre hook (utiliserCommentairesPublication). Ton identifiant est l'identifiant public de ton profil social (« » tant qu'il
 * n'existe pas). Les données du téléphone te désignent toujours par « moi » : trouverPote le reconnaît encore.
 */
export function utiliserCommunauteCompte(actif: boolean, locale: EtatCommunaute): EtatCommunaute & { bloquesLus: boolean } {
  const bande = utiliserBandeCompte(actif);
  const monId = bande.moiSocial?.personne.id ?? "";
  const { noterPersonne, estMasque, masquer, demasquer, bloques } = bande;
  const sorties = utiliserSortiesCompte(actif, { monId, noterPersonne, estMasque });
  const listes = utiliserListesCompte(actif, { monId, noterPersonne });
  const lieuxEnvoyes = utiliserLieuxEnvoyesCompte(actif, { monId, noterPersonne, bloques, estMasque, masquer, demasquer });
  const signalements = utiliserSignalementsCompte(actif);

  return useMemo((): EtatCommunaute & { bloquesLus: boolean } => {
    const personne = bande.moiSocial?.personne;
    const moi: Pote = {
      ...locale.moi,
      id: personne?.id ?? "",
      pseudo: personne?.pseudo ?? locale.moi.pseudo,
      prenom: personne?.prenom ?? locale.moi.prenom,
      ...(bande.maPlace ?? {}),
    };
    const potes = bande.potes;
    // « » : un compte supprimé (ou ton profil social pas encore créé) n'est jamais toi
    const trouverPote = (id: string) => (id === "" ? null : id === moi.id || id === ID_MOI ? moi : (bande.trouverPote(id) ?? locale.trouverPote(id)));
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
      bloquesLus: bande.bloquesLus,
      bloquer: bande.bloquer,
      debloquer: bande.debloquer,
      activites: bande.activites,
      // Toi compris, avec tes points du mois d'après le serveur
      classement: calculerClassement([...potes, moi], moi.id),
      masquer: bande.masquer,
      estMasque: bande.estMasque,
      demasquer: bande.demasquer,
      ...sorties,
      // La discussion d'une sortie passe par la messagerie (utiliserDiscussionSortie) : rien à écrire ici
      envoyerMessage: () => "vide",
      ...listes,
      ...lieuxEnvoyes,
      // Ce que tu as signalé disparaît de ton écran (une liste, un lieu envoyé ; les messages et commentaires lisent estSignale)
      listes: listes.listes.filter((l) => !signalements.estSignale(l.id)),
      recommandationsRecues: lieuxEnvoyes.recommandationsRecues.filter((r) => !signalements.estSignale(r.id)),
      signaler: signalements.signaler,
      estSignale: signalements.estSignale,
    };
  }, [locale, bande, sorties, listes, lieuxEnvoyes, signalements]);
}
