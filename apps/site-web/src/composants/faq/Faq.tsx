import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigationType } from "react-router";

import { OngletsFaq } from "~/composants/faq/OngletsFaq";
import { Question } from "~/composants/faq/Question";
import { RechercheFaq } from "~/composants/faq/RechercheFaq";
import { Bouton } from "~/composants/interface/Bouton";
import type { OngletFaq } from "~/contenus/faq/type-faq";
import { defilerVersElement } from "~/fonctions/navigation/defiler-vers-element";
import { convertirBlocsEnTexte } from "~/fonctions/texte/convertir-blocs-en-texte";
import { normaliserRecherche } from "~/fonctions/texte/normaliser-recherche";
import type { EtatAncre } from "~/hooks/utiliser-ancres-sans-diese";

/** La FAQ complète : onglets par thème, recherche dans toutes les questions, liens directs vers une question (/faq#faq-prix). */
export function Faq({ onglets }: { onglets: OngletFaq[] }) {
  const [actif, setActif] = useState(onglets[0].cle);
  const [recherche, setRecherche] = useState("");
  const [ancre, setAncre] = useState<{ id: string; defiler: boolean } | null>(null);
  const location = useLocation();
  const typeNavigation = useNavigationType();
  const ancreDemandee = (location.state as EtatAncre | null)?.ancre;

  // Texte de chaque question, sans accents ni majuscules (« sete » trouve « Sète »)
  const textes = useMemo(() => new Map(onglets.flatMap((onglet) => onglet.questions).map((q) => [
    q.id, normaliserRecherche(`${q.question} ${convertirBlocsEnTexte(q.reponse)} ${(q.motsCles ?? []).join(" ")}`),
  ])), [onglets]);

  const mots = normaliserRecherche(recherche).split(/\s+/).filter(Boolean);
  const enRecherche = mots.length > 0;
  const trouvees = new Set(enRecherche
    ? [...textes].filter(([, texte]) => mots.every((mot) => texte.includes(mot))).map(([id]) => id)
    : []);

  // En recherche, une seule réponse trouvée : on l'ouvre directement
  const seule = trouvees.size === 1 ? [...trouvees][0] : null;
  useEffect(() => {
    if (seule) ouvrirQuestion(seule, false);
  }, [seule]);

  // Lien vers une question (voir utiliserAncresSansDiese) : on choisit son onglet, puis on l'ouvre une fois l'onglet affiché
  useEffect(() => {
    const onglet = onglets.find((o) => o.questions.some((q) => q.id === ancreDemandee));
    if (!onglet || !ancreDemandee) return;
    setRecherche("");
    setActif(onglet.cle);
    // Au retour arrière (POP), on retrouve l'onglet et la question, sans forcer le défilement
    setAncre({ id: ancreDemandee, defiler: typeNavigation !== "POP" });
  }, [ancreDemandee, location.key, onglets, typeNavigation]);

  useEffect(() => {
    if (!ancre) return;
    ouvrirQuestion(ancre.id, ancre.defiler);
    setAncre(null);
  }, [ancre]);

  function choisirOnglet(cle: string) {
    setRecherche("");
    setActif(cle);
  }

  return (
    <>
      <RechercheFaq valeur={recherche} onChange={setRecherche} />
      <OngletsFaq onglets={onglets} actif={actif} attenues={enRecherche} onChoisir={choisirOnglet} />

      {/* Grille : l'espace entre les thèmes n'apparaît qu'entre ceux qui sont affichés */}
      <div className="grid gap-8">
        {onglets.map((onglet) => {
          const nombre = onglet.questions.filter((q) => trouvees.has(q.id)).length;
          const visible = enRecherche ? nombre > 0 : onglet.cle === actif;
          return (
            <div key={onglet.cle} id={`faq-panneau-${onglet.cle}`} hidden={!visible}
              role={enRecherche ? undefined : "tabpanel"} aria-labelledby={enRecherche ? undefined : `faq-onglet-${onglet.cle}`}>
              {enRecherche && <h2 className="mb-3 text-[1.15rem] font-extrabold">{onglet.emoji} {onglet.titreGroupe}</h2>}
              {onglet.questions.map((q) => <Question key={q.id} question={q} cachee={enRecherche && !trouvees.has(q.id)} />)}
            </div>
          );
        })}
      </div>

      {enRecherche && trouvees.size === 0 && (
        <p className="mt-2 text-center text-gris">Rien trouvé pour « {recherche.trim()} ». Pose-nous ta question juste en dessous 👇</p>
      )}
      <p className="sr-only" role="status" aria-live="polite">
        {enRecherche && (trouvees.size
          ? `${trouvees.size} question${trouvees.size > 1 ? "s" : ""} trouvée${trouvees.size > 1 ? "s" : ""}`
          : "Aucune question trouvée")}
      </p>

      <div className="mt-9 flex flex-wrap items-center justify-between gap-4 rounded-carte border-2 border-dashed border-encre bg-white px-6 py-5">
        <p className="flex-[1_1_280px]"><strong>Pas trouvé ta réponse ?</strong> Pose-nous ta question, on lit tous les messages.</p>
        <Bouton href="mailto:bonjour@sosmiam.fr">Écris-nous</Bouton>
      </div>
    </>
  );
}

function ouvrirQuestion(id: string, defiler: boolean) {
  const question = document.getElementById(id);
  if (!(question instanceof HTMLDetailsElement)) return;
  question.open = true;
  if (defiler) defilerVersElement(id);
}
