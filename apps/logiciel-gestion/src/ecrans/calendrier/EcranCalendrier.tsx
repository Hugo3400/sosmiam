import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Carte } from "~/composants/interface/Carte.tsx";
import { MessageErreur } from "~/composants/interface/MessageErreur.tsx";
import { EnTeteEcran } from "~/composants/mise-en-page/EnTeteEcran.tsx";
import { EVENEMENTS } from "~/contenus/calendrier.ts";
import type { Ecran } from "~/contenus/menu.ts";
import { construireGrilleMois, jourLocal } from "~/fonctions/dates/construire-grille-mois.ts";
import { utiliserChargement } from "~/hooks/utiliser-chargement.ts";
import { lireCalendrier, type EvenementCalendrier } from "~/services/calendrier.ts";

const nomMois = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" });
const heure = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" });
const JOURS = ["lun.", "mar.", "mer.", "jeu.", "ven.", "sam.", "dim."];

/** Ce qui touche ce jour-là (un BIG SOS compte pour chaque jour de sa semaine à la une). */
const duJour = (evenements: EvenementCalendrier[], jour: string) =>
  evenements.filter((e) => {
    const debut = jourLocal(new Date(e.debut));
    const fin = e.fin ? jourLocal(new Date(new Date(e.fin).getTime() - 1)) : debut;
    return jour >= debut && jour <= fin;
  });

/** Le calendrier : publications, notifications, BIG SOS, missions, newsletters et annonces, mois par mois. */
export function EcranCalendrier({ allerA }: { allerA: (ecran: Ecran, id: number | null) => void }) {
  const aujourdhui = new Date();
  const [mois, setMois] = useState({ annee: aujourdhui.getFullYear(), mois: aujourdhui.getMonth() });
  const grille = construireGrilleMois(mois.annee, mois.mois);
  const premierJour = grille[0]![0]!;
  const lendemainDernier = jourLocal(new Date(new Date(`${grille.at(-1)!.at(-1)!}T12:00:00`).getTime() + 86_400_000));
  const { donnees, erreur, recharger } = utiliserChargement(() => lireCalendrier(premierJour, lendemainDernier), [premierJour, lendemainDernier]);
  const decaler = (pas: number) => setMois(({ annee, mois: m }) => ({ annee: annee + Math.floor((m + pas) / 12), mois: (m + pas + 12) % 12 }));
  const aujourdhuiTexte = jourLocal(aujourdhui);

  return (
    <>
      <EnTeteEcran
        titre="Calendrier"
        sousTitre="Tout ce qui a une date : publications, notifications, BIG SOS à la une, échéances des missions, newsletters et annonces Discord."
        actions={
          <div className="flex items-center gap-1">
            <Bouton petit variante="discret" icone={ChevronLeft} titre="Mois précédent" onClick={() => decaler(-1)} />
            <Bouton petit onClick={() => setMois({ annee: aujourdhui.getFullYear(), mois: aujourdhui.getMonth() })}>Aujourd'hui</Bouton>
            <Bouton petit variante="discret" icone={ChevronRight} titre="Mois suivant" onClick={() => decaler(1)} />
          </div>
        }
      />
      <MessageErreur erreur={erreur} reessayer={recharger} />
      <Carte titre={<span className="capitalize">{nomMois.format(new Date(mois.annee, mois.mois, 1))}</span>} sansMarge>
        <div className="grid grid-cols-7 border-b border-ligne text-center text-xs font-semibold text-gris">
          {JOURS.map((jour) => <div key={jour} className="py-2">{jour}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {grille.flat().map((jour) => {
            const dansLeMois = Number(jour.slice(5, 7)) === mois.mois + 1;
            const evenements = duJour(donnees ?? [], jour);
            return (
              <div key={jour} className={`grid min-h-28 content-start gap-1 border-r border-b border-ligne/70 p-1.5 [&:nth-child(7n)]:border-r-0 ${dansLeMois ? "" : "bg-creme/60"}`}>
                <span className={`chiffres justify-self-end rounded-full px-1.5 text-xs font-semibold ${jour === aujourdhuiTexte ? "bg-nuit text-jaune" : dansLeMois ? "" : "text-gris"}`}>
                  {Number(jour.slice(8))}
                </span>
                {evenements.slice(0, 4).map((e) => {
                  const genre = EVENEMENTS[e.type];
                  return (
                    <button
                      key={`${e.type}-${e.id}-${e.debut}`}
                      type="button"
                      title={`${genre.libelle} · ${e.titre} · ${e.detail}`}
                      onClick={() => allerA(genre.ecran, genre.avecId ? e.id : null)}
                      className={`truncate rounded-md px-1.5 py-0.5 text-left text-[11px] font-semibold ${genre.classes}`}
                    >
                      {genre.emoji} {e.type === "big-sos" ? "" : `${heure.format(new Date(e.debut))} `}{e.titre}
                    </button>
                  );
                })}
                {evenements.length > 4 && <span className="text-[11px] text-gris">+ {evenements.length - 4} autre(s)</span>}
              </div>
            );
          })}
        </div>
      </Carte>
      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        {Object.values(EVENEMENTS).map((genre) => <span key={genre.libelle} className={`rounded-md px-2 py-0.5 font-semibold ${genre.classes}`}>{genre.emoji} {genre.libelle}</span>)}
      </div>
    </>
  );
}
