import { Check, EyeOff, Siren } from "lucide-react";
import { useState } from "react";

import { Badge } from "~/composants/interface/Badge.tsx";
import { Bouton } from "~/composants/interface/Bouton.tsx";
import { CIBLES_MODERATION } from "~/contenus/cibles-moderation.ts";
import { RAISONS_SIGNALEMENT } from "~/contenus/raisons-signalement.ts";
import { VignetteMedia } from "~/ecrans/publications/VignetteMedia.tsx";
import { expliquerErreur } from "~/fonctions/texte/expliquer-erreur.ts";
import { formaterDate } from "~/fonctions/texte/formater-date.ts";
import { ErreurApi } from "~/services/client-gestion.ts";
import { deciderSignalement, type LieuCite, type Signalement } from "~/services/moderation.ts";
import { ApercuArticleActus } from "~/ecrans/actus/ApercuArticleActus.tsx";
import { ApercuReponseLieuActus } from "~/ecrans/actus/ApercuReponseLieuActus.tsx";
import { InstantaneSignale } from "./InstantaneSignale.tsx";
import { MediaSignale } from "./MediaSignale.tsx";
import { AvisSignale } from "./AvisSignale.tsx";
import { ModaleDecisionModeration, type ChoixModeration } from "./ModaleDecisionModeration.tsx";
import { SuiteDecision } from "./SuiteDecision.tsx";

type Props = { signalements: Signalement[]; lieux: Record<string, LieuCite>; onDecide: () => void };

/**
 * Un contenu signalé (une ou plusieurs fois) : ce qu'on lui reproche, le contenu lui-même (la publication, ou l'instantané
 * d'un contenu social), qui l'a signalé, et la décision.
 */
export function CarteContenuSignale({ signalements, lieux, onDecide }: Props) {
  const [decision, setDecision] = useState<"retenu" | "rejete" | null>(null);
  const [etat, setEtat] = useState<{ enCours: boolean; erreur: string | null }>({ enCours: false, erreur: null });
  const premier = signalements[0]!;
  const avecMedia = signalements.find((s) => s.avecMedia);
  const publication = premier.publication;
  const cible = CIBLES_MODERATION[premier.cible] ?? { libelle: premier.cible, le: "le contenu", emoji: "❔" };
  const urgent = signalements.some((s) => s.urgent && s.statut === "a-traiter");
  // Contestée et pas encore réexaminée : on peut décider à nouveau
  const conteste = !!premier.contesteLe && !premier.reexamineLe;
  const aTraiter = premier.statut === "a-traiter" || conteste;
  const media = publication?.medias.find((m) => m.type === "affiche") ?? publication?.medias.find((m) => m.type === "photo") ?? publication?.medias[0];
  const contenu = publication
    ? `${publication.medias.some((m) => m.type === "video") ? "ta vidéo" : "ta publication"} sur ${publication.lieu.nom} (« ${publication.legende.slice(0, 60)}${publication.legende.length > 60 ? "…" : ""} »)`
    : cible.le.replace(/^le /, "ton ").replace(/^la /, "ta ");

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
      {publication ? (
        <VignetteMedia fichier={media?.fichier ?? null} video={media?.type === "video"} controles className="aspect-[9/16] w-40 rounded-xl border border-ligne" />
      ) : avecMedia && aTraiter ? (
        <MediaSignale signalementId={avecMedia.id} />
      ) : (
        <div className="grid aspect-square w-40 place-items-center rounded-xl bg-creme text-5xl" aria-hidden>{cible.emoji}</div>
      )}
      <div className="grid content-start gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {urgent && <Badge ton="rouge"><Siren className="size-3.5" aria-hidden /> Masquée pour tous</Badge>}
          <Badge>{signalements.length} signalement{signalements.length > 1 ? "s" : ""}</Badge>
          {premier.statut !== "a-traiter" && <Badge ton={premier.statut === "retenu" ? "rouge" : "vert"}>{premier.statut === "retenu" ? (cible.remise ? "Remis par défaut" : cible.refus ? "Refusé" : premier.cible === "avis" || premier.cible === "reponse-avis" ? "Masqué" : "Retiré") : "Remis en ligne"}</Badge>}
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
        ) : premier.cible === "publication" ? (
          <p className="text-sm text-gris">Contenu introuvable ({premier.cible} n° {premier.cibleId}) : il a peut-être été supprimé.</p>
        ) : premier.cible === "avis" || premier.cible === "reponse-avis" ? (
          <AvisSignale avis={premier.avis} reponse={premier.cible === "reponse-avis"} />
        ) : premier.cible === "article-actus" && premier.article ? (
          <ApercuArticleActus article={premier.article} />
        ) : premier.cible === "reponse-actus" && premier.reponseActus ? (
          <ApercuReponseLieuActus reponse={premier.reponseActus} />
        ) : (
          <InstantaneSignale signalement={premier} lieux={lieux} />
        )}
        {cible.remise && aTraiter && (
          <p className="rounded-xl border border-ligne px-3 py-2 text-[13px]">
            Retenir remet {cible.le} par défaut : {cible.remise}. L'auteur reçoit le motif, la personne qui a signalé est prévenue. Un réexamen ne rend pas
            l'ancien nom (l'auteur peut en remettre un).
          </p>
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
              {(s.signaleParId || s.source === "lieu") && (
                <p className="mt-0.5 text-xs text-gris">
                  {s.source === "lieu" ? "Masqué par le gérant du lieu" : `Signalé par le compte n° ${s.signaleParId}`}
                  {s.signaleur && ` · ${s.signaleur.ceMois} signalement(s) ce mois-ci`}
                  {s.signaleur?.partRejets !== null && s.signaleur?.partRejets !== undefined && ` · ${s.signaleur.partRejets} % rejetés sur 12 mois (${s.signaleur.juges} jugés)`}
                </p>
              )}
            </li>
          ))}
        </ul>
        {conteste && premier.contestation && <p className="rounded-xl bg-jaune-clair px-3 py-2 text-sm"><strong>Contestation :</strong> « {premier.contestation} »</p>}
        {premier.statut !== "a-traiter" && premier.decision && <p className="text-sm"><strong>Ta note :</strong> {premier.decision}</p>}
        {premier.statut !== "a-traiter" && !conteste && <SuiteDecision signalement={premier} contenu={contenu} onChange={onDecide} />}
      </div>
      {aTraiter && (
        <div className="flex flex-col gap-2 lg:w-60">
          <Bouton variante="danger" icone={EyeOff} onClick={() => setDecision("retenu")}>{conteste ? "Maintenir la décision" : cible.remise ? "Remettre par défaut" : `Retirer ${cible.le}`}</Bouton>
          <Bouton icone={Check} onClick={() => setDecision("rejete")}>{conteste ? (cible.remise || cible.retourRelecture ? "Donner raison" : "Remettre en ligne") : urgent && !cible.remise ? "Remettre en ligne" : "Rien à redire"}</Bouton>
        </div>
      )}
      {decision && (
        <ModaleDecisionModeration
          decision={decision}
          cible={cible}
          explication={decision === "rejete" && conteste ? cible.retourRelecture : undefined}
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
