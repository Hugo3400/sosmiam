import type { AvisDecide } from "~/services/moderation.ts";

/** Un avis (ou la réponse d'un lieu) masqué à la relecture, tel qu'il est en base : pour juger une contestation. */
export function AvisSignale({ avis, reponse }: { avis: AvisDecide | null | undefined; reponse: boolean }) {
  if (!avis) return <p className="text-sm text-gris">Avis introuvable : il a peut-être été supprimé avec le compte de son auteur.</p>;
  return (
    <div className="grid gap-1.5">
      <p className="font-titre text-lg font-extrabold">{avis.lieu.emoji} {avis.lieu.nom}</p>
      <p className="text-[13px] text-gris">Avis n° {avis.id} · {avis.note}/5 · {avis.signature}{avis.statut === "masque" ? " · masqué" : ""}</p>
      <p className={`rounded-xl bg-creme px-3 py-2 text-sm whitespace-pre-line ${reponse ? "text-gris" : ""}`}>{avis.texte}</p>
      {reponse && avis.reponseTexte && (
        <p className="rounded-xl border border-ligne px-3 py-2 text-sm whitespace-pre-line"><strong>Réponse du lieu{avis.reponseStatut === "masquee" ? " (masquée)" : ""} :</strong> {avis.reponseTexte}</p>
      )}
    </div>
  );
}
