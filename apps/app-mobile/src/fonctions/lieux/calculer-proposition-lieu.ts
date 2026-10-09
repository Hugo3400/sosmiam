import type { InfosPratiques } from "@sos-miam/commun/types/infos-pratiques";
import type { PropositionLieu } from "@sos-miam/commun/types/proposition-lieu";

import type { SujetProposition } from "~/contenus/sujets-proposition";
import type { BrouillonInfosPratiques } from "~/fonctions/lieux/creer-brouillon-infos-pratiques";

/** Ce que montre la fiche aujourd'hui */
export type FicheActuelle = { nom: string; adresse: string; horaires: string; texte: string; pratique: InfosPratiques | undefined };
/** Ce que la personne a tapé ou choisi */
export type BrouillonProposition = { nom: string; adresse: string; horaires: string; texte: string; pratique: BrouillonInfosPratiques };

const CASES = ["accessible", "terrasse", "wifi", "enfants", "parking"] as const;
const chiffres = (texte: string) => texte.replace(/\D/g, "");
const instagram = (texte: string) => texte.trim().replace(/^@/, "").toLowerCase();

/**
 * La proposition à envoyer : seulement les sujets cochés, et dans ces sujets seulement ce qui change vraiment par rapport
 * à la fiche (un numéro retapé avec d'autres espaces ne compte pas). Une case décochée qui était cochée part à « non ».
 * Rien n'est vérifié ici : validerPropositionLieu s'en charge (textes, téléphone, site…). Vide : rien n'a changé.
 */
export function calculerPropositionLieu(actuel: FicheActuelle, b: BrouillonProposition, sujets: readonly SujetProposition[]): PropositionLieu {
  const p: Record<string, unknown> = {};
  const a = actuel.pratique ?? {};
  const texteChange = (cle: "nom" | "adresse" | "horaires" | "texte") => {
    const propose = b[cle].trim();
    if (propose && propose !== actuel[cle].trim()) p[cle] = propose;
  };
  if (sujets.includes("horaires")) texteChange("horaires");
  if (sujets.includes("adresse")) texteChange("adresse");
  if (sujets.includes("nom")) texteChange("nom");
  if (sujets.includes("texte")) texteChange("texte");

  if (sujets.includes("contact")) {
    const { telephone, siteWeb, instagram: insta } = b.pratique;
    if (telephone.trim() && chiffres(telephone) !== chiffres(a.telephone ?? "")) p.telephone = telephone.trim();
    if (siteWeb.trim() && siteWeb.trim() !== (a.siteWeb ?? "")) p.siteWeb = siteWeb.trim();
    if (insta.trim() && instagram(insta) !== instagram(a.instagram ?? "")) p.instagram = insta.trim();
  }
  if (sujets.includes("animaux") && b.pratique.animaux && b.pratique.animaux !== a.animaux) p.animaux = b.pratique.animaux;
  if (sujets.includes("reservation") && b.pratique.reservation && b.pratique.reservation !== a.reservation) p.reservation = b.pratique.reservation;
  if (sujets.includes("equipements")) {
    for (const cle of CASES) {
      const propose = b.pratique[cle] === true;
      if (propose !== (a[cle] === true)) p[cle] = propose;
    }
  }
  if (sujets.includes("paiements")) {
    const proposes = b.pratique.paiements ?? [];
    const avant = a.paiements ?? [];
    const differents = proposes.length !== avant.length || proposes.some((m) => !avant.includes(m));
    if (proposes.length > 0 && differents) p.paiements = proposes;
  }
  return p as PropositionLieu;
}
