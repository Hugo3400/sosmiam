import { AvatarMiami } from "~/composants/apercus/AvatarMiami";
import { EnTeteEcran } from "~/composants/apercus/EnTeteEcran";
import { EtiquetteEcran } from "~/composants/apercus/EtiquetteEcran";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

// Idées inventées, proposées par des pseudos inventés
const IDEES: { titre: string; statut: string; votes: number; vote?: boolean; reponse?: string }[] = [
  {
    titre: "Un filtre « fin de mois » pour manger malin",
    statut: "À l'étude",
    votes: 214,
    vote: true,
    reponse: "On adore. On cherche comment l'afficher sans transformer l'app en comparateur de prix.",
  },
  { titre: "Voir les lieux encore ouverts après minuit", statut: "Proposée", votes: 167 },
];

/** Écran de la boîte à idées : idée du mois, votes « Miam ! », réponse de la Brigade et anti-doublons. */
export function EcranBoiteAIdees() {
  return (
    <>
      <EnTeteEcran titre="Boîte à idées" surTitre="Communauté" retour />
      <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-hidden px-4">
        <div className="flex shrink-0 flex-col gap-1 rounded-[18px] bg-encre p-3 text-creme">
          <span className="text-[10px] font-bold tracking-[.08em] text-jaune uppercase">⭐ Idée du mois</span>
          <span className="font-titre text-[15px] leading-tight font-extrabold">Trouver un Miami pour partager un repas le midi</span>
          <span className="text-[10.5px] text-[#BDB3A0]">{lierPonctuation("Bien vu @nina.miam !")}</span>
        </div>
        <span className="flex shrink-0 gap-1.5 overflow-hidden">
          <EtiquetteEcran variante="sombre">Les plus miam</EtiquetteEcran>
          <EtiquetteEcran>Nouvelles</EtiquetteEcran>
          <EtiquetteEcran>{lierPonctuation("C'est fait !")}</EtiquetteEcran>
        </span>
        {IDEES.map((idee) => (
          <div key={idee.titre} className="flex shrink-0 flex-col gap-2 rounded-[18px] border border-ligne bg-white p-3">
            <span className="flex items-start gap-2.5">
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-[12.5px] font-bold">{lierPonctuation(idee.titre)}</span>
                <span className="text-[10.5px] text-gris">{idee.statut}</span>
              </span>
              <span className={`flex shrink-0 flex-col items-center rounded-xl px-2 py-1 text-[11px] leading-tight font-bold ${idee.vote ? "bg-jaune" : "border border-ligne bg-creme"}`}>
                {lierPonctuation("Miam !")}
                <span>{idee.votes}</span>
              </span>
            </span>
            {idee.reponse && (
              <span className="flex gap-2 rounded-[12px] bg-creme p-2">
                <AvatarMiami nom="Brigade" fond="#FFD60A" taille={22} className="border-encre" />
                <span className="text-[10.5px]">
                  <b>La Brigade</b> · réponse officielle
                  <br />
                  {lierPonctuation(idee.reponse)}
                </span>
              </span>
            )}
          </div>
        ))}
      </div>
      <div className="shrink-0 rounded-t-[24px] border-t-2 border-encre bg-white px-4 pt-3 pb-5 shadow-[0_-6px_0_var(--color-jaune)]">
        <span className="block text-[10px] font-bold tracking-[.08em] text-gris uppercase">Ton idée</span>
        <span className="block text-[12.5px] font-bold">Un bouton petit budget</span>
        <span className="mt-1 block text-[11px]">
          {lierPonctuation("Ça ressemble à « Un filtre fin de mois » (214 votes). Vote plutôt pour celle-ci : ta voix comptera plus !")}
        </span>
        <span className="mt-2 flex gap-1.5">
          <span className="flex-1 rounded-xl bg-encre py-1.5 text-center text-[11.5px] font-bold text-creme">Voter pour celle-ci</span>
          <span className="rounded-xl border border-encre px-2.5 py-1.5 text-[11.5px] font-semibold">{lierPonctuation("Non, c'est différent")}</span>
        </span>
      </div>
    </>
  );
}
