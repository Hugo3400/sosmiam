import { Square } from "lucide-react";

import { Badge } from "~/composants/interface/Badge.tsx";
import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Carte } from "~/composants/interface/Carte.tsx";
import { EtatVide } from "~/composants/interface/EtatVide.tsx";
import { formaterDate } from "~/fonctions/texte/formater-date.ts";
import { annulerCampagne, type Campagne } from "~/services/courriels.ts";

/** Les envois groupés (newsletters, mails aux ambassadeurs) : où en est chacun, et de quoi arrêter celui en cours. */
export function ListeCampagnes({ campagnes, onChange }: { campagnes: Campagne[]; onChange: () => void }) {
  return (
    <Carte titre="Envois groupés" sansMarge>
      {campagnes.length === 0 ? (
        <EtatVide emoji="📮" titre="Rien d'envoyé pour l'instant">Écris une newsletter dans « Rédaction », puis « Envoyer… » : tu choisis à qui.</EtatVide>
      ) : (
        <ul>
          {campagnes.map((campagne) => {
            const { envoye = 0, echec = 0, annule = 0 } = campagne.statuts;
            const attente = campagne.statuts["en-attente"] ?? 0;
            const part = campagne.total ? Math.round((envoye / campagne.total) * 100) : 0;
            return (
              <li key={campagne.id} className="grid gap-2 border-b border-ligne/70 px-5 py-3 text-sm last:border-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{campagne.objet}</span>
                  <Badge ton={campagne.public === "newsletter" ? "jaune" : "encre"}>{campagne.public === "newsletter" ? "Newsletter" : "Ambassadeurs"}</Badge>
                  {attente > 0 ? <Badge ton="jaune">En cours</Badge> : <Badge ton="vert">Terminé</Badge>}
                  <span className="ml-auto text-gris">{formaterDate(campagne.creeLe, true)}</span>
                  {attente > 0 && (
                    <Bouton
                      petit
                      variante="danger"
                      icone={Square}
                      onClick={() => window.confirm(`Arrêter l'envoi ? Les ${attente} mail(s) pas encore partis sont annulés.`) && void annulerCampagne(campagne.id).then(onChange, onChange)}
                    >
                      Arrêter
                    </Bouton>
                  )}
                </div>
                {campagne.description && <p className="text-gris">{campagne.description}</p>}
                <div className="h-2 overflow-hidden rounded-full bg-ligne" role="progressbar" aria-valuenow={part} aria-valuemin={0} aria-valuemax={100} aria-label="Mails partis">
                  <div className="h-full rounded-full bg-vert" style={{ width: `${part}%` }} />
                </div>
                <p className="chiffres text-gris">
                  {envoye} parti{envoye > 1 ? "s" : ""} sur {campagne.total}
                  {attente > 0 && ` · ${attente} en attente`}
                  {echec > 0 && ` · ${echec} refusé${echec > 1 ? "s" : ""} (adresse invalide ?)`}
                  {annule > 0 && ` · ${annule} annulé${annule > 1 ? "s" : ""} (désinscrits entre-temps ou envoi arrêté)`}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </Carte>
  );
}
