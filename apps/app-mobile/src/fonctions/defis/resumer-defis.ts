import type { DefiAffiche } from "~/contenus/type-defi-affiche";
import { trouverDefiLePlusProche } from "~/fonctions/defis/trouver-defi-le-plus-proche";

export type ResumeDefis = {
  compte: string;
  accroche: string;
};

const estEnCours = (defi: DefiAffiche) => defi.etat === "en-cours" && defi.attente === null;

function ecrireAccroche(defis: DefiAffiche[]): string {
  const proche = trouverDefiLePlusProche(defis);
  if (proche) {
    const reste = proche.objectif - proche.fait;
    return `Encore ${reste} et ${proche.emoji} ${proche.titre}, c'est dans la poche !`;
  }
  if (defis.every((d) => d.etat === "reussi")) return "Tout est réussi : la Brigade te tire sa toque ! 🎉";
  return "Ça mijote en cuisine : échauffe tes papilles pour les prochains !";
}

export function resumerDefis(defis: DefiAffiche[]): ResumeDefis {
  const enCours = defis.filter(estEnCours).length;
  const reussis = defis.filter((d) => d.etat === "reussi").length;
  const aVenir = defis.length - enCours - reussis;
  const morceaux = [
    enCours > 0 ? `${enCours} en cours` : null,
    aVenir > 0 ? `${aVenir} à venir` : null,
    reussis > 0 ? `${reussis} réussi${reussis > 1 ? "s" : ""}` : null,
  ].filter(Boolean);
  return { compte: morceaux.join(" · "), accroche: ecrireAccroche(defis) };
}
