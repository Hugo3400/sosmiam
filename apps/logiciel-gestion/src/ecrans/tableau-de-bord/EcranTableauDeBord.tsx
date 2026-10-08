import { ArrowRight, RotateCw, Server, Siren } from "lucide-react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Carte } from "~/composants/interface/Carte.tsx";
import { Chargement } from "~/composants/interface/Chargement.tsx";
import { GraphiqueColonnes } from "~/composants/interface/GraphiqueColonnes.tsx";
import { MessageErreur } from "~/composants/interface/MessageErreur.tsx";
import { TuileChiffre } from "~/composants/interface/TuileChiffre.tsx";
import { EnTeteEcran } from "~/composants/mise-en-page/EnTeteEcran.tsx";
import type { Ecran } from "~/contenus/menu.ts";
import { formaterDateRelative } from "~/fonctions/texte/formater-date-relative.ts";
import { formaterNombre } from "~/fonctions/texte/formater-nombre.ts";
import { nommerPeriode } from "~/fonctions/texte/nommer-periode.ts";
import { utiliserChargement } from "~/hooks/utiliser-chargement.ts";
import { lireTableauDeBord } from "~/services/tableau-de-bord.ts";

const ecart = (aujourdhui: number, hier: number) => (hier === 0 ? null : ((aujourdhui - hier) / hier) * 100);
const jourDuJour = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" });

/** Vue d'ensemble : visites, newsletter, modération, contenus et dernières actions. */
type Props = { allerA: (ecran: Ecran) => void; problemesServeur: string[]; reverifierServeur: () => void };

export function EcranTableauDeBord({ allerA, problemesServeur, reverifierServeur }: Props) {
  const { donnees, erreur, chargement, recharger } = utiliserChargement(lireTableauDeBord, []);
  const jours = donnees?.visites.jours ?? [];
  const aujourdhui = jours[jours.length - 1] ?? { vues: 0, visites: 0, visiteurs: 0 };
  const hier = jours[jours.length - 2] ?? { vues: 0, visites: 0, visiteurs: 0 };

  return (
    <>
      <EnTeteEcran
        titre="Salut Hugo 👋"
        sousTitre={`On est ${jourDuJour.format(new Date())}. Voici comment se porte SOS Miam.`}
        actions={<Bouton icone={RotateCw} chargement={chargement && !!donnees} onClick={() => { recharger(); reverifierServeur(); }}>Actualiser</Bouton>}
      />
      <MessageErreur erreur={erreur} reessayer={recharger} />
      {!donnees && chargement && <Chargement />}
      {donnees && (
        <div className="grid gap-5">
          {donnees.moderation.urgents > 0 && (
            <div role="alert" className="flex flex-wrap items-center gap-3 rounded-carte border-2 border-encre bg-tomate px-5 py-4 text-white shadow-brut">
              <Siren className="size-6 shrink-0" aria-hidden />
              <p className="flex-1 font-semibold">
                {donnees.moderation.urgents === 1
                  ? "1 publication est masquée pour tout le monde après un signalement grave : elle attend ta décision."
                  : `${donnees.moderation.urgents} publications sont masquées pour tout le monde après un signalement grave : elles attendent ta décision.`}
              </p>
              <Bouton variante="principal" icone={ArrowRight} onClick={() => allerA("moderation")}>Modérer</Bouton>
            </div>
          )}

          {problemesServeur.length > 0 && (
            <div role="alert" className="flex flex-wrap items-center gap-3 rounded-carte border-2 border-encre bg-jaune-clair px-5 py-4 shadow-brut">
              <Server className="size-6 shrink-0" aria-hidden />
              <ul className="flex-1 text-sm font-semibold">
                {problemesServeur.map((probleme) => <li key={probleme}>{probleme}</li>)}
              </ul>
              <Bouton icone={ArrowRight} onClick={() => allerA("maintenance")}>Maintenance</Bouton>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <TuileChiffre libelle="Visiteurs aujourd'hui" valeur={aujourdhui.visiteurs} ecart={{ pourcentage: ecart(aujourdhui.visiteurs, hier.visiteurs), reference: "par rapport à hier" }} accent />
            <TuileChiffre libelle="Pages vues aujourd'hui" valeur={aujourdhui.vues} ecart={{ pourcentage: ecart(aujourdhui.vues, hier.vues), reference: "par rapport à hier" }} />
            <TuileChiffre libelle="Visiteurs cette semaine" valeur={donnees.visites.semaine.visiteurs} detail={`${formaterNombre(donnees.visites.semaine.visites)} visites, ${formaterNombre(donnees.visites.semaine.vues)} pages vues`} />
            <TuileChiffre libelle="Inscrits à la newsletter" valeur={donnees.newsletter.inscrits} detail={`+${formaterNombre(donnees.newsletter.recents)} ces 7 derniers jours`} />
          </div>

          <Carte titre="Visiteurs, 14 derniers jours" actions={<Bouton petit variante="discret" icone={ArrowRight} onClick={() => allerA("statistiques")}>Toutes les statistiques</Bouton>}>
            <GraphiqueColonnes
              mesure="Visiteurs"
              points={jours.map((jour, i) => ({
                cle: jour.cle,
                libelle: nommerPeriode(jour.cle),
                libelleLong: nommerPeriode(jour.cle, true),
                valeur: jour.visiteurs,
                details: [`${formaterNombre(jour.visites)} visites`, `${formaterNombre(jour.vues)} pages vues`],
                enCours: i === jours.length - 1,
              }))}
            />
          </Carte>

          <div className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-4">
            <Carte titre="Modération" actions={<Bouton petit variante="discret" icone={ArrowRight} onClick={() => allerA("moderation")}>Ouvrir</Bouton>}>
              <p className="chiffres font-titre text-3xl font-extrabold">{formaterNombre(donnees.moderation.aTraiter)}</p>
              <p className="text-sm text-gris">{donnees.moderation.aTraiter === 0 ? "Rien à traiter, tout est calme 😌" : "signalement(s) à traiter"}</p>
            </Carte>
            <Carte titre="Demandes de lieux" actions={<Bouton petit variante="discret" icone={ArrowRight} onClick={() => allerA("demandes")}>Ouvrir</Bouton>}>
              <p className="chiffres font-titre text-3xl font-extrabold">{formaterNombre(donnees.demandes.aTraiter)}</p>
              <p className="text-sm text-gris">{donnees.demandes.aTraiter === 0 ? "Aucune nouvelle demande" : "demande(s) de lieux ou pépite(s) Discord à étudier"}</p>
            </Carte>
            <Carte titre="Contenus" actions={<Bouton petit variante="discret" icone={ArrowRight} onClick={() => allerA("publications")}>Publications</Bouton>}>
              <dl className="grid grid-cols-2 gap-y-2 text-sm">
                <dt className="text-gris">Lieux en ligne</dt><dd className="chiffres text-right font-semibold">{formaterNombre(donnees.lieux.publie ?? 0)}</dd>
                <dt className="text-gris">Lieux en brouillon</dt><dd className="chiffres text-right font-semibold">{formaterNombre(donnees.lieux.brouillon ?? 0)}</dd>
                <dt className="text-gris">Publications en ligne</dt><dd className="chiffres text-right font-semibold">{formaterNombre((donnees.publications.publiee ?? 0) - donnees.publications.programmees)}</dd>
                <dt className="text-gris">Programmées</dt><dd className="chiffres text-right font-semibold">{formaterNombre(donnees.publications.programmees)}</dd>
              </dl>
            </Carte>
            <Carte titre="Newsletter" actions={<Bouton petit variante="discret" icone={ArrowRight} onClick={() => allerA("newsletter")}>Ouvrir</Bouton>}>
              <dl className="grid grid-cols-2 gap-y-2 text-sm">
                <dt className="text-gris">Inscrits</dt><dd className="chiffres text-right font-semibold">{formaterNombre(donnees.newsletter.inscrits)}</dd>
                <dt className="text-gris">Futurs ambassadeurs</dt><dd className="chiffres text-right font-semibold">{formaterNombre(donnees.newsletter.ambassadeurs)}</dd>
                <dt className="text-gris">Bêta-testeurs</dt><dd className="chiffres text-right font-semibold">{formaterNombre(donnees.newsletter.beta)}</dd>
              </dl>
            </Carte>
          </div>

          <Carte titre="Dernières actions" actions={<Bouton petit variante="discret" icone={ArrowRight} onClick={() => allerA("maintenance")}>Tout le journal</Bouton>}>
            {donnees.journal.length === 0 ? (
              <p className="text-sm text-gris">Rien encore : ton premier geste dans le logiciel s'affichera ici.</p>
            ) : (
              <ul className="grid gap-2 text-sm">
                {donnees.journal.map((entree) => (
                  <li key={entree.id} className="flex flex-wrap gap-x-2">
                    <span className="font-semibold">{entree.action}</span>
                    {entree.detail && <span className="text-gris">{entree.detail}</span>}
                    <span className="ml-auto text-gris">{formaterDateRelative(entree.moment)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Carte>
        </div>
      )}
    </>
  );
}
