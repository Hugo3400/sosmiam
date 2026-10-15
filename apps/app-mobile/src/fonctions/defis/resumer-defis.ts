import type { DefiAffiche } from "~/contenus/type-defi-affiche";
import { trouverDefiLePlusProche } from "~/fonctions/defis/trouver-defi-le-plus-proche";

export type ResumeDefis = {
  compte: string;
  accroche: string;
};

const estEnCours = (defi: DefiAffiche) => defi.etat === "en-cours" && defi.attente === null;

function encourager(defi: DefiAffiche): string {
  const reste = defi.objectif - defi.fait;
  const nom = `${defi.emoji} ${defi.titre}`;
  if (defi.fait === 0) return `Premier pas vers ${nom} : à toi de jouer !`;
  if (reste === 1) return `Encore 1 et ${nom}, c'est dans la poche !`;
  return `Plus que ${reste} pour ${nom} : ça chauffe en cuisine !`;
}

function ecrireAccroche(defis: DefiAffiche[]): string {
  const proche = trouverDefiLePlusProche(defis);
  if (proche) return encourager(proche);
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
