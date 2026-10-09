import { Check, ChevronRight, Copy, Mail, Search, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "~/composants/interface/Badge.tsx";
import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Carte } from "~/composants/interface/Carte.tsx";
import { CaseACocher } from "~/composants/interface/CaseACocher.tsx";
import { Champ } from "~/composants/interface/Champ.tsx";
import { Chargement } from "~/composants/interface/Chargement.tsx";
import { EtatVide } from "~/composants/interface/EtatVide.tsx";
import { MessageErreur } from "~/composants/interface/MessageErreur.tsx";
import { Onglets } from "~/composants/interface/Onglets.tsx";
import { Selecteur } from "~/composants/interface/Selecteur.tsx";
import { PastilleEmailVerifie } from "~/composants/interface/PastilleEmailVerifie.tsx";
import { PALIERS, STATUTS_AMBASSADEUR } from "~/contenus/ambassadeurs.ts";
import { creerLienCourrielGroupe, LONGUEUR_MAX_MAILTO } from "~/fonctions/texte/creer-lien-courriel-groupe.ts";
import { expliquerErreur } from "~/fonctions/texte/expliquer-erreur.ts";
import { formaterDate } from "~/fonctions/texte/formater-date.ts";
import { formaterDateRelative } from "~/fonctions/texte/formater-date-relative.ts";
import { formaterNombre } from "~/fonctions/texte/formater-nombre.ts";
import { utiliserChargement } from "~/hooks/utiliser-chargement.ts";
import { deciderAmbassadeur, listerAmbassadeurs, type Palier, type ResumeAmbassadeur, type StatutAmbassadeur } from "~/services/ambassadeurs.ts";
import { ErreurApi } from "~/services/client-gestion.ts";
import { copier, ouvrirLien } from "~/services/systeme.ts";

type FiltreStatut = StatutAmbassadeur | "tous";

/** Les comptes de l'espace ambassadeur : inscriptions à valider, actifs, suspendus, refusés. */
type Props = { onOuvrirCompte: (compteId: number) => void; tour: number; onDecision: () => void };

export function ListeComptes({ onOuvrirCompte, tour, onDecision }: Props) {
  const [statut, setStatut] = useState<FiltreStatut>("en-attente");
  const [palier, setPalier] = useState<Palier | "">("");
  const [saisie, setSaisie] = useState("");
  const [recherche, setRecherche] = useState("");
  const [bientotRetires, setBientotRetires] = useState(false);
  const [message, setMessage] = useState<{ texte: string; ton: "vert" | "rouge" } | null>(null);
  const { donnees, erreur, chargement, recharger } = utiliserChargement(
    () => listerAmbassadeurs({ statut: statut === "tous" ? "" : statut, palier, recherche }),
    [statut, palier, recherche, tour],
  );
  useEffect(() => {
    const minuteur = setTimeout(() => setRecherche(saisie.trim()), 300);
    return () => clearTimeout(minuteur);
  }, [saisie]);

  const liste = (donnees?.ambassadeurs ?? []).filter((a) => !bientotRetires || a.bientotRetire);
  const adresses = liste.map((a) => a.email);
  const compteurs = donnees?.compteurs ?? {};

  async function decider(ambassadeur: ResumeAmbassadeur, decision: "actif" | "refuse") {
    if (decision === "refuse" && !window.confirm(`Refuser l'inscription de ${ambassadeur.prenom} ? L'espace lui reste fermé, et son compte (créé pour cette inscription) est effacé 30 jours après.`)) return;
    try {
      const { bienvenue } = await deciderAmbassadeur(ambassadeur.id, decision);
      const texte = decision === "refuse"
        ? `Inscription de ${ambassadeur.prenom} refusée.`
        : bienvenue
          ? `C'est validé pour ${ambassadeur.prenom} ✅ Son mail de bienvenue part tout seul.`
          : `C'est validé pour ${ambassadeur.prenom} ✅ (l'envoi des mails n'est pas réglé : pas de mail de bienvenue).`;
      setMessage({ texte, ton: "vert" });
      recharger();
      onDecision();
    } catch (probleme) {
      setMessage({ texte: expliquerErreur(probleme instanceof ErreurApi ? probleme : null), ton: "rouge" });
    }
  }

  function ecrireATous() {
    const lien = creerLienCourrielGroupe(adresses, "Des nouvelles de SOS Miam 🛟");
    if (lien.length <= LONGUEUR_MAX_MAILTO) return void ouvrirLien(lien);
    void copier(adresses.join(", ")).then(() => setMessage({ texte: `Trop d'adresses pour un lien : les ${adresses.length} sont copiées, colle-les en copie cachée (Cci).`, ton: "vert" }));
  }

  return (
    <Carte
      sansMarge
      titre={`Comptes${donnees ? ` (${liste.length})` : ""}`}
      actions={
        adresses.length > 0 && (
          <>
            <Bouton petit icone={Copy} onClick={() => copier(adresses.join(", ")).then(() => setMessage({ texte: `${adresses.length} adresse(s) copiée(s) : colle-les en copie cachée (Cci).`, ton: "vert" }))}>
              Copier les adresses
            </Bouton>
            <Bouton petit icone={Mail} onClick={ecrireATous}>Écrire à cette liste</Bouton>
          </>
        )
      }
    >
      <div className="grid gap-3 border-b border-ligne px-5 py-4">
        <Onglets
          libelle="Statut"
          valeur={statut}
          onChange={setStatut}
          options={[
            { valeur: "en-attente", libelle: "À valider", compteur: compteurs["en-attente"] },
            { valeur: "actif", libelle: "Actifs", compteur: compteurs.actif },
            { valeur: "suspendu", libelle: "Suspendus", compteur: compteurs.suspendu },
            { valeur: "refuse", libelle: "Refusés" },
            { valeur: "tous", libelle: "Tous" },
          ]}
        />
        <div className="flex flex-wrap items-end gap-4">
          <Champ libelle={<span className="inline-flex items-center gap-1"><Search className="size-3.5" aria-hidden /> Recherche</span>} valeur={saisie} onChange={setSaisie} placeholder="Prénom, adresse ou quartier" className="w-72" />
          <Selecteur
            libelle="Palier"
            valeur={palier}
            onChange={setPalier}
            options={[{ valeur: "", libelle: "Tous les paliers" }, ...Object.entries(PALIERS).map(([cle, p]) => ({ valeur: cle as Palier, libelle: `${p.emoji} ${p.nom}` }))]}
            className="w-60"
          />
          <div className="pb-1.5"><CaseACocher libelle="Seulement ceux retirés bientôt" coche={bientotRetires} onChange={setBientotRetires} /></div>
        </div>
        {!!donnees?.bientotRetires && !bientotRetires && (
          <p className="rounded-xl bg-jaune-clair px-3 py-2 text-sm font-semibold">
            ⏳ {donnees.bientotRetires} ambassadeur{donnees.bientotRetires > 1 ? "s perdront" : " perdra"} {donnees.bientotRetires > 1 ? "leur" : "son"} rôle dans moins de 30 jours faute de visite
            (règle : 1 an sans connexion ; le compte, lui, n'est effacé qu'après 2 ans). Un mail les prévient tout seul, une fois.
          </p>
        )}
      </div>
      {message && <p role="status" className={`border-b border-ligne px-5 py-2 text-sm font-semibold ${message.ton === "vert" ? "text-vert" : "text-rouge-texte"}`}>{message.texte}</p>}
      <div className="px-5 pt-3"><MessageErreur erreur={erreur} reessayer={recharger} /></div>
      {!donnees && chargement && <Chargement />}
      {donnees && liste.length === 0 && (
        <EtatVide emoji={statut === "en-attente" ? "🙌" : "🔍"} titre={statut === "en-attente" ? "Personne n'attend ta validation" : "Aucun compte ici"}>
          {statut === "en-attente" ? "Les inscriptions de l'espace ambassadeur arriveront ici : tu reçois une notification à chaque nouvelle." : "Change les filtres pour voir d'autres comptes."}
        </EtatVide>
      )}
      {liste.length > 0 && (
        <ul>
          {liste.map((ambassadeur) => {
            const etat = ambassadeur.ambassadeur ? STATUTS_AMBASSADEUR[ambassadeur.ambassadeur.statut] : null;
            const p = PALIERS[ambassadeur.palier];
            return (
              <li key={ambassadeur.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-ligne/70 px-5 py-3 text-sm last:border-0">
                <button type="button" onClick={() => onOuvrirCompte(ambassadeur.id)} className="min-w-0 flex-1 text-left">
                  <span className="block truncate font-semibold hover:underline">{ambassadeur.prenom}</span>
                  <span className="block truncate text-gris">{ambassadeur.email} · <PastilleEmailVerifie le={ambassadeur.emailVerifieLe} /></span>
                </button>
                <span className="w-44 truncate text-gris">{[ambassadeur.ambassadeur?.quartier, ambassadeur.ambassadeur?.ville].filter(Boolean).join(", ") || "—"}</span>
                <span className="w-48 truncate" title={p?.nom}>{p ? `${p.emoji} ${p.nom}` : ambassadeur.palier}</span>
                <span className="chiffres w-20 text-right font-semibold">{formaterNombre(ambassadeur.points)} pts</span>
                <span className="w-44 whitespace-nowrap text-gris" title={`Inscrit le ${formaterDate(ambassadeur.creeLe)}`}>
                  {ambassadeur.bientotRetire ? <Badge ton="rouge">Retiré le {formaterDate(ambassadeur.retireLe)}</Badge> : formaterDateRelative(ambassadeur.derniereConnexion)}
                </span>
                {etat && <span className="w-24"><Badge ton={etat.ton}>{etat.libelle}</Badge></span>}
                <span className="flex w-36 justify-end gap-1">
                  {ambassadeur.ambassadeur?.statut === "en-attente" && (
                    <>
                      <Bouton petit variante="principal" icone={Check} onClick={() => decider(ambassadeur, "actif")}>Valider</Bouton>
                      <Bouton petit variante="danger" icone={X} titre={`Refuser ${ambassadeur.prenom}`} onClick={() => decider(ambassadeur, "refuse")} />
                    </>
                  )}
                  <Bouton petit variante="discret" icone={ChevronRight} titre={`Ouvrir la fiche de ${ambassadeur.prenom}`} onClick={() => onOuvrirCompte(ambassadeur.id)} />
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Carte>
  );
}
