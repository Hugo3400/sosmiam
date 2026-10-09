import { Check, ExternalLink, UserX, X } from "lucide-react";
import { useState } from "react";

import { Badge } from "~/composants/interface/Badge.tsx";
import { Bouton } from "~/composants/interface/Bouton.tsx";
import { CaseACocher } from "~/composants/interface/CaseACocher.tsx";
import { PastilleEmailVerifie } from "~/composants/interface/PastilleEmailVerifie.tsx";
import { ZoneTexte } from "~/composants/interface/ZoneTexte.tsx";
import { STATUTS_LIEU } from "~/contenus/statuts-lieu.ts";
import { redigerReponseRattachement } from "~/fonctions/lieux/rediger-reponse-rattachement.ts";
import { expliquerErreur } from "~/fonctions/texte/expliquer-erreur.ts";
import { formaterDate } from "~/fonctions/texte/formater-date.ts";
import { ErreurApi } from "~/services/client-gestion.ts";
import { deciderRattachement, type Rattachement } from "~/services/rattachements.ts";
import { ouvrirLien } from "~/services/systeme.ts";

const STATUTS = { "en-attente": { libelle: "À valider", ton: "jaune" }, valide: { libelle: "Validé", ton: "vert" }, refuse: { libelle: "Refusé", ton: "neutre" }, retire: { libelle: "Retiré", ton: "neutre" } } as const;
/** « contact@lafournee.fr » et « https://www.lafournee.fr » : même domaine, un bon indice que la personne est du lieu */
const domaine = (texte: string | null) => texte?.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split(/[/@]/).at(texte.includes("@") ? -1 : 0) ?? "";

type Props = { rattachement: Rattachement; onChange: (bilan: string) => void };

/**
 * Une demande de rattachement d'un compte à son lieu (compte pro) : le lieu, la personne, sa preuve et son SIRET (avec un
 * lien vers l'Annuaire des entreprises), puis la décision et la réponse envoyée par mail.
 */
export function CarteRattachement({ rattachement: r, onChange }: Props) {
  const enAttente = r.statut === "en-attente";
  const [mode, setMode] = useState<"valider" | "refuser" | "retirer" | null>(null);
  const [reponse, setReponse] = useState("");
  const [envoyer, setEnvoyer] = useState(true);
  const [etat, setEtat] = useState<{ enCours: boolean; erreur: string | null }>({ enCours: false, erreur: null });
  const memeDomaine = Boolean(r.lieu.siteWeb) && domaine(r.compte.email) === domaine(r.lieu.siteWeb);
  const choisir = (decision: "valider" | "refuser" | "retirer") => {
    setMode(decision);
    setReponse(redigerReponseRattachement(decision, { prenom: r.compte.prenom, lieu: r.lieu.nom }));
  };

  async function decider(decision: "valider" | "refuser" | "retirer") {
    const texte = reponse.trim();
    if (envoyer && /\[[^\]]*\]/.test(texte) && !window.confirm("Il reste des [crochets] dans la réponse. L'envoyer quand même ?")) return;
    setEtat({ enCours: true, erreur: null });
    try {
      const resultat = await deciderRattachement(r.id, decision, texte || null, envoyer && Boolean(texte));
      const mail = resultat.mail === "envoye" ? " Réponse envoyée par mail ✅" : resultat.mail === "echec" ? " La réponse n'est pas partie." : "";
      onChange(`${r.compte.prenom} · ${r.lieu.nom} : ${decision === "valider" ? "validé, le lieu est vérifié ✓" : decision === "refuser" ? "demande refusée" : "accès retiré"}.${mail}`);
    } catch (probleme) {
      setEtat({ enCours: false, erreur: expliquerErreur(probleme instanceof ErreurApi ? probleme : null) });
    }
  }

  return (
    <article className="grid gap-3 rounded-carte border border-ligne bg-white p-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge ton={STATUTS[r.statut].ton}>{STATUTS[r.statut].libelle}</Badge>
        <Badge ton="contour">{r.role === "gerant" ? "Gérant" : "Équipe"}</Badge>
        <span className="ml-auto text-xs text-gris">{formaterDate(r.creeLe, true)}</span>
      </div>
      <div>
        <p className="font-titre text-xl font-extrabold">{r.lieu.emoji} {r.lieu.nom}</p>
        <p className="text-sm text-gris">{[r.lieu.adresse, r.lieu.ville].filter(Boolean).join(", ")} · fiche {STATUTS_LIEU[r.lieu.statut].libelle.toLowerCase()}{r.lieu.siteWeb ? ` · ${r.lieu.siteWeb}` : ""}</p>
      </div>
      <p className="text-sm">
        Demandé par <strong>{r.compte.prenom}</strong> · {r.compte.email} · <PastilleEmailVerifie le={r.compte.emailVerifieLe} />
        {memeDomaine && <span className="ml-1 font-semibold text-vert"> · adresse du même domaine que le site du lieu ✓</span>}
      </p>
      <dl className="grid gap-2 text-sm">
        <div><dt className="font-semibold">Ce qui prouve le lien</dt><dd className="whitespace-pre-line">{r.preuve}</dd></div>
        {r.siret && (
          <div>
            <dt className="font-semibold">SIRET</dt>
            <dd className="flex flex-wrap items-center gap-2">
              <span className="font-mono">{r.siret}</span>
              <Bouton petit variante="discret" icone={ExternalLink} onClick={() => ouvrirLien(`https://annuaire-entreprises.data.gouv.fr/etablissement/${r.siret}`)}>Vérifier sur l'Annuaire des entreprises</Bouton>
            </dd>
          </div>
        )}
        {r.reponse && !enAttente && <div><dt className="font-semibold">Réponse envoyée</dt><dd className="whitespace-pre-line text-gris">{r.reponse}</dd></div>}
      </dl>
      {mode === null && (enAttente || r.statut === "valide") && (
        <div className="flex flex-wrap gap-2">
          {enAttente && <Bouton variante="principal" icone={Check} onClick={() => choisir("valider")}>Valider…</Bouton>}
          {enAttente && <Bouton variante="danger" icone={X} onClick={() => choisir("refuser")}>Refuser…</Bouton>}
          {r.statut === "valide" && <Bouton variante="danger" icone={UserX} onClick={() => choisir("retirer")}>Retirer l'accès…</Bouton>}
        </div>
      )}
      {mode !== null && (
        <div className="grid gap-3 rounded-xl border border-ligne bg-creme p-3">
          <ZoneTexte libelle={`Réponse à ${r.compte.prenom}`} valeur={reponse} onChange={setReponse} lignes={5} maximum={1000} />
          <div className="flex flex-wrap items-center gap-3">
            <CaseACocher libelle="Envoyer cette réponse par mail" coche={envoyer} onChange={setEnvoyer} />
            <div className="ml-auto flex flex-wrap gap-2">
              <Bouton variante="discret" desactive={etat.enCours} onClick={() => setMode(null)}>Annuler</Bouton>
              <Bouton variante={mode === "valider" ? "principal" : "danger"} chargement={etat.enCours} onClick={() => decider(mode)}>
                {mode === "valider" ? "Valider (lieu vérifié ✓)" : mode === "refuser" ? "Refuser la demande" : "Retirer l'accès"}
              </Bouton>
            </div>
          </div>
        </div>
      )}
      {etat.erreur && <p role="alert" className="text-sm font-semibold text-rouge-texte">{etat.erreur}</p>}
    </article>
  );
}
