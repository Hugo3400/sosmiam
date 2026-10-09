import { TEXTE_VISITE_OFFERTE } from "@sos-miam/commun/contenus/libelles-reglement";
import { LIBELLES_MODE_VALIDATION } from "@sos-miam/commun/contenus/modes-validation";
import { decrireReglement } from "@sos-miam/commun/fonctions/visites/decrire-reglement";
import type { PalierAmbassadeur } from "@sos-miam/commun/types/ambassadeur";
import type { ResultatValidation } from "@sos-miam/commun/types/visite";
import { MESSAGE_SANITAIRE_ALCOOL } from "@sos-miam/commun/contenus/prevention-alcool";
import { retirerEmoji } from "~/fonctions/texte/retirer-emoji";
import { decrireOuvertureAvis } from "~/fonctions/visites/decrire-ouverture-avis";
import { decrireTamponVisite } from "~/fonctions/visites/decrire-tampon-visite";
import { estRecompenseVisiteAlcool } from "~/fonctions/visites/est-recompense-visite-alcool";

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
    if (reglement.offert) morceaux.push(TEXTE_VISITE_OFFERTE);
    if (visite.points > 0) {
      morceaux.push(visite.pendantSos ? `+${visite.points} points : ta visite tombe pile pendant leur SOS.` : `+${visite.points} points.`);
    }
    if (tampon) morceaux.push(tampon.pleine ? tampon.texte : `Tampon posé : ${tampon.tampons} sur ${tampon.sur}. ${tampon.texte}`);
    if (tampon && estRecompenseVisiteAlcool(r)) morceaux.push(MESSAGE_SANITAIRE_ALCOOL);
    if (palier) morceaux.push(`Tu passes ${palier.nom} !`);
  }

  const avis = decrireOuvertureAvis(visite.avis, maintenant);
  if (avis) morceaux.push(avis);
  if (visite.demo) morceaux.push("Visite de démo : elle reste sur ce téléphone.");
  return retirerEmoji(morceaux.join(" "));
}
