import { Check, EyeOff, Siren } from "lucide-react";
import { useState } from "react";

import { Badge } from "~/composants/interface/Badge.tsx";
import { Bouton } from "~/composants/interface/Bouton.tsx";
import { RAISONS_SIGNALEMENT } from "~/contenus/raisons-signalement.ts";
import { VignetteMedia } from "~/ecrans/publications/VignetteMedia.tsx";
import { expliquerErreur } from "~/fonctions/texte/expliquer-erreur.ts";
import { formaterDate } from "~/fonctions/texte/formater-date.ts";
import { ErreurApi } from "~/services/client-gestion.ts";
import { deciderSignalement, type Signalement } from "~/services/moderation.ts";
import { ModaleDecisionModeration, type ChoixModeration } from "./ModaleDecisionModeration.tsx";
import { SuiteDecision } from "./SuiteDecision.tsx";

/** Un contenu signalé (une ou plusieurs fois) : ce qu'on lui reproche, le contenu lui-même, et la décision. */
export function CarteContenuSignale({ signalements, onDecide }: { signalements: Signalement[]; onDecide: () => void }) {
  const [decision, setDecision] = useState<"retenu" | "rejete" | null>(null);
  const [etat, setEtat] = useState<{ enCours: boolean; erreur: string | null }>({ enCours: false, erreur: null });
  const premier = signalements[0]!;
  const publication = premier.publication;
  const urgent = signalements.some((s) => s.urgent && s.statut === "a-traiter");
  // Contestée et pas encore réexaminée : on peut décider à nouveau
  const conteste = !!premier.contesteLe && !premier.reexamineLe;
  const aTraiter = premier.statut === "a-traiter" || conteste;
  const media = publication?.medias.find((m) => m.type === "affiche") ?? publication?.medias.find((m) => m.type === "photo") ?? publication?.medias[0];
  const contenu = publication
    ? `${publication.medias.some((m) => m.type === "video") ? "ta vidéo" : "ta publication"} sur ${publication.lieu.nom} (« ${publication.legende.slice(0, 60)}${publication.legende.length > 60 ? "…" : ""} »)`
    : "ta publication";

  async function confirmer(choix: ChoixModeration) {
    setEtat({ enCours: true, erreur: null });
    try {
      await deciderSignalement(premier.id, choix);
      setDecision(null);
      setEtat({ enCours: false, erreur: null });
      onDecide();
    } catch (probleme) {
      setEtat({ enCours: false, erreur: expliquerErreur(probleme instanceof ErreurApi ? probleme : null) });
    }
  }

  return (
    <article className={`grid gap-5 rounded-carte border bg-white p-5 lg:grid-cols-[160px_minmax(0,1fr)_auto] ${urgent ? "border-2 border-tomate" : "border-ligne"}`}>
      <VignetteMedia fichier={media?.fichier ?? null} video={media?.type === "video"} controles className="aspect-[9/16] w-40 rounded-xl border border-ligne" />
      <div className="grid content-start gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {urgent && <Badge ton="rouge"><Siren className="size-3.5" aria-hidden /> Masquée pour tous</Badge>}
          <Badge>{signalements.length} signalement{signalements.length > 1 ? "s" : ""}</Badge>
          {premier.statut !== "a-traiter" && <Badge ton={premier.statut === "retenu" ? "rouge" : "vert"}>{premier.statut === "retenu" ? "Retiré" : "Remis en ligne"}</Badge>}
          {conteste && <Badge ton="jaune">Contesté le {formaterDate(premier.contesteLe!)}</Badge>}
        </div>
        {publication ? (
          <div>
            <p className="font-titre text-lg font-extrabold">{publication.lieu.emoji} {publication.lieu.nom}</p>
            <p className="text-[13px] text-gris">
              Publication n° {publication.id} · {publication.auteurType === "lieu" ? "par le lieu" : `par @${publication.auteurPseudo}`}
              {publication.partenariat ? ` · Collaboration commerciale (${publication.partenariat})` : ""}
            </p>
            <p className="mt-1 text-sm">{publication.legende}</p>
          </div>
        ) : (
          <p className="text-sm text-gris">Contenu introuvable ({premier.cible} n° {premier.cibleId}) : il a peut-être été supprimé.</p>
        )}
        <ul className="grid gap-2">
          {signalements.map((s) => (
            <li key={s.id} className="rounded-xl bg-creme px-3 py-2 text-sm">
              <p className="font-semibold">
                {RAISONS_SIGNALEMENT[s.raison] ?? s.raison}
                {s.precision && <span className="font-normal text-gris"> · {s.precision}</span>}
                <span className="float-right text-xs font-normal text-gris">{formaterDate(s.creeLe, true)}</span>
              </p>
              {s.explication && <p className="mt-0.5 text-gris">« {s.explication} »</p>}
            </li>
          ))}
        </ul>
        {conteste && premier.contestation && <p className="rounded-xl bg-jaune-clair px-3 py-2 text-sm"><strong>Contestation :</strong> « {premier.contestation} »</p>}
        {premier.statut !== "a-traiter" && premier.decision && <p className="text-sm"><strong>Ta note :</strong> {premier.decision}</p>}
        {premier.statut !== "a-traiter" && !conteste && <SuiteDecision signalement={premier} contenu={contenu} onChange={onDecide} />}
      </div>
      {aTraiter && (
        <div className="flex flex-col gap-2 lg:w-52">
          <Bouton variante="danger" icone={EyeOff} onClick={() => setDecision("retenu")}>{conteste ? "Maintenir le retrait" : "Retirer la publication"}</Bouton>
          <Bouton icone={Check} onClick={() => setDecision("rejete")}>{conteste ? "Remettre en ligne" : urgent ? "Remettre en ligne" : "Rien à redire"}</Bouton>
        </div>
      )}
      {decision && (
        <ModaleDecisionModeration
          decision={decision}
          urgent={urgent}
          reexamen={conteste}
          enCours={etat.enCours}
          erreur={etat.erreur}
          onFermer={() => setDecision(null)}
          onConfirmer={confirmer}
        />
      )}
    </article>
  );
}
