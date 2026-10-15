import { Ban, Unlock } from "lucide-react";
import { useState } from "react";

import { Badge } from "~/composants/interface/Badge.tsx";
import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Modale } from "~/composants/interface/Modale.tsx";
import { ZoneTexte } from "~/composants/interface/ZoneTexte.tsx";
import { MOTIFS_MODERATION } from "~/contenus/motifs-moderation.ts";
import { expliquerErreur } from "~/fonctions/texte/expliquer-erreur.ts";
import { formaterDate } from "~/fonctions/texte/formater-date.ts";
import { utiliserChargement } from "~/hooks/utiliser-chargement.ts";
import { ErreurApi } from "~/services/client-gestion.ts";
import { leverLimitation, lireLimitationsCompte, type Limitation } from "~/services/limitations.ts";
import { ModaleLimiterCompte } from "./ModaleLimiterCompte.tsx";

const jusqua = (l: Limitation) => (l.fin ? `jusqu'au ${formaterDate(l.fin, true)}` : "jusqu'à nouvel ordre");

/** Dans la fiche d'un compte : la limitation en vigueur (la lever), l'historique, et « Limiter ce compte ». */
export function LimitationCompte({ compteId, prenom, onChange }: { compteId: number; prenom: string; onChange: () => void }) {
  const { donnees, erreur, recharger } = utiliserChargement(() => lireLimitationsCompte(compteId), [compteId]);
  const [limiter, setLimiter] = useState(false);
  const [lever, setLever] = useState<Limitation | null>(null);
  const [message, setMessage] = useState("");
  const [etat, setEtat] = useState<{ enCours: boolean; erreur: string | null }>({ enCours: false, erreur: null });
  const apres = () => (recharger(), onChange());

  async function confirmerLevee(l: Limitation) {
    setEtat({ enCours: true, erreur: null });
    try {
      await leverLimitation(l.id, message.trim());
      setLever(null);
      setEtat({ enCours: false, erreur: null });
      apres();
    } catch (probleme) {
      setEtat({ enCours: false, erreur: expliquerErreur(probleme instanceof ErreurApi ? probleme : null) });
    }
  }

  if (erreur?.code === "indisponible") return null;
  const enVigueur = donnees?.enVigueur ?? null;
  const passees = donnees?.toutes.filter((l) => l.id !== enVigueur?.id) ?? [];
  return (
    <section className="grid gap-2">
      <h3 className="font-extrabold">Limitation</h3>
      {enVigueur ? (
        <div className="grid gap-1.5 rounded-xl border-2 border-tomate px-3 py-2 text-sm">
          <p className="flex flex-wrap items-center gap-2">
            <Badge ton="rouge">{Date.parse(enVigueur.debut) > Date.now() ? "Va être limité" : "Limité"}</Badge>
            <span>depuis le {formaterDate(enVigueur.debut, true)}, {jusqua(enVigueur)}</span>
          </p>
          <p><strong>Règle :</strong> {MOTIFS_MODERATION[enVigueur.motif]?.libelle ?? enVigueur.motif}</p>
          <p><strong>Pourquoi :</strong> {enVigueur.motivation}</p>
          {enVigueur.contestation && <p className="rounded-lg bg-jaune-clair px-2 py-1"><strong>Contestation du {formaterDate(enVigueur.contesteLe!)} :</strong> « {enVigueur.contestation} »{enVigueur.reexamineLe ? ` · réexaminée le ${formaterDate(enVigueur.reexamineLe)}` : ""}</p>}
          <div><Bouton petit icone={Unlock} onClick={() => (setMessage(""), setLever(enVigueur))}>Lever la limitation</Bouton></div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3 text-sm text-gris">
          <span>Aucune limitation en cours.</span>
          <Bouton petit variante="danger" icone={Ban} onClick={() => setLimiter(true)}>Limiter ce compte</Bouton>
        </div>
      )}
      {passees.length > 0 && (
        <ul className="grid gap-1 text-[13px] text-gris">
          {passees.map((l) => (
            <li key={l.id}>
              {formaterDate(l.debut)} → {l.leveeLe ? `levée le ${formaterDate(l.leveeLe)}` : l.fin ? formaterDate(l.fin) : "sans fin"} · {MOTIFS_MODERATION[l.motif]?.libelle ?? l.motif}
              {l.contesteLe ? " · contestée" : ""}
            </li>
          ))}
        </ul>
      )}
      {limiter && <ModaleLimiterCompte compteId={compteId} prenom={prenom} onFermer={() => setLimiter(false)} onLimite={() => (setLimiter(false), apres())} />}
      {lever && (
        <Modale
          titre="Lever la limitation ?"
          ouverte
          onFermer={() => setLever(null)}
          actions={<><Bouton onClick={() => setLever(null)}>Annuler</Bouton><Bouton variante="principal" chargement={etat.enCours} onClick={() => confirmerLevee(lever)}>Lever</Bouton></>}
        >
          <div className="grid gap-3">
            <p className="text-sm">Tout remarche tout de suite pour {prenom}, qui reçoit un mail.</p>
            <ZoneTexte libelle="Un mot pour la personne (facultatif, dans le mail)" valeur={message} onChange={setMessage} maximum={1000} lignes={2} />
            {etat.erreur && <p role="alert" className="text-sm font-semibold text-rouge-texte">{etat.erreur}</p>}
          </div>
        </Modale>
      )}
    </section>
  );
}
