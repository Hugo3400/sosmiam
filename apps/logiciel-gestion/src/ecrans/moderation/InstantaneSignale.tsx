import { CIBLES_MODERATION } from "~/contenus/cibles-moderation.ts";
import { formaterDate } from "~/fonctions/texte/formater-date.ts";
import type { LieuCite, Signalement } from "~/services/moderation.ts";

type Auteur = { pseudo?: string | null; prenom?: string } | null;
const nomAuteur = (a: unknown) => {
  const auteur = a as Auteur;
  return auteur ? (auteur.pseudo ? `@${auteur.pseudo}` : auteur.prenom ?? "?") : "compte supprimé";
};
const texte = (v: unknown) => (typeof v === "string" ? v : "");

/**
 * Un contenu social tel qu'il était au moment du signalement (son instantané déchiffré) : jamais le contenu vivant, qui a
 * pu changer ou disparaître depuis. Les lieux cités sont relus dans la base.
 */
export function InstantaneSignale({ signalement, lieux }: { signalement: Signalement; lieux: Record<string, LieuCite> }) {
  const cible = CIBLES_MODERATION[signalement.cible];
  const i = signalement.instantane;
  const nomLieu = (id: unknown) => (typeof id === "number" && lieux[id] ? `${lieux[id]!.emoji} ${lieux[id]!.nom}` : typeof id === "number" ? `lieu n° ${id}` : "");
  if (!i) return <p className="text-sm text-gris">{cible?.emoji} {cible?.le ?? signalement.cible} n° {signalement.cibleId} : pas d'instantané enregistré.</p>;
  if (i.etat !== "lu") {
    return <p className="text-sm text-gris">Instantané {i.etat === "sans-cle" ? "illisible : la clé des données manque sur le serveur" : "illisible (clé changée)"}.</p>;
  }
  const c = i.contenu;
  const titre = `${cible?.emoji ?? ""} ${cible ? cible.le[0]!.toUpperCase() + cible.le.slice(1) : signalement.cible} n° ${signalement.cibleId}`;
  return (
    <div className="grid gap-1.5">
      <p className="font-titre text-lg font-extrabold">{titre}</p>
      {c.cible === "commentaire" && (
        <>
          <p className="text-[13px] text-gris">Par {c.commeLieu ? "le lieu (réponse du gérant)" : nomAuteur(c.auteur)} · sous la publication n° {String(c.publicationId)} de {nomLieu(c.lieuId)}{c.masqueParLieu ? " · masqué par le lieu" : ""}</p>
          <p className="rounded-xl bg-creme px-3 py-2 text-sm whitespace-pre-line">{texte(c.texte)}</p>
        </>
      )}
      {c.cible === "message" && (
        <>
          <p className="text-[13px] text-gris">
            Par {nomAuteur(c.auteur)} · {(c.conversation as { type?: string })?.type === "groupe" ? `groupe « ${texte((c.conversation as { titre?: unknown }).titre) || "sans titre"} »` : "conversation à deux"}
            {typeof c.date === "string" ? ` · ${formaterDate(c.date, true)}` : ""}
          </p>
          {c.illisible ? <p className="text-sm text-gris">Texte illisible.</p> : texte(c.texte) && <p className="rounded-xl bg-creme px-3 py-2 text-sm whitespace-pre-line">{texte(c.texte)}</p>}
          {c.lieuId !== null && c.lieuId !== undefined && <p className="text-sm">Lieu envoyé : {nomLieu(c.lieuId)}</p>}
          {c.media ? <p className="text-[13px] text-gris">Contient une {texte((c.media as { typeMime?: unknown }).typeMime).startsWith("audio") ? "note vocale" : "photo"}.</p> : null}
        </>
      )}
      {c.cible === "liste" && (
        <>
          <p className="text-[13px] text-gris">Par {nomAuteur(c.auteur)} · {texte(c.visibilite)}</p>
          <p className="text-sm font-semibold">{texte(c.emoji)} {texte(c.titre)}</p>
          {texte(c.description) && <p className="rounded-xl bg-creme px-3 py-2 text-sm whitespace-pre-line">{texte(c.description)}</p>}
          {Array.isArray(c.lieux) && c.lieux.length > 0 && <p className="text-[13px] text-gris">Lieux : {c.lieux.map(nomLieu).join(", ")}</p>}
        </>
      )}
      {c.cible === "profil" && <p className="text-sm">{texte(c.avatar)} <strong>{c.pseudo ? `@${texte(c.pseudo)}` : "sans pseudo"}</strong> · {texte(c.prenom)}</p>}
      {c.cible === "sortie" && (
        <>
          <p className="text-sm font-semibold">{texte(c.emoji)} {texte(c.titre)}</p>
          <p className="text-[13px] text-gris">Organisée par {nomAuteur(c.organisateur)}{typeof c.quand === "string" ? ` · ${formaterDate(c.quand, true)}` : ""}{Array.isArray(c.lieux) && c.lieux.length ? ` · ${c.lieux.map(nomLieu).join(", ")}` : ""}</p>
        </>
      )}
      {c.cible === "groupe" && <p className="text-sm">{texte(c.emoji)} <strong>{texte(c.titre) || "Groupe sans titre"}</strong> · créé par {nomAuteur(c.createur)}</p>}
    </div>
  );
}
