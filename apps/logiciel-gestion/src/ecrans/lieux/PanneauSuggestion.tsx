import { Check, X } from "lucide-react";
import { useState } from "react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import { CaseACocher } from "~/composants/interface/CaseACocher.tsx";
import { ZoneTexte } from "~/composants/interface/ZoneTexte.tsx";
import { LIBELLES_CHAMPS_LIEU, SOURCES_SUGGESTION } from "~/contenus/champs-lieu.ts";
import { formaterValeurLieu } from "~/fonctions/lieux/formater-valeur-lieu.ts";
import { redigerReponseSuggestion } from "~/fonctions/lieux/rediger-reponse-suggestion.ts";
import { expliquerErreur } from "~/fonctions/texte/expliquer-erreur.ts";
import { formaterDateRelative } from "~/fonctions/texte/formater-date-relative.ts";
import { ErreurApi } from "~/services/client-gestion.ts";
import { deciderSuggestion, type Suggestion } from "~/services/suggestions.ts";

type Props = { suggestion: Suggestion; maintenant: Record<string, unknown>; onDecision: (bilan: string) => void };

const pareil = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

/**
 * Une modification proposée pour cette fiche : pour chaque champ, la valeur quand la personne l'a proposée (avant), celle
 * de la fiche aujourd'hui (maintenant) et la proposition. On coche ce qu'on garde, on relit la réponse, et c'est appliqué.
 */
export function PanneauSuggestion({ suggestion, maintenant, onDecision }: Props) {
  const champs = Object.keys(LIBELLES_CHAMPS_LIEU).filter((champ) => champ in suggestion.proposition);
  const autres = Object.keys(suggestion.proposition).filter((champ) => !(champ in LIBELLES_CHAMPS_LIEU));
  const [coches, setCoches] = useState(() => new Set(champs.filter((champ) => !pareil(suggestion.proposition[champ], maintenant[champ]))));
  const [reponseModifiee, setReponseModifiee] = useState<string | null>(null);
  const [envoyer, setEnvoyer] = useState(Boolean(suggestion.compte));
  const [etat, setEtat] = useState<{ enCours: boolean; erreur: string | null }>({ enCours: false, erreur: null });
  const prenom = suggestion.compte?.prenom ?? null;
  const appliques = champs.filter((champ) => coches.has(champ));
  const reponse = reponseModifiee ?? redigerReponseSuggestion({ prenom, lieu: suggestion.lieu.nom, champsAppliques: appliques.map((c) => LIBELLES_CHAMPS_LIEU[c] ?? c), total: champs.length });

  async function decider(garder: string[]) {
    const texte = reponse.trim();
    if (envoyer && /\[[^\]]*\]/.test(texte) && !window.confirm("Il reste des [crochets] dans la réponse. L'envoyer quand même ?")) return;
    if (garder.length === 0 && !window.confirm("Refuser cette modification ? La fiche ne change pas.")) return;
    setEtat({ enCours: true, erreur: null });
    try {
      const resultat = await deciderSuggestion(suggestion.id, garder, texte || null, envoyer && Boolean(texte));
      const mail = resultat.mail === "envoye" ? " Réponse envoyée par mail ✅" : resultat.mail === "echec" ? " La réponse n'est pas partie (regarde Newsletter → Envois)." : "";
      onDecision(`${garder.length === 0 ? "Modification refusée." : `${garder.length} champ(s) appliqué(s) à la fiche.`}${mail}`);
    } catch (probleme) {
      const erreur = probleme instanceof ErreurApi ? probleme : null;
      setEtat({ enCours: false, erreur: erreur?.champ && erreur.champ !== "champs" ? `La valeur proposée pour « ${LIBELLES_CHAMPS_LIEU[erreur.champ] ?? erreur.champ} » ne passe pas : décoche-la, ou corrige la fiche à la main.` : expliquerErreur(erreur) });
    }
  }

  return (
    <section className="grid gap-4 rounded-carte border-2 border-encre bg-jaune-clair p-5" aria-label="Modification proposée">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="font-titre text-xl font-extrabold">✏️ Modification proposée par {prenom ?? "quelqu'un"}</h2>
        <span className="text-sm text-gris">{SOURCES_SUGGESTION[suggestion.source] ?? suggestion.source} · {formaterDateRelative(suggestion.creeLe)}</span>
      </div>
      {suggestion.message && <p className="rounded-xl bg-white px-4 py-2 text-sm whitespace-pre-line">« {suggestion.message} »</p>}
      <div className="overflow-x-auto rounded-xl border border-ligne bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-ligne text-left text-gris">
            <tr>
              <th className="px-3 py-2 font-semibold"><span className="sr-only">Garder</span></th>
              <th className="px-3 py-2 font-semibold">Champ</th>
              <th className="px-3 py-2 font-semibold">Avant</th>
              <th className="px-3 py-2 font-semibold">Maintenant</th>
              <th className="px-3 py-2 font-semibold">Proposé</th>
            </tr>
          </thead>
          <tbody>
            {champs.map((champ) => {
              const changeDepuis = !pareil(suggestion.avant[champ], maintenant[champ]);
              return (
                <tr key={champ} className="border-b border-ligne/70 align-top last:border-0">
                  <td className="px-3 py-2">
                    <CaseACocher
                      libelle={<span className="sr-only">Garder {LIBELLES_CHAMPS_LIEU[champ]}</span>}
                      coche={coches.has(champ)}
                      onChange={(coche) => setCoches((avant) => { const suivant = new Set(avant); if (coche) suivant.add(champ); else suivant.delete(champ); return suivant; })}
                    />
                  </td>
                  <td className="px-3 py-2 font-semibold">{LIBELLES_CHAMPS_LIEU[champ]}</td>
                  <td className="px-3 py-2 whitespace-pre-line text-gris">{formaterValeurLieu(champ, suggestion.avant[champ])}</td>
                  <td className="px-3 py-2 whitespace-pre-line">
                    {formaterValeurLieu(champ, maintenant[champ])}
                    {changeDepuis && <span className="mt-1 block text-[12px] font-semibold text-rouge-texte">a changé depuis la suggestion</span>}
                  </td>
                  <td className="px-3 py-2 font-semibold whitespace-pre-line">{formaterValeurLieu(champ, suggestion.proposition[champ])}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {autres.length > 0 && <p className="text-[13px] text-gris">Non modifiable par une suggestion (ignoré) : {autres.join(", ")}.</p>}
      {coches.has("adresse") && !coches.has("latitude") && <p className="text-[13px] font-semibold">📍 L'adresse change : pense à vérifier la position sur la carte, plus bas dans la fiche.</p>}
      <ZoneTexte libelle={`Réponse à ${prenom ?? "la personne"}`} valeur={reponse} onChange={setReponseModifiee} lignes={6} maximum={1000} />
      <div className="flex flex-wrap items-center gap-3">
        <CaseACocher libelle={suggestion.compte ? `Envoyer cette réponse par mail (${suggestion.compte.email})` : "Pas de compte relié : pas de mail possible"} coche={envoyer && Boolean(suggestion.compte)} onChange={setEnvoyer} />
        <div className="ml-auto flex flex-wrap gap-2">
          <Bouton variante="danger" icone={X} desactive={etat.enCours} onClick={() => decider([])}>Refuser</Bouton>
          <Bouton variante="principal" icone={Check} chargement={etat.enCours} desactive={appliques.length === 0} onClick={() => decider(appliques)}>
            Appliquer {appliques.length} champ{appliques.length > 1 ? "s" : ""}
          </Bouton>
        </div>
      </div>
      {etat.erreur && <p role="alert" className="text-sm font-semibold text-rouge-texte">{etat.erreur}</p>}
    </section>
  );
}
