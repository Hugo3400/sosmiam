/**
 * L'espace ambassadeur et ses textes légaux sont-ils en ligne ? Oui depuis le 9 octobre 2026 (00 h 29) : les
 * invitations sont actives. Repasser à false si l'espace devait fermer (le texte annonce qu'il est ouvert).
 */
export const ESPACE_AMBASSADEUR_OUVERT = true;

/** Adresse de l'espace ambassadeur, où l'on s'inscrit */
const ESPACE_AMBASSADEUR = "https://ambassadeur.sosmiam.fr";

/**
 * Lien « mailto: » tout prêt pour inviter un candidat ambassadeur (inscrit à la newsletter, case « Je veux devenir
 * ambassadeur (dès 18 ans) » cochée) à créer son compte. Plusieurs adresses : elles partent en copie cachée, personne ne voit les autres.
 */
export function creerLienInvitationAmbassadeur(adresses: string[], ville: string | null = null): string {
  const objet = "Deviens ambassadeur SOS Miam 🛟";
  const corps = [
    "Salut !",
    "",
    `Tu as coché la case ambassadeur en t'inscrivant à SOS Miam${ville ? ` (${ville})` : ""} : merci, ça nous touche !`,
    "",
    "L'espace ambassadeur est ouvert. Crée ton compte (dès 18 ans) pour faire découvrir tes pépites, gagner des points et des badges, et donner un coup de main aux lieux qui ont besoin de monde :",
    ESPACE_AMBASSADEUR,
    "",
    "On valide chaque inscription à la main : on te répond vite. Une fois ton compte validé, tu pourras aussi candidater, depuis ton espace, pour être l'un des 10 ambassadeurs fondateurs, tant qu'il reste des places.",
    "",
    "À très vite,",
    "Hugo, pour SOS Miam",
  ].join("\n");
  const destinataires = adresses.length === 1 ? encodeURIComponent(adresses[0]!) : "";
  const copieCachee = adresses.length > 1 ? `&bcc=${encodeURIComponent(adresses.join(","))}` : "";
  return `mailto:${destinataires}?subject=${encodeURIComponent(objet)}&body=${encodeURIComponent(corps)}${copieCachee}`;
}
