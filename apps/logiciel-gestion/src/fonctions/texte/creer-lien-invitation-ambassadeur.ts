/**
 * L'espace ambassadeur et ses textes légaux sont-ils en ligne ? Tant que non, les invitations restent désactivées
 * (le texte annonce que l'espace est ouvert : ce serait une fausse promesse). À passer à true au lancement.
 */
export const ESPACE_AMBASSADEUR_OUVERT = false;

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
    "On valide chaque inscription à la main : on te répond vite. Une fois ton compte validé, tu pourras aussi candidater, depuis ton espace, pour être l'un des 10 ambassadeurs fondateurs.",
    "",
    "À très vite,",
    "Hugo, pour SOS Miam",
  ].join("\n");
  const destinataires = adresses.length === 1 ? encodeURIComponent(adresses[0]!) : "";
  const copieCachee = adresses.length > 1 ? `&bcc=${encodeURIComponent(adresses.join(","))}` : "";
  return `mailto:${destinataires}?subject=${encodeURIComponent(objet)}&body=${encodeURIComponent(corps)}${copieCachee}`;
}
