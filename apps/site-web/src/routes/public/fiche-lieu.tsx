import { data } from "react-router";

import type { Route } from "./+types/fiche-lieu";
import { carteContientAlcool } from "../../../../../packages/commun/src/fonctions/prevention/carte-contient-alcool.ts";
import { BadgeVerifie } from "~/composants/lieux/BadgeVerifie";
import { BlocCarteDuLieu } from "~/composants/lieux/BlocCarteDuLieu";
import { BlocInfosPratiques } from "~/composants/lieux/BlocInfosPratiques";
import { BlocPrevention } from "~/composants/lieux/BlocPrevention";
import { EncartCeLieuEstAToi } from "~/composants/lieux/EncartCeLieuEstAToi";
import { PictoCategorie } from "~/composants/marque/PictoCategorie";
import { categoriesLieux } from "~/contenus/categories-lieux";
import { creerMeta } from "~/fonctions/seo/creer-meta";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { lireFichePublique } from "~/services/pro.server";
import { lireIpVisiteur } from "~/services/session-compte.server";

// Couleurs du dégradé saisies dans le logiciel de gestion : seulement des codes « #RRGGBB » (ou courts)
const COULEUR = /^#[0-9a-f]{3,8}$/i;
const classeLien = "font-semibold underline decoration-jaune decoration-[3px] underline-offset-2 hover:decoration-encre";

/** La fiche d'un lieu publié ; 404 (page introuvable) s'il n'existe pas, est en brouillon ou masqué. */
export async function loader({ request, params }: Route.LoaderArgs) {
  if (!/^\d{1,9}$/.test(params.id) || Number(params.id) <= 0) throw data(null, { status: 404 });
  const reponse = await lireFichePublique(Number(params.id), lireIpVisiteur(request));
  if (reponse.ok) return { lieu: reponse.lieu };
  if (reponse.erreur === "lieu-inconnu" || reponse.erreur === "introuvable") throw data(null, { status: 404 });
  throw data("Fiche momentanément indisponible", { status: 503 });
}

/** Indexée : titre « Nom à Ville », description tirée de la fiche ; l'adresse canonique est posée par le cadre public. */
export function meta({ loaderData }: Route.MetaArgs) {
  if (!loaderData) return [{ title: "Lieu introuvable — SOS Miam" }, { name: "robots", content: "noindex" }];
  const { lieu } = loaderData;
  const resume = [lieu.info, lieu.quartier && `${lieu.quartier}, ${lieu.ville}`, lieu.texte].filter(Boolean).join(" · ");
  const description = resume.length > 155 ? `${resume.slice(0, 152).trimEnd()}…` : resume || `${lieu.nom}, à ${lieu.ville}, sur SOS Miam.`;
  return creerMeta({ titre: `${lieu.nom} à ${lieu.ville}`, description });
}

/** Une fiche se met à jour vite (le gérant la modifie) : une minute en cache, comme l'API. */
export function headers() {
  return { "Cache-Control": "public, max-age=60" };
}

/**
 * Page /lieux/:id : la fiche publique d'un lieu, avec « Vérifié ✓ » ou « Lieu non vérifié », l'adresse et l'itinéraire,
 * les horaires, la présentation, la carte remplie par le lieu (avec le message sanitaire si elle a de l'alcool), les infos
 * pratiques (une info inconnue n'est pas affichée) et « Ce lieu est à toi ? ».
 */
export default function PageFicheLieu({ loaderData }: Route.ComponentProps) {
  const { lieu } = loaderData;
  const [debut, fin] = lieu.couleurs.length >= 2 && lieu.couleurs.every((couleur) => COULEUR.test(couleur)) ? lieu.couleurs : ["#FFD60A", "#FF4D3D"];
  const categorie = categoriesLieux.find((uneCategorie) => uneCategorie.valeur === lieu.type)?.libelle;
  // L'adresse saisie contient parfois déjà la ville : on ne la répète pas
  const adresse = lieu.adresse && !lieu.adresse.toLowerCase().includes(lieu.ville.toLowerCase()) ? `${lieu.adresse}, ${lieu.ville}` : lieu.adresse;
  const lieuComplet = [lieu.nom, adresse ?? lieu.ville].join(", ");
  const itineraire = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(lieuComplet)}`;
  return (
    <article className="bg-creme pb-16 md:pb-24">
      <div className="grid h-40 place-items-center text-7xl md:h-56" style={{ background: `linear-gradient(135deg, ${debut}, ${fin})` }}>
        <span aria-hidden="true">{lieu.emoji}</span>
      </div>
      <div className="mx-auto -mt-10 w-[min(860px,100%-32px)]">
        <header className="rounded-carte border-2 border-encre bg-white p-6 shadow-brut md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <BadgeVerifie verifie={lieu.estVerifie} />
              <h1 className="mt-3 text-[clamp(2rem,5vw,3.2rem)] font-extrabold tracking-tight [overflow-wrap:anywhere]">{lieu.nom}</h1>
              <p className="mt-1 text-gris">{[lieu.info, categorie, lieu.prix].filter(Boolean).join(" · ")}</p>
            </div>
            <PictoCategorie type={lieu.type} className="h-12 w-12 shrink-0" />
          </div>
          {!lieu.estVerifie && (
            <p className="mt-4 rounded-xl border-2 border-dashed border-encre bg-creme px-4 py-3 text-sm">
              {lierPonctuation("Lieu non vérifié : il n'a pas encore de compte SOS Miam. Ses infos viennent de l'équipe ou d'un ambassadeur.")}
            </p>
          )}
          <p className="mt-5 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <span><span aria-hidden="true">📍 </span>{adresse ?? [lieu.quartier, lieu.ville].filter(Boolean).join(", ")}</span>
            <a href={itineraire} rel="noopener nofollow" className={classeLien}>Itinéraire<span className="sr-only">{` vers ${lieu.nom}`}</span></a>
          </p>
        </header>

        <div className="mt-8 grid gap-6">
          {(lieu.horaires || lieu.texte) && (
            <section aria-labelledby="fiche-presentation" className="rounded-carte border-2 border-encre bg-white p-5 shadow-brut md:p-6">
              <h2 id="fiche-presentation" className="sr-only">Présentation</h2>
              {lieu.horaires && <p className="font-semibold"><span aria-hidden="true">🕒 </span><span className="sr-only">Horaires : </span>{lieu.horaires}</p>}
              {lieu.texte && <p className={`whitespace-pre-line [overflow-wrap:anywhere] ${lieu.horaires ? "mt-4" : ""}`}>{lieu.texte}</p>}
            </section>
          )}
          {/* La carte remplie par le lieu ; avec de l'alcool, le message sanitaire suit, juste dessous */}
          {lieu.carte && <BlocCarteDuLieu carte={lieu.carte} type={lieu.type} />}
          <BlocInfosPratiques infos={lieu} />
          {/* Un bar sert de l'alcool : message sanitaire (loi Évin) et aide, décidé par Hugo le 9 octobre 2026 (une seule
              fois sur la page : s'il est déjà sous la carte, il n'est pas répété) */}
          {lieu.type === "bar" && !carteContientAlcool(lieu.carte) && <BlocPrevention />}
          {lieu.decouvertPar && <p className="font-semibold"><span aria-hidden="true">🛟 </span>Déniché par {lieu.decouvertPar}</p>}
          <EncartCeLieuEstAToi lieuId={lieu.id} verifie={lieu.estVerifie} />
        </div>
      </div>
    </article>
  );
}
