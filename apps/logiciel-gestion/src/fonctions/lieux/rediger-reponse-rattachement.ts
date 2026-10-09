/**
 * La réponse proposée à une demande de rattachement à un lieu (compte pro), selon la décision. Hugo la relit et la
 * change avant l'envoi ; un refus laisse des [crochets] pour dire pourquoi et ce qu'il faudrait.
 */
export function redigerReponseRattachement(decision: "valider" | "refuser" | "retirer", { prenom, lieu }: { prenom: string; lieu: string }): string {
  const fin = "À bientôt,\nHugo, pour SOS Miam";
  if (decision === "valider") {
    return `Salut ${prenom} !\n\nC'est validé : te voilà rattaché à ${lieu}, qui est maintenant « Vérifié ✓ » sur SOS Miam. Tu retrouves ta fiche dans ton espace pro : https://pro.sosmiam.fr\n\n${fin}`;
  }
  if (decision === "refuser") {
    return `Salut ${prenom} !\n\nMerci pour ta demande pour ${lieu}. On n'a pas pu confirmer que tu le gères : [dis pourquoi, et ce qu'il faudrait (numéro SIRET, mail à l'adresse du lieu…)].\n\n${fin}`;
  }
  return `Salut ${prenom} !\n\nOn a retiré ton accès à la fiche de ${lieu} sur SOS Miam : [dis pourquoi].\n\n${fin}`;
}
