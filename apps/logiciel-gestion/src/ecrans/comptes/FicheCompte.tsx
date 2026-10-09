import { Download, KeyRound, LogOut, Trash2 } from "lucide-react";
import { useState } from "react";

import { Badge } from "~/composants/interface/Badge.tsx";
import { Bouton } from "~/composants/interface/Bouton.tsx";
import { BoutonEcrireMail } from "~/composants/interface/BoutonEcrireMail.tsx";
import { BoutonReponseType } from "~/composants/interface/BoutonReponseType.tsx";
import { Chargement } from "~/composants/interface/Chargement.tsx";
import { MessageErreur } from "~/composants/interface/MessageErreur.tsx";
import { Modale } from "~/composants/interface/Modale.tsx";
import { PastilleEmailVerifie } from "~/composants/interface/PastilleEmailVerifie.tsx";
import { BADGES, PALIERS, RAISONS_POINTS, STATUTS_AMBASSADEUR } from "~/contenus/ambassadeurs.ts";
import { expliquerErreur } from "~/fonctions/texte/expliquer-erreur.ts";
import { formaterDate } from "~/fonctions/texte/formater-date.ts";
import { formaterDateRelative } from "~/fonctions/texte/formater-date-relative.ts";
import { formaterNombre } from "~/fonctions/texte/formater-nombre.ts";
import { utiliserChargement } from "~/hooks/utiliser-chargement.ts";
import { ErreurApi } from "~/services/client-gestion.ts";
import { deconnecterCompte, exporterDonneesCompte, lireCompte, reinitialiserMotDePasseCompte, supprimerCompte } from "~/services/comptes.ts";
import { copier, enregistrerFichier } from "~/services/systeme.ts";

const SUPPORTS: Record<string, string> = { site: "Site", app: "App" };

/** Un compte SOS Miam : qui, ses rôles, ses connexions, et ce que l'équipe peut faire (sur demande de la personne surtout). */
export function FicheCompte({ id, onFermer, onChange }: { id: number; onFermer: () => void; onChange: () => void }) {
  const { donnees: compte, erreur, chargement, recharger } = utiliserChargement(() => lireCompte(id), [id]);
  const [etat, setEtat] = useState<{ enCours: boolean; texte: string | null; lien: string | null }>({ enCours: false, texte: null, lien: null });

  async function agir(action: () => Promise<string | void>) {
    setEtat({ enCours: true, texte: null, lien: null });
    try {
      const texte = await action();
      setEtat((avant) => ({ ...avant, enCours: false, texte: texte ?? null }));
    } catch (probleme) {
      setEtat({ enCours: false, texte: expliquerErreur(probleme instanceof ErreurApi ? probleme : null), lien: null });
    }
  }

  const palier = compte ? PALIERS[compte.palier] : null;
  const role = compte?.ambassadeur ? STATUTS_AMBASSADEUR[compte.ambassadeur.statut] : null;

  return (
    <Modale large titre={compte ? `${compte.prenom} · compte n° ${compte.id}` : "Compte"} ouverte onFermer={onFermer}>
      <MessageErreur erreur={erreur} reessayer={recharger} />
      {!compte && chargement && <Chargement />}
      {compte && (
        <div className="grid gap-6">
          <div className="flex flex-wrap items-center gap-2">
            {role ? <Badge ton={role.ton}>Ambassadeur · {role.libelle}</Badge> : <Badge>Sans rôle</Badge>}
            {palier && <Badge ton="jaune">{palier.emoji} {palier.nom}</Badge>}
            <Badge ton="encre">{formaterNombre(compte.points)} points</Badge>
            {compte.badges.map((b) => <Badge key={b.badge}>{BADGES[b.badge] ?? b.badge}</Badge>)}
          </div>
          <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 text-sm md:grid-cols-[auto_minmax(0,1fr)_auto_minmax(0,1fr)]">
            <dt className="text-gris">Adresse</dt><dd className="truncate">{compte.email} · <PastilleEmailVerifie le={compte.emailVerifieLe} /></dd>
            <dt className="text-gris">Créé</dt><dd>{formaterDate(compte.creeLe)}</dd>
            <dt className="text-gris">Dernière visite</dt><dd>{formaterDateRelative(compte.derniereConnexion)}</dd>
            <dt className="text-gris">Conditions</dt><dd>version du {compte.cguVersion}</dd>
            <dt className="text-gris">Connexions</dt>
            <dd>
              {compte.sessions.length === 0
                ? "aucune ouverte"
                : compte.sessions.map((s) => `${SUPPORTS[s.support] ?? s.support} : ${s.nombre}${s.derniereActivite ? ` (${formaterDateRelative(s.derniereActivite)})` : ""}`).join(" · ")}
            </dd>
            {compte.ambassadeur && (<><dt className="text-gris">Ambassadeur</dt><dd>{[compte.ambassadeur.quartier, compte.ambassadeur.ville].filter(Boolean).join(", ")}</dd></>)}
            <dt className="text-gris">Activité</dt>
            <dd>{compte._count.demandesLieux} lieu(x) proposé(s) · {compte._count.missions} mission(s) · {compte._count.candidatures} candidature(s)</dd>
          </dl>
          {compte.journalPoints.length > 0 && (
            <section className="grid gap-2">
              <h3 className="font-extrabold">Derniers points</h3>
              <ul className="grid gap-1 text-sm">
                {compte.journalPoints.map((ligne, i) => (
                  <li key={i} className="flex gap-2">
                    <span className={`chiffres w-12 text-right font-bold ${ligne.points < 0 ? "text-rouge-texte" : "text-vert"}`}>{ligne.points > 0 ? "+" : ""}{ligne.points}</span>
                    <span className="flex-1">{RAISONS_POINTS[ligne.raison] ?? ligne.raison}{ligne.detail && <span className="text-gris"> · {ligne.detail}</span>}</span>
                    <span className="text-gris">{formaterDate(ligne.creeLe)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <section className="grid gap-3">
            <h3 className="font-extrabold">Sur demande de la personne</h3>
            <div className="flex flex-wrap gap-2">
              <BoutonEcrireMail destinataire={{ compteId: compte.id, adresse: compte.email, prenom: compte.prenom }} categorie="autre" />
              <BoutonReponseType categorie="autre" adresse={compte.email} compteId={compte.id} prenom={compte.prenom} />
              <Bouton
                petit
                icone={Download}
                desactive={etat.enCours}
                onClick={() => agir(async () => {
                  const donnees = await exporterDonneesCompte(compte.id);
                  const ok = await enregistrerFichier(`donnees-compte-${compte.id}-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(donnees, null, 2), "application/json");
                  return ok ? "Données enregistrées : envoie ce fichier à la personne, à son adresse." : undefined;
                })}
              >
                Exporter ses données
              </Bouton>
              <Bouton
                petit
                icone={KeyRound}
                desactive={etat.enCours}
                onClick={() => agir(async () => {
                  const reponse = await reinitialiserMotDePasseCompte(compte.id, true);
                  if (reponse.envoye) return `Lien envoyé à ${compte.email} ✅ (valable jusqu'au ${formaterDate(reponse.expireLe, true)}, une seule fois).`;
                  setEtat({ enCours: false, texte: "L'envoi par mail n'a pas marché : voici le lien à lui transmettre toi-même.", lien: reponse.lien });
                })}
              >
                Envoyer un lien « mot de passe oublié »
              </Bouton>
              <Bouton
                petit
                icone={LogOut}
                desactive={etat.enCours}
                onClick={() => window.confirm(`Déconnecter ${compte.prenom} partout (site et app) ? Il devra se reconnecter.`) && agir(async () => {
                  const { fermees } = await deconnecterCompte(compte.id);
                  recharger();
                  return `${fermees} connexion(s) fermée(s).`;
                })}
              >
                Déconnecter partout
              </Bouton>
              <Bouton
                petit
                variante="danger"
                icone={Trash2}
                desactive={etat.enCours}
                onClick={() => window.confirm(`Supprimer TOUT le compte de ${compte.prenom}, app comprise ? Points, badges, rôles, missions, messages : tout part. Impossible de revenir en arrière.`) && agir(async () => {
                  await supprimerCompte(compte.id);
                  onChange();
                  onFermer();
                })}
              >
                Supprimer le compte
              </Bouton>
            </div>
            {etat.texte && <p role="status" className="text-sm font-semibold">{etat.texte}</p>}
            {etat.lien && (
              <div className="flex flex-wrap items-center gap-2 rounded-xl bg-creme p-3">
                <code className="min-w-0 flex-1 overflow-x-auto text-xs whitespace-nowrap">{etat.lien}</code>
                <Bouton petit onClick={() => copier(etat.lien!)}>Copier</Bouton>
              </div>
            )}
          </section>
        </div>
      )}
    </Modale>
  );
}
