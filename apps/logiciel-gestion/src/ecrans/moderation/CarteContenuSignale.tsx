import { Check, EyeOff, Siren } from "lucide-react";
import { useState } from "react";

import { Badge } from "~/composants/interface/Badge.tsx";
import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Modale } from "~/composants/interface/Modale.tsx";
import { ZoneTexte } from "~/composants/interface/ZoneTexte.tsx";
import { RAISONS_SIGNALEMENT } from "~/contenus/raisons-signalement.ts";
import { VignetteMedia } from "~/ecrans/publications/VignetteMedia.tsx";
import { expliquerErreur } from "~/fonctions/texte/expliquer-erreur.ts";
import { formaterDate } from "~/fonctions/texte/formater-date.ts";
import { ErreurApi } from "~/services/client-gestion.ts";
import { deciderSignalement, type Signalement } from "~/services/moderation.ts";

/** Un contenu signalé (une ou plusieurs fois) : ce qu'on lui reproche, le contenu lui-même, et la décision. */
export function CarteContenuSignale({ signalements, onDecide }: { signalements: Signalement[]; onDecide: () => void }) {
  const [decision, setDecision] = useState<"retenu" | "rejete" | null>(null);
  const [note, setNote] = useState("");
  const [etat, setEtat] = useState<{ enCours: boolean; erreur: string | null }>({ enCours: false, erreur: null });
  const premier = signalements[0]!;
  const publication = premier.publication;
  const urgent = signalements.some((s) => s.urgent && s.statut === "a-traiter");
  const aTraiter = premier.statut === "a-traiter";
  const media = publication?.medias.find((m) => m.type === "affiche") ?? publication?.medias.find((m) => m.type === "photo") ?? publication?.medias[0];

  async function confirmer() {
    if (!decision) return;
    setEtat({ enCours: true, erreur: null });
    try {
      await deciderSignalement(premier.id, decision, note);
      setDecision(null);
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
          {!aTraiter && <Badge ton={premier.statut === "retenu" ? "rouge" : "vert"}>{premier.statut === "retenu" ? "Retiré" : "Remis en ligne"}</Badge>}
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
        {!aTraiter && premier.decision && <p className="text-sm"><strong>Ta note :</strong> {premier.decision}</p>}
      </div>
      {aTraiter && (
        <div className="flex flex-col gap-2 lg:w-52">
          <Bouton variante="danger" icone={EyeOff} onClick={() => setDecision("retenu")}>Retirer la publication</Bouton>
          <Bouton icone={Check} onClick={() => setDecision("rejete")}>{urgent ? "Remettre en ligne" : "Rien à redire"}</Bouton>
        </div>
      )}
      <Modale
        titre={decision === "retenu" ? "Retirer la publication ?" : "Rien à redire ?"}
        ouverte={decision !== null}
        onFermer={() => setDecision(null)}
        actions={
          <>
            <Bouton onClick={() => setDecision(null)}>Annuler</Bouton>
            <Bouton variante={decision === "retenu" ? "danger" : "principal"} chargement={etat.enCours} onClick={confirmer}>Confirmer</Bouton>
          </>
        }
      >
        <p className="mb-4">
          {decision === "retenu"
            ? "La publication est retirée du fil pour tout le monde (elle passe en « Masquée »). Les signalements encore ouverts sur elle sont réglés du même coup."
            : urgent
              ? "La publication est remise en ligne pour tout le monde. Les signalements encore ouverts sur elle sont réglés du même coup."
              : "La publication reste en ligne. Les signalements encore ouverts sur elle sont réglés du même coup."}
        </p>
        <ZoneTexte libelle="Note de décision (pour toi, facultative)" valeur={note} onChange={setNote} maximum={500} lignes={3} />
        {etat.erreur && <p role="alert" className="mt-3 text-sm font-semibold text-rouge-texte">{etat.erreur}</p>}
      </Modale>
    </article>
  );
}
