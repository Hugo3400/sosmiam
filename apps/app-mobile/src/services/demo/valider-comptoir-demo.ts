// Le scan du QR du comptoir, côté faux serveur (§3.5 du plan) : pépin, lecture du QR, signature et fenêtre de 30 s,
// présentation encore allumée, droits du compte, position, puis une seule visite par (compte, présentation).
import type { ReponseApi } from "@sos-miam/commun/client-api/reponse-api";
import { lireCodeScanne } from "@sos-miam/commun/fonctions/qr/lire-code-scanne";
import { verifierJetonComptoir } from "@sos-miam/commun/fonctions/qr/verifier-jeton-comptoir";
import type { LecturePosition } from "@sos-miam/commun/types/position";
import type { ResultatValidation } from "@sos-miam/commun/types/visite";

import { lieuxExemples } from "~/contenus/lieux-exemples";
import { validationLieuxExemples } from "~/contenus/validation-lieux-exemples";
import { signerDemo } from "~/fonctions/demo/signer-demo";

import { construireResultatValidationDemo } from "./construire-resultat-validation-demo";
import { creerVisiteValideeDemo } from "./creer-visite-validee-demo";
import { lireDelaiAvisDemo } from "./lire-delai-avis-demo";
import { consommerPepin } from "./reglages-demo-vivants";
import { traduirePepinDemo } from "./traduire-pepin-demo";
import type { ContexteDemo } from "./types-demo";
import { verifierDroitsDemo } from "./verifier-droits-demo";
import { verifierPositionDemo } from "./verifier-position-demo";

type Reponse = ReponseApi<ResultatValidation>;

/** QR de vitrine : « Voir la fiche » (jamais le nom d'un bar pour un 15-17 ans) */
function repondreVitrine(codePublic: string, majeur: boolean): Reponse {
  const validation = Object.values(validationLieuxExemples).find((v) => v.codePublic === codePublic);
  const lieu = validation ? lieuxExemples.find((l) => l.id === validation.lieuId) : undefined;
  if (!lieu) return { ok: false, erreur: "introuvable" };
  if (lieu.type === "bar" && !majeur) return { ok: false, erreur: "mineur-bar" };
  return { ok: false, erreur: "qr-vitrine", details: { lieuId: lieu.id, lieu: lieu.nom } };
}

/** Valide une visite à partir du texte d'un QR scanné et de la lecture de position (démo). */
export async function validerComptoirDemo(ctx: ContexteDemo, texte: string, position: LecturePosition): Promise<Reponse> {
  const client = ctx.lireClient();
  if (!client) return { ok: false, erreur: "connexion-requise" };
  const echecReseau = traduirePepinDemo(consommerPepin(["hors-ligne", "qr-expire"]), "");
  if (echecReseau) return echecReseau;

  const code = lireCodeScanne(texte);
  if (code.type === "autre") return { ok: false, erreur: "qr-illisible" };
  if (code.type === "lieu") return repondreVitrine(code.codePublic, client.majeur);
  const { jeton } = code;
  // La démo n'a pas le secret de l'API : un vrai QR (version 1) ne peut pas y être vérifié
  if (jeton.version !== "d") return { ok: false, erreur: "qr-invalide" };
  const verification = await verifierJetonComptoir(jeton, { maintenantMs: ctx.maintenant(), calculerMac: signerDemo });
  if (!verification.ok) return { ok: false, erreur: verification.erreur };
  const lieu = lieuxExemples.find((l) => l.id === jeton.lieuId);
  if (!lieu) return { ok: false, erreur: "qr-invalide" };

  const pepinPosition = consommerPepin(["hors-zone", "position-imprecise"]);
  const delaiAvisMs = lireDelaiAvisDemo(ctx.lireReglages());
  return ctx.magasin.modifier((m, maintenantMs): Reponse => {
    const presentation = m.presentations.find((p) => p.id === jeton.presentationId);
    if (!presentation || presentation.lieuId !== jeton.lieuId || presentation.cachee || Date.parse(presentation.expireLe) <= maintenantMs) {
      return { ok: false, erreur: "qr-expire" };
    }
    if (presentation.restantes <= 0) return { ok: false, erreur: "qr-epuise" };
    const refus = verifierDroitsDemo(lieu, client, maintenantMs) ?? traduirePepinDemo(pepinPosition, lieu.nom) ?? verifierPositionDemo(position, lieu);
    if (refus) return refus;

    const deja = m.visites.find((v) => v.client === "moi" && v.presentationId === presentation.id);
    if (deja) {
      const resultat = construireResultatValidationDemo(m, deja, client, { recompenseGagnee: false, dejaValidee: true });
      return resultat ? { ok: true, ...resultat } : { ok: false, erreur: "introuvable" };
    }
    presentation.restantes -= 1;
    const { visite, recompenseGagnee } = creerVisiteValideeDemo(m, {
      lieuId: lieu.id,
      client,
      mode: "comptoir",
      presentationId: presentation.id,
      reservationId: null,
      resultatPosition: "dans-rayon",
      maintenantMs,
      delaiAvisMs,
      reglement: presentation.reglement,
    });
    const resultat = construireResultatValidationDemo(m, visite, client, { recompenseGagnee, dejaValidee: false });
    return resultat ? { ok: true, ...resultat } : { ok: false, erreur: "introuvable" };
  });
}
