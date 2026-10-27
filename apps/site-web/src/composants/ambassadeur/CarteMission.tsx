import { DateEnLettres } from "~/composants/ambassadeur/DateEnLettres";
import { ChampTexte } from "~/composants/compte/ChampTexte";
import { FormulaireCompte } from "~/composants/compte/FormulaireCompte";
import { TEXTES_MISSIONS_AMBASSADEUR_PAR_LANGUE } from "~/contenus/missions-ambassadeur";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import type { MissionAmbassadeur } from "~/types/compte";

/**
 * Une mission confiée par l'équipe : son détail (texte brut, échappé, retours à la ligne gardés), son lieu, son échéance ;
 * à faire, un compte rendu la termine (action de routes/ambassadeur/missions.tsx). L'échéance est un souhait de l'équipe,
 * pas une obligation : le programme n'impose ni horaires ni objectifs.
 */
export function CarteMission({ mission }: { mission: MissionAmbassadeur }) {
  const T = utiliserTextes(TEXTES_MISSIONS_AMBASSADEUR_PAR_LANGUE).carte;
  const langueEquipe = utiliserLangue() === "fr" ? undefined : "fr";
  const titreId = `mission-${mission.id}-titre`;
  // Le titre de la mission, lu seulement par les lecteurs d'écran : chaque champ et chaque bouton a son propre nom
  const pourLecteurs = <span className="sr-only">{lierPonctuation(T.pourLecteurs(mission.titre))}</span>;
  return (
    <article aria-labelledby={titreId} className="rounded-carte border-2 border-encre bg-white p-6 shadow-brut md:p-8">
      <h3 id={titreId} tabIndex={-1} lang={langueEquipe} className="text-xl font-extrabold">{mission.titre}</h3>
      <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-gris">
        {mission.lieu && <li><span aria-hidden="true">📍 </span>{mission.lieu.nom}, {mission.lieu.ville}</li>}
        {mission.echeance && mission.statut === "a-faire" && <li><span aria-hidden="true">⏳ </span>{T.avant}<DateEnLettres iso={mission.echeance} /></li>}
        {mission.statut === "faite" && mission.faiteLe && <li><span aria-hidden="true">✅ </span>{T.faiteLe}<DateEnLettres iso={mission.faiteLe} /></li>}
        {mission.statut === "annulee" && <li>{T.annulee}</li>}
      </ul>
      {mission.detail && <p lang={langueEquipe} className="mt-4 whitespace-pre-line">{mission.detail}</p>}

      {mission.statut === "a-faire" && (
        <FormulaireCompte nom={`mission-${mission.id}`} bouton={<>{lierPonctuation(T.cEstFait)}{pourLecteurs}</>} className="mt-6 border-t-2 border-ligne pt-6">
          <input type="hidden" name="missionId" value={mission.id} />
          <ChampTexte
            nom="compteRendu"
            libelle={<>{T.compteRendu}{pourLecteurs}</>}
            aide={T.aide}
            maximum={2000}
            lignes={4}
          />
        </FormulaireCompte>
      )}
      {mission.statut === "faite" && mission.compteRendu && (
        <div className="mt-4 rounded-2xl bg-creme px-4 py-3">
          <p className="text-sm font-semibold">{T.compteRendu}</p>
          <p className="mt-1 whitespace-pre-line text-gris">{mission.compteRendu}</p>
        </div>
      )}
    </article>
  );
}
