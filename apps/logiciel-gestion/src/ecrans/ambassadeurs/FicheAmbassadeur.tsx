import { Ban, Check, RotateCcw, X } from "lucide-react";
import { useState } from "react";

import { Badge } from "~/composants/interface/Badge.tsx";
import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Chargement } from "~/composants/interface/Chargement.tsx";
import { MessageErreur } from "~/composants/interface/MessageErreur.tsx";
import { Modale } from "~/composants/interface/Modale.tsx";
import { PastilleEmailVerifie } from "~/composants/interface/PastilleEmailVerifie.tsx";
import { BADGES, PALIERS, STATUTS_AMBASSADEUR } from "~/contenus/ambassadeurs.ts";
import { decrireNumerosFondateur } from "~/fonctions/fondateurs/decrire-numeros-fondateur.ts";
import { expliquerErreur } from "~/fonctions/texte/expliquer-erreur.ts";
import { formaterDate } from "~/fonctions/texte/formater-date.ts";
import { formaterDateRelative } from "~/fonctions/texte/formater-date-relative.ts";
import { formaterNombre } from "~/fonctions/texte/formater-nombre.ts";
import { utiliserChargement } from "~/hooks/utiliser-chargement.ts";
import { deciderAmbassadeur, lireAmbassadeur } from "~/services/ambassadeurs.ts";
import { ErreurApi } from "~/services/client-gestion.ts";
import { AccesAmbassadeur } from "./AccesAmbassadeur.tsx";
import { ActiviteAmbassadeur } from "./ActiviteAmbassadeur.tsx";
import { CarteCandidature } from "./CarteCandidature.tsx";
import { InfosAmbassadeur } from "./InfosAmbassadeur.tsx";
import { ModaleMessage } from "./ModaleMessage.tsx";
import { ModaleMission } from "./ModaleMission.tsx";
import { PointsAmbassadeur } from "./PointsAmbassadeur.tsx";

type Props = { id: number; onFermer: () => void; onChange: () => void };

/** Tout sur un ambassadeur : décision, points, ville, note, activité, candidature fondateur et accès à son compte. */
export function FicheAmbassadeur({ id, onFermer, onChange }: Props) {
  const { donnees: fiche, erreur, chargement, recharger } = utiliserChargement(() => lireAmbassadeur(id), [id]);
  const [fenetre, setFenetre] = useState<"mission" | "message" | null>(null);
  const [probleme, setProbleme] = useState<string | null>(null);
  const actualiser = () => {
    recharger();
    onChange();
  };

  async function decider(statut: "actif" | "refuse" | "suspendu") {
    if (!fiche) return;
    const questions = {
      refuse: `Refuser ${fiche.prenom} ? L'espace ambassadeur lui reste fermé, et son compte (créé pour cette inscription) est effacé 30 jours après.`,
      suspendu: `Suspendre ${fiche.prenom} ? L'espace ambassadeur lui est fermé tout de suite, jusqu'à ce que tu le réactives. Son compte et l'app ne changent pas.`,
      actif: null,
    };
    if (questions[statut] && !window.confirm(questions[statut])) return;
    setProbleme(null);
    try {
      await deciderAmbassadeur(fiche.id, statut);
      actualiser();
    } catch (erreurApi) {
      setProbleme(expliquerErreur(erreurApi instanceof ErreurApi ? erreurApi : null));
    }
  }

  const statut = fiche?.ambassadeur?.statut;
  const etat = statut ? STATUTS_AMBASSADEUR[statut] : null;
  const palier = fiche ? PALIERS[fiche.palier] : null;
  const fondateur = fiche?.candidatures.find((c) => c.statut === "acceptee");

  return (
    <>
      <Modale large titre={fiche ? fiche.prenom : "Fiche ambassadeur"} ouverte onFermer={onFermer}>
        <MessageErreur erreur={erreur} reessayer={recharger} />
        {!fiche && chargement && <Chargement />}
        {fiche && (
          <div className="grid gap-6">
            <div className="grid gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {etat && <Badge ton={etat.ton}>{etat.libelle}</Badge>}
                {palier && <Badge ton="jaune">{palier.emoji} {palier.nom}</Badge>}
                {fiche.ambassadeur?.certifieLe && <Badge ton="vert">✅ Certifié{fiche.ambassadeur.structure ? ` · ${fiche.ambassadeur.structure}` : ""}</Badge>}
                <Badge ton="encre">{formaterNombre(fiche.points)} points</Badge>
                {fondateur && <Badge ton="encre">🏅 {decrireNumerosFondateur(fondateur) ?? "Fondateur"}</Badge>}
                {fiche.badges.filter((b) => b.badge !== "fondateur").map((b) => <Badge key={b.id}>{BADGES[b.badge] ?? b.badge}</Badge>)}
              </div>
              <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 text-sm md:grid-cols-[auto_minmax(0,1fr)_auto_minmax(0,1fr)]">
                <dt className="text-gris">Adresse</dt><dd className="truncate">{fiche.email} · <PastilleEmailVerifie le={fiche.emailVerifieLe} /></dd>
                <dt className="text-gris">Inscrit</dt><dd>{formaterDate(fiche.creeLe)}{fiche.ambassadeur?.decideLe && ` · décidé le ${formaterDate(fiche.ambassadeur.decideLe)}`}</dd>
                <dt className="text-gris">Dernière visite</dt><dd>{formaterDateRelative(fiche.derniereConnexion)} · {fiche._count.sessions} connexion(s) ouverte(s), app comprise</dd>
                <dt className="text-gris">Sans visite</dt><dd>rôle retiré le {formaterDate(fiche.retireLe)}, compte effacé le {formaterDate(fiche.effaceLe)}</dd>
                <dt className="text-gris">Conditions</dt><dd>acceptées (version du {fiche.cguVersion})</dd>
              </dl>
              <div className="flex flex-wrap gap-2">
                {statut === "en-attente" && (
                  <>
                    <Bouton variante="principal" icone={Check} onClick={() => decider("actif")}>Valider</Bouton>
                    <Bouton variante="danger" icone={X} onClick={() => decider("refuse")}>Refuser</Bouton>
                  </>
                )}
                {statut === "actif" && <Bouton variante="danger" icone={Ban} onClick={() => decider("suspendu")}>Suspendre</Bouton>}
                {(statut === "suspendu" || statut === "refuse") && (
                  <Bouton icone={RotateCcw} onClick={() => decider("actif")}>{statut === "suspendu" ? "Réactiver" : "Valider quand même"}</Bouton>
                )}
              </div>
              {probleme && <p role="alert" className="text-sm font-semibold text-rouge-texte">{probleme}</p>}
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <PointsAmbassadeur fiche={fiche} onChange={actualiser} />
              <InfosAmbassadeur key={`${fiche.ambassadeur?.ville}-${fiche.ambassadeur?.quartier}-${fiche.ambassadeur?.noteEquipe}`} fiche={fiche} onChange={actualiser} />
            </div>
            <ActiviteAmbassadeur fiche={fiche} onConfierMission={() => setFenetre("mission")} onEcrire={() => setFenetre("message")} />
            {fiche.candidatures.length > 0 && (
              <section className="grid gap-3">
                <h3 className="font-extrabold">Candidature fondateur</h3>
                {fiche.candidatures.map((candidature) => <CarteCandidature key={candidature.id} candidature={candidature} onChange={actualiser} />)}
              </section>
            )}
            <AccesAmbassadeur fiche={fiche} onSupprime={() => { onChange(); onFermer(); }} />
          </div>
        )}
      </Modale>
      {/* Hors de la fiche : la fermeture d'une fenêtre ne doit pas fermer la fiche avec elle */}
      {fiche && fenetre === "mission" && <ModaleMission compteId={fiche.id} prenom={fiche.prenom} onFermer={() => setFenetre(null)} onCreee={() => { setFenetre(null); actualiser(); }} />}
      {fiche && fenetre === "message" && <ModaleMessage compteId={fiche.id} prenom={fiche.prenom} onFermer={() => setFenetre(null)} onEnvoye={() => { setFenetre(null); actualiser(); }} />}
    </>
  );
}
