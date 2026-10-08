/** Adresse de l'espace ambassadeur, où l'on s'inscrit */
const ESPACE_AMBASSADEUR = "https://ambassadeur.sosmiam.fr";

/**
 * Lien « mailto: » tout prêt pour inviter un candidat ambassadeur (inscrit à la newsletter, case « ambassadeur fondateur »
 * cochée) à créer son compte. Plusieurs adresses : elles partent en copie cachée, personne ne voit les autres.
 */
export function creerLienInvitationAmbassadeur(adresses: string[], ville: string | null = null): string {
  const objet = "Deviens ambassadeur SOS Miam 🛟";
  const corps = [
    "Salut !",
    "",
    `Tu as coché « ambassadeur fondateur » en t'inscrivant à SOS Miam${ville ? ` (${ville})` : ""} : merci, ça nous touche !`,
    "",
    "L'espace ambassadeur est ouvert. Tu peux y créer ton compte (à partir de 18 ans) pour faire découvrir tes pépites, gagner des points et des badges, et donner un coup de main aux lieux qui ont besoin de monde :",
    ESPACE_AMBASSADEUR,
    "",
    "On valide chaque inscription à la main : on te répond vite.",
    "",
    "À très vite,",
    "Hugo, pour SOS Miam",
  ].join("\n");
  const destinataires = adresses.length === 1 ? encodeURIComponent(adresses[0]!) : "";
  const copieCachee = adresses.length > 1 ? `&bcc=${encodeURIComponent(adresses.join(","))}` : "";
  return `mailto:${destinataires}?subject=${encodeURIComponent(objet)}&body=${encodeURIComponent(corps)}${copieCachee}`;
}
