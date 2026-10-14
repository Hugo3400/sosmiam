import { AvatarMiami } from "~/composants/apercus/AvatarMiami";
import { BarreOngletsApp } from "~/composants/apercus/BarreOngletsApp";
import { EnTeteEcran } from "~/composants/apercus/EnTeteEcran";
import { EtiquetteEcran } from "~/composants/apercus/EtiquetteEcran";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

// Pseudos inventés (jamais de vrais comptes)
const PRESENTS: [string, string][] = [
  ["@sam.frites", "#FFF1A8"],
  ["@nina.miam", "#F3E2FF"],
  ["@ines.gourmande", "#DDE5FF"],
  ["@yanis.bao", "#FFE1DD"],
];

/** Écran « Communauté » de l'app, partie « Les Miamis » : qui traîne en ville, une sortie, la boîte à idées. */
export function EcranCommunaute() {
  return (
    <>
      <EnTeteEcran titre="Communauté" />
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden px-4">
        <div className="grid shrink-0 grid-cols-2 gap-1 rounded-2xl border border-ligne bg-white p-1 text-center text-[13px]">
          <span className="rounded-xl py-2 font-semibold text-gris">Ma bande</span>
          <span className="rounded-xl bg-jaune py-2 font-bold">Les Miamis</span>
        </div>

        <div className="flex shrink-0 flex-col gap-2.5 rounded-[20px] bg-encre p-3.5 text-creme">
          <span className="text-[10px] font-bold tracking-[.08em] text-jaune uppercase">Ta ville · en ce moment</span>
          <span className="font-titre text-[16px] leading-tight font-extrabold">{lierPonctuation("24 Miamis traînent dans le coin. Viens dire bonjour !")}</span>
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center">
              {PRESENTS.map(([pseudo, fond], rang) => (
                <AvatarMiami key={pseudo} nom={pseudo} fond={fond} taille={28} className={`border-encre ${rang ? "-ml-2" : ""}`} />
              ))}
              <span className="ml-1.5 text-[11px] text-[#BDB3A0]">+20</span>
            </span>
            <span className="rounded-full bg-jaune px-3 py-1.5 text-[12px] font-bold text-encre">{lierPonctuation("Qui est là ?")}</span>
          </div>
          <span className="text-[10.5px] text-[#BDB3A0]">Jamais ta position, seulement ta ville.</span>
        </div>

        <div className="flex shrink-0 items-center justify-between">
          <span className="font-titre text-[15px] font-extrabold">Sorties des Miamis</span>
          <span className="rounded-full bg-encre px-2.5 py-1 text-[11px] font-bold text-creme">+ Organiser</span>
        </div>
        <div className="flex shrink-0 flex-col gap-2 rounded-[18px] border border-ligne bg-white p-3">
          <span className="flex justify-between text-[11px] text-gris">
            <span className="font-semibold text-encre">Dim. 11 h</span>
            <span>5 / 8 places</span>
          </span>
          <span className="flex flex-col">
            <span className="font-bold">Brunch des nouveaux arrivants</span>
            <span className="text-[11.5px] text-gris">Restaurant du Capitaine Bouiboui · vérifié</span>
          </span>
          <span className="flex flex-wrap gap-1">
            <EtiquetteEcran>Végétarien</EtiquetteEcran>
            <EtiquetteEcran>LGBT+ friendly</EtiquetteEcran>
          </span>
          <span className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-[11.5px]">
              <AvatarMiami nom="@lea.croque" fond="#FFE1DD" taille={22} />
              @lea.croque organise
            </span>
            <span className="rounded-xl bg-encre px-3 py-1.5 text-[12px] font-bold text-creme">Je viens</span>
          </span>
        </div>

        <span className="shrink-0 font-titre text-[15px] font-extrabold">Boîte à idées</span>
        <div className="flex shrink-0 items-center gap-2.5 rounded-[18px] border border-ligne bg-white p-2.5 pl-3">
          <span className="font-titre text-[18px] font-extrabold text-gris">1</span>
          <span className="min-w-0 flex-1 text-[12px] font-semibold">Voir les lieux encore ouverts après minuit</span>
          <span className="flex shrink-0 flex-col items-center rounded-xl bg-jaune px-2 py-1 text-[11px] font-bold leading-tight">
            {lierPonctuation("Miam !")}
            <span>167</span>
          </span>
        </div>
      </div>
      <BarreOngletsApp actif="Communauté" />
    </>
  );
}
