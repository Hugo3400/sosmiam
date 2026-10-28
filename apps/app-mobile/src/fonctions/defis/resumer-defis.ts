import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import type { Langue } from "@sos-miam/commun/regles/langues";
import { TEXTES_RESUME_DEFIS_PAR_LANGUE } from "~/contenus/textes-profil-defis";
import type { DefiAffiche } from "~/contenus/type-defi-affiche";
import { trouverDefiLePlusProche } from "~/fonctions/defis/trouver-defi-le-plus-proche";

export type ResumeDefis = {
  compte: string;
  accroche: string;
};

const estEnCours = (defi: DefiAffiche) => defi.etat === "en-cours" && defi.attente === null;

function encourager(defi: DefiAffiche, langue: Langue): string {
  const T = choisirTextes(TEXTES_RESUME_DEFIS_PAR_LANGUE, langue);
  const reste = defi.objectif - defi.fait;
  const nom = `${defi.emoji} ${defi.titre}`;
  if (defi.fait === 0) return T.premierPas(nom);
  if (reste === 1) return T.encoreUn(nom);
  return T.plusQue(reste, nom);
}

function ecrireAccroche(defis: DefiAffiche[], langue: Langue): string {
  const T = choisirTextes(TEXTES_RESUME_DEFIS_PAR_LANGUE, langue);
  const proche = trouverDefiLePlusProche(defis);
  if (proche) return encourager(proche, langue);
  if (defis.every((d) => d.etat === "reussi")) return T.toutReussi;
  return T.caMijote;
}

export function resumerDefis(defis: DefiAffiche[], langue: Langue): ResumeDefis {
  const T = choisirTextes(TEXTES_RESUME_DEFIS_PAR_LANGUE, langue);
  const enCours = defis.filter(estEnCours).length;
  const reussis = defis.filter((d) => d.etat === "reussi").length;
  const aVenir = defis.length - enCours - reussis;
  const morceaux = [
    enCours > 0 ? T.enCours(enCours) : null,
    aVenir > 0 ? T.aVenir(aVenir) : null,
    reussis > 0 ? T.reussis(reussis) : null,
  ].filter(Boolean);
  return { compte: morceaux.join(" · "), accroche: ecrireAccroche(defis, langue) };
}
