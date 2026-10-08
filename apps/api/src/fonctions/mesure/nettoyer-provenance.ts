/**
 * D'où vient une visite, en un mot : la valeur de « ?ref= » ou « ?utm_source= » si l'adresse en a une
 * (liens de nos bios TikTok et Instagram), sinon le nom du site d'où l'on arrive, sans « www. ».
 * Jamais l'adresse complète de la page d'origine. « Accès direct » quand on ne sait pas.
 */
export function nettoyerProvenance(adressePage: string, referent: string | null, domaineSite: string): string {
  try {
    const parametres = new URL(adressePage, `https://${domaineSite}`).searchParams;
    const marque = (parametres.get("ref") ?? parametres.get("utm_source") ?? "").toLowerCase().replace(/[^a-z0-9.-]/g, "");
    if (marque) return marque.slice(0, 40);
  } catch {
    // Adresse illisible : on regarde le référent
  }
  if (!referent) return "Accès direct";
  try {
    const hote = new URL(referent).hostname.toLowerCase().replace(/^(www|m|l|lm|mobile)\./, "");
    if (!hote || hote === domaineSite || hote.endsWith(`.${domaineSite}`)) return "Accès direct";
    return hote.slice(0, 80);
  } catch {
    // Applications Android (« android-app://com.google.android.gm ») et référents illisibles
    const application = /^android-app:\/\/([a-z0-9._-]+)/i.exec(referent);
    return application?.[1] ? application[1].toLowerCase().slice(0, 80) : "Accès direct";
  }
}
