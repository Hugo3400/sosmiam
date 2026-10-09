import { useEffect, useState, type ReactNode } from "react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Carte } from "~/composants/interface/Carte.tsx";
import { Chargement } from "~/composants/interface/Chargement.tsx";
import { EtatVide } from "~/composants/interface/EtatVide.tsx";
import { MessageErreur } from "~/composants/interface/MessageErreur.tsx";
import { EnTeteEcran } from "~/composants/mise-en-page/EnTeteEcran.tsx";
import type { Ecran } from "~/contenus/menu.ts";
import { formaterNombre } from "~/fonctions/texte/formater-nombre.ts";
import { utiliserChargement } from "~/hooks/utiliser-chargement.ts";
import { lireLancementVille, listerVilles } from "~/services/villes.ts";

type Props = { allerA: (ecran: Ecran, id: number | null) => void };

/** Une étape de la liste : ✓ quand elle a de quoi, sinon « à faire » ; Hugo juge s'il en faut plus. */
function Etape({ fait, titre, children, action }: { fait: boolean; titre: string; children: ReactNode; action?: ReactNode }) {
  return (
    <Carte>
      <div className="grid gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span aria-hidden className={`grid size-6 place-items-center rounded-full text-sm font-extrabold ${fait ? "bg-vert-clair text-vert" : "bg-ligne text-gris"}`}>{fait ? "✓" : "…"}</span>
          <h3 className="font-titre text-lg font-extrabold">{titre}</h3>
          <span className="sr-only">{fait ? "fait" : "à faire"}</span>
        </div>
        <div className="text-sm">{children}</div>
        {action && <div className="flex flex-wrap gap-2">{action}</div>}
      </div>
    </Carte>
  );
}

/**
 * « Lancer une ville » : choisir une ville, voir où elle en est (fiches, places de fondateur, ambassadeurs, public à
 * prévenir), puis l'annoncer par la newsletter et une notification ciblée sur la ville.
 */
export function EcranVilles({ allerA }: Props) {
  const villes = utiliserChargement(listerVilles, []);
  const [ville, setVille] = useState<string | null>(null);
  useEffect(() => {
    if (!ville && villes.donnees?.[0]) setVille(villes.donnees[0].ville);
  }, [villes.donnees, ville]);
  const lancement = utiliserChargement(async () => (ville ? lireLancementVille(ville) : null), [ville]);
  const point = lancement.donnees;

  return (
    <>
      <EnTeteEcran titre="Villes" sousTitre="Lancer une ville : tout ce qu'il faut voir avant de l'annoncer, au même endroit. C'est toi qui décides quand c'est prêt." />
      <MessageErreur erreur={villes.erreur ?? lancement.erreur} reessayer={() => { villes.recharger(); lancement.recharger(); }} />
      {!villes.donnees && villes.chargement && <Chargement />}
      {villes.donnees?.length === 0 && <Carte><EtatVide emoji="🗺️" titre="Pas encore de ville">Les villes apparaissent ici dès qu'une fiche de lieu y est créée.</EtatVide></Carte>}
      {villes.donnees && villes.donnees.length > 0 && (
        <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
          <Carte titre="Villes" sansMarge>
            <ul className="max-h-[70vh] overflow-y-auto">
              {villes.donnees.map((v) => (
                <li key={v.ville}>
                  <button
                    type="button"
                    aria-current={v.ville === ville}
                    onClick={() => setVille(v.ville)}
                    className={`flex w-full items-baseline gap-2 border-b border-ligne/70 px-4 py-2.5 text-left text-sm last:border-0 ${v.ville === ville ? "bg-jaune-clair font-bold" : "hover:bg-creme"}`}
                  >
                    <span className="min-w-0 flex-1 truncate">{v.ville}</span>
                    <span className="chiffres text-gris">{v.enLigne} / {v.lieux}</span>
                  </button>
                </li>
              ))}
            </ul>
          </Carte>
          <div className="grid content-start gap-4">
            {!point && lancement.chargement && <Chargement />}
            {point && (
              <>
                <div>
                  <h2 className="font-titre text-2xl font-extrabold">{point.ville}</h2>
                  {point.commune && <p className="text-sm text-gris">{point.commune.nom} ({point.commune.codeDepartement}) · {formaterNombre(point.commune.population)} habitants</p>}
                </div>
                <div className="grid gap-4 xl:grid-cols-2">
                  <Etape fait={point.lieux.enLigne > 0} titre="Des lieux en ligne" action={<Bouton petit onClick={() => allerA("lieux", null)}>Voir les lieux</Bouton>}>
                    <strong>{point.lieux.enLigne}</strong> en ligne sur {point.lieux.total} fiche(s). {point.lieux.brouillons} brouillon(s), dont{" "}
                    <strong>{point.lieux.brouillonsComplets}</strong> complet(s), prêts à mettre en ligne{point.lieux.masques ? `, et ${point.lieux.masques} masqué(s)` : ""}.
                  </Etape>
                  <Etape fait={Boolean(point.fondateurs && point.fondateurs.prises > 0)} titre="Des fondateurs" action={<Bouton petit onClick={() => allerA("ambassadeurs", null)}>Voir les candidatures</Bouton>}>
                    {point.fondateurs
                      ? <><strong>{point.fondateurs.prises}</strong> sur {point.fondateurs.places} place(s) de fondateur {point.fondateurs.type === "ville" ? `de ${point.fondateurs.zone}` : `du département (${point.fondateurs.zone})`}.</>
                      : "Zone de fondateurs introuvable pour ce nom de ville."}
                  </Etape>
                  <Etape
                    fait={Boolean(point.ambassadeurs.ambassadeurDeVille)}
                    titre="Un ambassadeur de ville"
                    action={point.ambassadeurs.ambassadeurDeVille && <Bouton petit onClick={() => allerA("ambassadeurs", point.ambassadeurs.ambassadeurDeVille!.id)}>Ouvrir sa fiche</Bouton>}
                  >
                    {point.ambassadeurs.ambassadeurDeVille ? <><strong>{point.ambassadeurs.ambassadeurDeVille.prenom}</strong> est ambassadeur de ville.</> : "Pas encore nommé (parmi les fondateurs de la ville)."}{" "}
                    {point.ambassadeurs.actifs} ambassadeur(s) actif(s){point.ambassadeurs.enAttente ? `, ${point.ambassadeurs.enAttente} inscription(s) à valider` : ""}.
                  </Etape>
                  <Etape fait={(point.public.inscrits ?? 0) + point.public.appareils > 0} titre="Du monde à prévenir">
                    <strong>{point.public.inscrits ?? "?"}</strong> inscrit(s) à la newsletter dans la ville{point.public.inscrits === null ? " (liste pas lisible sur le serveur)" : ""}, et{" "}
                    <strong>{point.public.appareils}</strong> téléphone(s) avec les notifications, réglés sur cette ville.
                  </Etape>
                </div>
                <Etape
                  fait={false}
                  titre="L'annoncer"
                  action={
                    <>
                      <Bouton variante="principal" onClick={() => allerA("newsletter", null)}>Écrire la newsletter</Bouton>
                      <Bouton onClick={() => allerA("notifications", null)}>Préparer la notification</Bouton>
                    </>
                  }
                >
                  Quand tout te va : une newsletter aux inscrits de {point.ville} (Newsletter → « Envoyer… », ville « {point.ville} »), et une notification
                  ciblée sur la ville (Notifications → ville « {point.ville} »).
                </Etape>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
