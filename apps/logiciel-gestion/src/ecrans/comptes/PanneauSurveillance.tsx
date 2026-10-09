import { Carte } from "~/composants/interface/Carte.tsx";
import { Chargement } from "~/composants/interface/Chargement.tsx";
import { EtatVide } from "~/composants/interface/EtatVide.tsx";
import { MessageErreur } from "~/composants/interface/MessageErreur.tsx";
import type { ErreurApi } from "~/services/client-gestion.ts";
import type { Surveillance } from "~/services/surveillance.ts";
import { CarteCompteSignale } from "./CarteCompteSignale.tsx";
import { CarteContestation } from "./CarteContestation.tsx";
import { CarteLieuRefusant } from "./CarteLieuRefusant.tsx";
import { ResumeSeuils } from "./ResumeSeuils.tsx";

type Props = {
  vue: "signales" | "contestations";
  donnees: Surveillance | null;
  erreur: ErreurApi | null;
  chargement: boolean;
  recharger: () => void;
  onOuvrir: (id: number) => void;
};

/**
 * La surveillance des visites (décidée le 9 octobre 2026) : les comptes et les lieux que les seuils signalent, ou les
 * refus contestés par les clients. Rien n'est bloqué tout seul.
 */
export function PanneauSurveillance({ vue, donnees, erreur, chargement, recharger, onOuvrir }: Props) {
  if (!donnees) {
    return (
      <>
        <MessageErreur erreur={erreur} reessayer={recharger} />
        {chargement && <Chargement />}
      </>
    );
  }
  if (vue === "contestations") {
    return donnees.contestations.length === 0 ? (
      <Carte><EtatVide emoji="⚖️" titre="Aucune contestation">Quand un lieu refuse une visite, le client peut contester avec un petit mot. Il arrive ici, jamais chez le lieu.</EtatVide></Carte>
    ) : (
      <ul className="grid gap-3 xl:grid-cols-2">
        {donnees.contestations.map((c) => <CarteContestation key={c.id} contestation={c} onOuvrir={onOuvrir} onChange={recharger} />)}
      </ul>
    );
  }
  return (
    <>
      <MessageErreur erreur={erreur} reessayer={recharger} />
      <ResumeSeuils seuils={donnees.seuils} parDefaut={donnees.parDefaut} onChange={recharger} />
      <div className="grid items-start gap-5 xl:grid-cols-2">
        <section className="grid gap-3">
          <h2 className="font-titre text-lg font-extrabold">Comptes à regarder ({donnees.comptes.length})</h2>
          {donnees.comptes.length === 0 ? (
            <Carte><EtatVide emoji="😇" titre="Aucun compte signalé">Personne ne dépasse les seuils en ce moment.</EtatVide></Carte>
          ) : (
            <ul className="grid gap-3">
              {donnees.comptes.map((s) => <CarteCompteSignale key={s.compte.id} signale={s} seuils={donnees.seuils} onOuvrir={onOuvrir} onChange={recharger} />)}
            </ul>
          )}
        </section>
        <section className="grid gap-3">
          <h2 className="font-titre text-lg font-extrabold">Lieux qui refusent beaucoup ({donnees.lieux.length})</h2>
          {donnees.lieux.length === 0 ? (
            <Carte><EtatVide emoji="🤝" titre="Aucun lieu signalé">Aucun lieu ne refuse plus que le seuil en ce moment.</EtatVide></Carte>
          ) : (
            <ul className="grid gap-3">
              {donnees.lieux.map((l) => <CarteLieuRefusant key={l.lieu.id} refusant={l} onChange={recharger} />)}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
