import { Carte } from "~/composants/interface/Carte.tsx";
import { Chargement } from "~/composants/interface/Chargement.tsx";
import { MessageErreur } from "~/composants/interface/MessageErreur.tsx";
import { BADGES, PALIERS } from "~/contenus/ambassadeurs.ts";
import { utiliserChargement } from "~/hooks/utiliser-chargement.ts";
import { lireClassement } from "~/services/ambassadeurs.ts";
import { RangsAmbassadeurs } from "./RangsAmbassadeurs.tsx";

const mois = new Intl.DateTimeFormat("fr-FR", { month: "long", timeZone: "Europe/Paris" });

/** Classement des ambassadeurs actifs : le mois en cours (de quoi féliciter) et depuis le début. */
export function CarteClassement({ onOuvrirCompte, tour }: { onOuvrirCompte: (id: number) => void; tour: number }) {
  const { donnees, erreur, chargement, recharger } = utiliserChargement(lireClassement, [tour]);
  const moisEnCours = mois.format(new Date());
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <div className="xl:col-span-2"><MessageErreur erreur={erreur} reessayer={recharger} /></div>
      {!donnees && chargement && <Chargement />}
      {donnees && (
        <>
          <Carte titre={`En ${moisEnCours}`}>
            <RangsAmbassadeurs
              lignes={donnees.mois}
              onOuvrirCompte={onOuvrirCompte}
              vide="Personne n'a encore gagné de points ce mois-ci."
            />
          </Carte>
          <Carte titre="Depuis le début">
            <RangsAmbassadeurs
              lignes={donnees.toujours.map((a) => ({
                id: a.id,
                prenom: a.prenom,
                ville: a.ambassadeur?.ville ?? "",
                points: a.points,
                extra: [PALIERS[a.palier]?.emoji, ...a.badges.map((b) => (BADGES[b.badge] ?? "").split(" ")[0])].filter(Boolean).join(" "),
              }))}
              onOuvrirCompte={onOuvrirCompte}
              vide="Pas encore d'ambassadeur actif."
            />
          </Carte>
        </>
      )}
    </div>
  );
}
