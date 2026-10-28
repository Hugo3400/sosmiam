import { TEXTE_VISITE_OFFERTE_PAR_LANGUE } from "@sos-miam/commun/contenus/libelles-reglement";
import { LIBELLES_MODE_VALIDATION_PAR_LANGUE } from "@sos-miam/commun/contenus/modes-validation";
import { NOMS_PALIERS_PAR_LANGUE } from "@sos-miam/commun/contenus/noms-paliers";
import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import type { Langue } from "@sos-miam/commun/regles/langues";
import type { PalierAmbassadeur } from "@sos-miam/commun/types/ambassadeur";
import type { ResultatValidation } from "@sos-miam/commun/types/visite";
import { MESSAGE_SANITAIRE_ALCOOL } from "@sos-miam/commun/contenus/prevention-alcool";
import { TEXTES_FIDELITE_PAR_LANGUE } from "~/contenus/textes-fidelite";
import { TEXTES_VISITE_PAR_LANGUE } from "~/contenus/textes-visite";
import { decrireReglementLangue } from "~/fonctions/langue/decrire-reglement-langue";
import { retirerEmoji } from "~/fonctions/texte/retirer-emoji";
import { decrireOuvertureAvis } from "~/fonctions/visites/decrire-ouverture-avis";
import { decrireTamponVisite } from "~/fonctions/visites/decrire-tampon-visite";
import { estRecompenseVisiteAlcool } from "~/fonctions/visites/est-recompense-visite-alcool";

/**
 * La célébration d'une visite validée en une seule phrase, lue une fois par VoiceOver ou TalkBack : le lieu, les points
 * (et pourquoi +25 pendant un SOS), le tampon, le palier franchi (`palier`, null sinon), l'ouverture de l'avis. Sans emoji.
 */
export function resumerCelebration(r: ResultatValidation, palier: PalierAmbassadeur | null, langue: Langue, maintenant: Date = new Date()): string {
  const T = choisirTextes(TEXTES_VISITE_PAR_LANGUE, langue);
  const { visite } = r;
  const tampon = decrireTamponVisite(r, langue);
  const morceaux: string[] = [];

  if (r.dejaValidee) {
    morceaux.push(T.resumeDeja(visite.lieu.nom));
  } else {
    const reglement = decrireReglementLangue(visite.reglement, "client", langue);
    const mode = choisirTextes(LIBELLES_MODE_VALIDATION_PAR_LANGUE, langue)[visite.mode];
    morceaux.push(T.resumeValidee(visite.lieu.nom, mode, [reglement.titre, ...reglement.etiquettesLues].join(", ")));
    if (reglement.offert) morceaux.push(choisirTextes(TEXTE_VISITE_OFFERTE_PAR_LANGUE, langue));
    if (visite.points > 0) {
      morceaux.push(visite.pendantSos ? T.pointsSos(visite.points) : T.resumePoints(visite.points));
    }
    if (tampon) morceaux.push(tampon.pleine ? tampon.texte : T.resumeTampon(tampon.tampons, tampon.sur, tampon.texte));
    if (tampon && estRecompenseVisiteAlcool(r)) morceaux.push(choisirTextes(TEXTES_FIDELITE_PAR_LANGUE, langue).messageSanitaireLu(MESSAGE_SANITAIRE_ALCOOL));
    if (palier) morceaux.push(T.palierTitre(choisirTextes(NOMS_PALIERS_PAR_LANGUE, langue)[palier.cle]));
  }

  const avis = decrireOuvertureAvis(visite.avis, langue, maintenant);
  if (avis) morceaux.push(avis);
  return retirerEmoji(morceaux.join(" "));
}
