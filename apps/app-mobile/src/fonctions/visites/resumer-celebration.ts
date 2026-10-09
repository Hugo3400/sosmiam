import { LIBELLES_MODE_VALIDATION } from "@sos-miam/commun/contenus/modes-validation";
import type { PalierAmbassadeur } from "@sos-miam/commun/types/ambassadeur";
import type { ResultatValidation } from "@sos-miam/commun/types/visite";
import { retirerEmoji } from "~/fonctions/texte/retirer-emoji";
import { decrireOuvertureAvis } from "~/fonctions/visites/decrire-ouverture-avis";
import { decrireTamponVisite } from "~/fonctions/visites/decrire-tampon-visite";
import { decrireReglement } from "@sos-miam/commun/fonctions/visites/decrire-reglement";

/** Une visite offerte : pourquoi ni points ni tampon, et ce qui reste (l'avis, marqué « Repas offert ») */
export const OFFERT_EXPLIQUE = "Offerte par le lieu : pas de points ni de tampon cette fois, pour que les avis restent honnêtes. Ton avis compte quand même, marqué « Repas offert ».";

/**
 * La célébration d'une visite validée en une seule phrase, lue une fois par VoiceOver ou TalkBack : le lieu, les points
 * (et pourquoi +25 pendant un SOS), le tampon, le palier franchi (`palier`, null sinon), l'ouverture de l'avis. Sans emoji.
 */
export function resumerCelebration(r: ResultatValidation, palier: PalierAmbassadeur | null, maintenant: Date = new Date()): string {
  const { visite } = r;
  const tampon = decrireTamponVisite(r);
  const morceaux: string[] = [];

  if (r.dejaValidee) {
    morceaux.push(`C'est déjà validé, tu as tout bon ! ${visite.lieu.nom} : cette visite compte déjà.`);
  } else {
    const reglement = decrireReglement(visite.reglement, "client");
    morceaux.push(`Visite validée ! ${visite.lieu.nom}. ${LIBELLES_MODE_VALIDATION[visite.mode]}. ${[reglement.titre, ...reglement.etiquettes].join(", ")}.`);
    if (reglement.offert) morceaux.push(OFFERT_EXPLIQUE);
    if (visite.points > 0) {
      morceaux.push(visite.pendantSos ? `+${visite.points} points : ta visite tombe pile pendant leur SOS.` : `+${visite.points} points.`);
    }
    if (tampon) morceaux.push(tampon.pleine ? tampon.texte : `Tampon posé : ${tampon.tampons} sur ${tampon.sur}. ${tampon.texte}`);
    if (palier) morceaux.push(`Tu passes ${palier.nom} !`);
  }

  const avis = decrireOuvertureAvis(visite.avis, maintenant);
  if (avis) morceaux.push(avis);
  if (visite.demo) morceaux.push("Visite de démo : elle reste sur ce téléphone.");
  return retirerEmoji(morceaux.join(" "));
}
