import { lireAvatarMiami } from "../../../../../packages/commun/src/validation/lire-avatar-miami.ts";
import { CIBLES_MODERATION } from "~/contenus/cibles-moderation.ts";
import { formaterDate } from "~/fonctions/texte/formater-date.ts";
import type { LieuCite, Signalement } from "~/services/moderation.ts";

type Auteur = { pseudo?: string | null; prenom?: string } | null;
const nomAuteur = (a: unknown) => {
  const auteur = a as Auteur;
  return auteur ? (auteur.pseudo ? `@${auteur.pseudo}` : auteur.prenom ?? "?") : "compte supprimé";
};
const texte = (v: unknown) => (typeof v === "string" ? v : "");
const adresseGif = (v: unknown) => {
  const url = (v as { url?: unknown } | null)?.url;
  if (typeof url !== "string") return null;
  try {
    const adresse = new URL(url);
    return adresse.protocol === "https:" && /^(?:media\d?|i)\.giphy\.com$/.test(adresse.hostname) ? adresse.href : null;
  } catch {
    return null;
  }
};
/** Un emoji tel quel, ou le nom d'un avatar Miami (« miami:toque » → « Miami Toque ») ; un Miami inconnu de cette version : « avatar Miami » */
const nomAvatar = (v: unknown) => {
  const miami = lireAvatarMiami(v);
  if (miami) return miami.reserve ? `avatar ${miami.nom}` : `avatar Miami ${miami.nom}`;
  if (texte(v).startsWith("photo:")) return "photo de profil (ci-contre)";
  return texte(v).startsWith("miami:") ? "avatar Miami" : texte(v);
};

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
  const titre = `${cible?.emoji ?? ""} ${cible ? cible.le[0]!.toUpperCase() + cible.le.slice(1) : signalement.cible}${c.cible === "image-lieu" ? "" : ` n° ${signalement.cibleId}`}`;
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
          {adresseGif(c.gif) && <img src={adresseGif(c.gif)!} alt="GIF envoyé" referrerPolicy="no-referrer" className="max-h-48 w-fit rounded-xl border border-ligne" />}
          {c.type === "gif" && !adresseGif(c.gif) && !c.illisible && <p className="text-[13px] text-gris">GIF introuvable dans l'instantané.</p>}
          {c.type === "vote" && (
            <p className="text-[13px] text-gris">
              Sondage{Array.isArray(c.lieux) && c.lieux.length > 0 ? ` · lieux proposés : ${c.lieux.map(nomLieu).join(", ")}` : " · les lieux proposés ne sont pas gardés dans l'instantané"}
            </p>
          )}
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
      {c.cible === "profil" && <p className="text-sm">{nomAvatar(c.avatar)} <strong>{c.pseudo ? `@${texte(c.pseudo)}` : "sans pseudo"}</strong> · {texte(c.prenom)}</p>}
      {c.cible === "sortie" && (
        <>
          <p className="text-sm font-semibold">{texte(c.emoji)} {texte(c.titre)}</p>
          <p className="text-[13px] text-gris">Organisée par {nomAuteur(c.organisateur)}{typeof c.quand === "string" ? ` · ${formaterDate(c.quand, true)}` : ""}{Array.isArray(c.lieux) && c.lieux.length ? ` · ${c.lieux.map(nomLieu).join(", ")}` : ""}</p>
        </>
      )}
      {c.cible === "idee" && (
        <>
          <p className="text-[13px] text-gris">Par {nomAuteur(c.auteur)} · statut « {texte(c.statut)} »{typeof c.date === "string" ? ` · ${formaterDate(c.date, true)}` : ""}</p>
          <p className="text-sm font-semibold">{texte(c.titre)}</p>
          {texte(c.detail) && <p className="rounded-xl bg-creme px-3 py-2 text-sm whitespace-pre-line">{texte(c.detail)}</p>}
        </>
      )}
      {c.cible === "comment-idee" && (
        <>
          <p className="text-[13px] text-gris">Par {nomAuteur(c.auteur)} · sous l'idée n° {String(c.ideeId)}{c.reponseA ? ` · en réponse au commentaire n° ${String(c.reponseA)}` : ""}</p>
          <p className="rounded-xl bg-creme px-3 py-2 text-sm whitespace-pre-line">{texte(c.texte)}</p>
        </>
      )}
      {c.cible === "miamis" && (
        <>
          <p className="text-sm font-semibold">{texte(c.titre)}</p>
          <p className="text-[13px] text-gris">Organisée par {nomAuteur(c.organisateur)}{typeof c.quand === "string" ? ` · ${formaterDate(c.quand, true)}` : ""} · {nomLieu(c.lieuId)}</p>
          {texte(c.description) && <p className="rounded-xl bg-creme px-3 py-2 text-sm whitespace-pre-line">{texte(c.description)}</p>}
          {Array.isArray(c.etiquettesLibres) && c.etiquettesLibres.length > 0 && <p className="text-[13px] text-gris">Étiquettes : {c.etiquettesLibres.map(texte).join(", ")}</p>}
        </>
      )}
      {c.cible === "image-lieu" && (
        <p className="text-sm">
          {c.quelle === "logo" ? "Logo" : "Bannière"} de {nomLieu(c.lieuId) || "un lieu inconnu"} · {texte((c.media as { typeMime?: unknown } | null)?.typeMime) === "image/png" ? "PNG" : "JPEG"}
        </p>
      )}
      {c.cible === "groupe" && <p className="text-sm">{texte(c.emoji)} <strong>{texte(c.titre) || "Groupe sans titre"}</strong> · créé par {nomAuteur(c.createur)}</p>}
    </div>
  );
}
