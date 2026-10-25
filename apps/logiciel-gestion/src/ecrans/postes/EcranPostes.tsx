import { Check, Copy, Laptop, RotateCw, Unplug } from "lucide-react";
import { useState } from "react";

import { Badge } from "~/composants/interface/Badge.tsx";
import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Carte } from "~/composants/interface/Carte.tsx";
import { Chargement } from "~/composants/interface/Chargement.tsx";
import { MessageErreur } from "~/composants/interface/MessageErreur.tsx";
import { Modale } from "~/composants/interface/Modale.tsx";
import { EnTeteEcran } from "~/composants/mise-en-page/EnTeteEcran.tsx";
import { ADRESSE_TELECHARGEMENT, TEXTES_POSTES as T } from "~/contenus/postes.ts";
import { expliquerErreur } from "~/fonctions/texte/expliquer-erreur.ts";
import { formaterDate } from "~/fonctions/texte/formater-date.ts";
import { utiliserChargement } from "~/hooks/utiliser-chargement.ts";
import { ErreurApi } from "~/services/client-gestion.ts";
import { couperPoste, listerPostes, type PosteAutorise } from "~/services/postes.ts";
import { copier } from "~/services/systeme.ts";

function TexteACopier({ texte }: { texte: string }) {
  const [copie, setCopie] = useState(false);
  return (
    <div className="mt-3 flex items-center gap-2 rounded-xl border border-ligne bg-creme p-3">
      <code className="flex-1 font-mono text-[12px] break-all">{texte}</code>
      <Bouton petit icone={copie ? Check : Copy} titre={T.copier} onClick={() => copier(texte).then(() => setCopie(true))} />
    </div>
  );
}

const decrire = (poste: PosteAutorise) =>
  [
    poste.ajouteLe ? T.ajouteLe(formaterDate(poste.ajouteLe, poste.origine === "distance")) : null,
    poste.origine === "distance" ? (poste.expireLe ? T.jusquA(formaterDate(poste.expireLe, true)) : T.sansFin) : null,
    poste.id,
  ].filter(Boolean).join(" · ");

export function EcranPostes() {
  const { donnees, erreur, chargement, recharger } = utiliserChargement(listerPostes, []);
  const [aCouper, setACouper] = useState<PosteAutorise | null>(null);
  const [etat, setEtat] = useState<{ enCours: boolean; erreur: string | null; message: string | null }>({ enCours: false, erreur: null, message: null });

  if (!donnees) {
    if (chargement) return <Chargement />;
    if (erreur?.code === "introuvable") return <p className="rounded-xl bg-jaune-clair px-4 py-3 text-sm">{T.pasBranche}</p>;
    return <MessageErreur erreur={erreur} reessayer={recharger} />;
  }

  async function couper(poste: PosteAutorise) {
    setEtat({ enCours: true, erreur: null, message: null });
    try {
      await couperPoste(poste.id);
      setEtat({ enCours: false, erreur: null, message: T.coupe(poste.nom) });
      recharger();
    } catch (probleme) {
      setEtat({ enCours: false, erreur: expliquerErreur(probleme instanceof ErreurApi ? probleme : null), message: null });
    }
    setACouper(null);
  }

  return (
    <>
      <EnTeteEcran titre={T.titre} sousTitre={T.sousTitre} actions={<Bouton icone={RotateCw} onClick={recharger}>{T.actualiser}</Bouton>} />
      {etat.message && <p role="status" className="mb-4 rounded-xl bg-vert-clair px-4 py-2 text-sm font-semibold text-vert">{etat.message}</p>}
      {etat.erreur && <p role="alert" className="mb-4 rounded-xl bg-rose-alerte px-4 py-2 text-sm font-semibold text-rouge-texte">{etat.erreur}</p>}
      <div className="grid gap-4 xl:grid-cols-2">
        <Carte titre={donnees.distanceOuverte ? T.distanceOuverte : T.distanceFermee}>
          <p className="text-sm">{donnees.distanceOuverte ? (donnees.alertesParMail ? T.distanceAvecMail : T.distanceSansMail) : T.aideFermee}</p>
          {(!donnees.distanceOuverte || !donnees.alertesParMail) && <TexteACopier texte={T.commandeDistance} />}
        </Carte>
        <Carte titre={T.installer}>
          <p className="text-sm">{T.aideInstaller}</p>
          <TexteACopier texte={ADRESSE_TELECHARGEMENT} />
        </Carte>
      </div>
      <ul className="mt-5 grid gap-3">
        {donnees.postes.map((poste) => (
          <li key={poste.id} className="flex flex-wrap items-center gap-3 rounded-carte border border-ligne bg-white px-5 py-4">
            <Laptop className="size-5 shrink-0" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 font-semibold">
                {poste.nom}
                {poste.cePoste && <Badge ton="encre">{T.cePoste}</Badge>}
                <Badge ton={poste.origine === "distance" ? "jaune" : "contour"}>{poste.origine === "distance" ? T.distance : T.serveur}</Badge>
              </p>
              <p className="text-[13px] text-gris">{decrire(poste)}</p>
            </div>
            {!poste.cePoste && <Bouton petit variante="danger" icone={Unplug} onClick={() => setACouper(poste)}>{T.couper}</Bouton>}
          </li>
        ))}
      </ul>
      <Modale
        titre={aCouper ? T.titreCouper(aCouper.nom) : ""}
        ouverte={aCouper !== null}
        onFermer={() => setACouper(null)}
        actions={<><Bouton onClick={() => setACouper(null)}>{T.annuler}</Bouton><Bouton variante="danger" chargement={etat.enCours} onClick={() => aCouper && void couper(aCouper)}>{T.confirmer}</Bouton></>}
      >
        <p className="text-sm">{T.confirmationCouper}</p>
      </Modale>
    </>
  );
}
