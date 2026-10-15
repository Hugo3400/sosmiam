import type { BilanMenageSocial } from "../../services/menage-social.ts";

/**
 * Les lignes du journal du logiciel pour le ménage social de la nuit : [nombre, ce qui est parti], seulement celles qui ne
 * valent pas zéro (jamais un contenu, seulement des nombres). Pendant un changement de clé, la ligne du rechiffrement
 * paraît chaque nuit, même à zéro : c'est elle qui dit la fin pour la partie sociale, quand restants = illisibles deux nuits
 * de suite, sans ligne « étape(s) ratée(s) » qui cite « rechiffrement » ces nuits-là (règle de fin de
 * docs/procedure-changement-cle.md, comme rechiffrerSocial). Un seul « 0 restant(s) » ne suffit pas : la nuit d'après,
 * l'étape 8 retire les anciens fichiers rechiffrés, et le rechiffrement reprend un fichier qu'un signalement aurait cité
 * entre-temps sous son ancien nom. Une nuit où le disque est presque plein, une ligne de plus dit que le rechiffrement des
 * fichiers est en pause, et combien attendent de la place : sans elle, les restants ne baissent pas sans raison visible.
 */
export function decrireBilanMenageSocial(bilan: BilanMenageSocial): [number, string][] {
  const lignes: [number, string][] = [
    [bilan.medias, "Médias du chat effacés (90 jours)"],
    [bilan.conversations, "Conversations effacées (1 an sans message)"],
    [bilan.sorties, "Sorties effacées avec leur discussion (1 an après leur date ou leur dernier message)"],
    [bilan.conversationsVides, "Conversations sans membre effacées"],
    [bilan.demandesBande, "Demandes de bande expirées (30 jours)"],
    [bilan.demandesSuivi, "Demandes de suivi expirées (30 jours)"],
    [bilan.invitationsSorties, "Invitations à des sorties passées effacées"],
    [bilan.invitationsGroupes, "Invitations à des groupes expirées (30 jours)"],
    [bilan.invitationsCoAuteurs, "Invitations à remplir une liste expirées (30 jours)"],
    [bilan.departsGroupes, "Départs de groupes oubliés (30 jours)"],
    [bilan.clesIdempotence, "Clés d'envoi en double effacées (24 h)"],
    [bilan.cloche, "Notifications de la cloche effacées (90 jours ou au-delà de 200)"],
    [bilan.masques, "Éléments masqués oubliés (13 mois)"],
    [bilan.contenusRetires, "Contenus retirés par la modération effacés (plus d'un an)"],
    [bilan.commentairesSupprimes, "Commentaires supprimés effacés pour de bon"],
    [bilan.fichiersOrphelins, "Fichiers du chat orphelins effacés (plus de 24 h)"],
  ];
  const visibles = lignes.filter(([nombre]) => nombre > 0);
  const r = bilan.rechiffrement;
  if (r) visibles.push([r.rechiffres, `Chiffrés sociaux réécrits avec la nouvelle clé (${r.illisibles} illisible(s), ${r.restants} restant(s))`]);
  if (r && r.enAttenteDePlace > 0) {
    visibles.push([r.enAttenteDePlace, `Rechiffrement des fichiers du chat en pause : le disque est presque plein (${r.enAttenteDePlace} fichier(s) attendent de la place, comptés dans les restants)`]);
  }
  if (bilan.etapesRatees.length > 0) visibles.push([bilan.etapesRatees.length, `Ménage social : étape(s) ratée(s) (${bilan.etapesRatees.join(", ")}), voir le journal du serveur`]);
  return visibles;
}
