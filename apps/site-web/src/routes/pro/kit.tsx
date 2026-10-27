import { stat } from "node:fs/promises";
import { join } from "node:path";
import { Link } from "react-router";

import type { Route } from "./+types/kit";
import { choisirTextes } from "../../../../../packages/commun/src/fonctions/langue/choisir-textes.ts";
import { Bouton } from "~/composants/interface/Bouton";
import { ReglesKit } from "~/composants/kit-media/ReglesKit";
import { SectionKit } from "~/composants/kit-media/SectionKit";
import { TexteAPoster } from "~/composants/kit-media/TexteAPoster";
import { CarteFichiersKitLieux } from "~/composants/kit-media-lieux/CarteFichiersKitLieux";
import { SectionsMaquettesKit } from "~/composants/kit-media/SectionsMaquettesKit";
import { Section } from "~/composants/mise-en-page/Section";
import { TitreLieuPro } from "~/composants/pro/TitreLieuPro";
// Les textes et la liste des fichiers seulement : jamais les dessins (composants/kit-media-lieux/), servis en PNG et en PDF
import { TEXTES_KIT_LIEU_PRO, TEXTES_KIT_LIEU_PRO_PAR_LANGUE } from "~/contenus/kit-lieu-pro";
import {
  DOSSIER_KIT_MEDIA_LIEUX, NOM_ZIP_KIT_MEDIA_LIEUX, TEXTES_KIT_MEDIA_LIEUX_PAR_LANGUE, fichiersKitMediaLieux, groupesKitMediaLieux,
  visuelsKitMediaLieux, type IdVisuelKitLieux, type VisuelKitLieux,
} from "~/contenus/kit-media-lieux";
import { ecrirePoidsFichier } from "~/fonctions/kits/ecrire-poids-fichier";
import { lireLangueMeta } from "~/fonctions/langue/lire-langue-meta";
import { creerMeta } from "~/fonctions/seo/creer-meta";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import { lireLangueRequete } from "~/services/langue.server";
import { exigerLieuPro } from "~/services/lieu-pro.server";
import { lirePoidsMaquettes } from "~/services/maquettes-kits.server";
import { lireCharteMiamSafe } from "~/services/pro.server";

export function meta({ loaderData, matches }: Route.MetaArgs) {
  const langue = lireLangueMeta(matches);
  const T = choisirTextes(TEXTES_KIT_LIEU_PRO_PAR_LANGUE, langue).meta;
  return [...creerMeta({ titre: loaderData ? T.titre(loaderData.lieu.nom) : T.titreParDefaut, description: T.description, langue }), { name: "robots", content: "noindex" }];
}


/** Le lieu, s'il a signé la charte Miam Safe (null : pas pu être lu), et le poids de chaque fichier lu sur le disque. */
export async function loader({ request, params }: Route.LoaderArgs) {
  const { jeton, ip, lieu } = await exigerLieuPro(request, params.id);
  const langue = lireLangueRequete(request).langue;
  const [charte, maquettes, ...lus] = await Promise.all([
    lireCharteMiamSafe(jeton, ip, lieu.id),
    lirePoidsMaquettes("lieux", true, langue),
    ...fichiersKitMediaLieux.map(async (fichier) => {
      const infos = await stat(join(process.cwd(), DOSSIER_KIT_MEDIA_LIEUX, fichier.chemin)).catch(() => null);
      return [fichier.nom, infos ? ecrirePoidsFichier(infos.size, langue, " ") : null] as const;
    }),
  ]);
  return {
    lieu,
    miamSafe: charte.ok ? charte.charte.signee : false,
    poids: { ...maquettes, ...Object.fromEntries(lus) } as Record<string, string | null>,
  };
}

/** Les cartes de la page : une story et un post vont ensemble ; le reste a sa propre carte. */
type CarteKit = { cle: keyof typeof TEXTES_KIT_LIEU_PRO.cartes; ids: IdVisuelKitLieux[]; fondSombre?: boolean };

const cartes: CarteKit[] = [
  { cle: "onEstSur", ids: ["story-on-est-sur-sos-miam", "post-on-est-sur-sos-miam"] },
  { cle: "miamSafe", ids: ["story-lieu-miam-safe", "post-lieu-miam-safe"] },
  { cle: "autocollantSosMiam", ids: ["autocollant-sos-miam"] },
  { cle: "autocollantMiamSafe", ids: ["autocollant-miam-safe"] },
  { cle: "memo", ids: ["memo-equipe-miam-safe"] },
  { cle: "logoClair", ids: ["logo-fond-clair"] },
  { cle: "logoSombre", ids: ["logo-fond-sombre"], fondSombre: true },
];

const PAGES_A_TON_NOM = ["vitrine", "chevalet", "affichette"] as const;

const classeLien = "font-semibold underline decoration-jaune decoration-[3px] underline-offset-4 hover:decoration-encre";

/**
 * Page /lieu/:id/kit : le kit média du lieu (visuels pour les réseaux, autocollants de vitrine, mémo d'équipe, logos,
 * textes prêts à poster et règles). Les visuels Miam Safe ne s'affichent que si le lieu a signé la charte.
 */
export default function PageKitLieu({ loaderData }: Route.ComponentProps) {
  const { lieu, miamSafe, poids } = loaderData;
  const T = utiliserTextes(TEXTES_KIT_LIEU_PRO_PAR_LANGUE);
  const K = utiliserTextes(TEXTES_KIT_MEDIA_LIEUX_PAR_LANGUE);
  const poidsZip = poids[NOM_ZIP_KIT_MEDIA_LIEUX];
  const visible = (visuel: VisuelKitLieux) => miamSafe || !visuel.miamSafe;
  const traduireVisuel = (visuel: VisuelKitLieux): VisuelKitLieux => ({ ...visuel, ...K.visuels[visuel.id] });
  const textes = K.ecrireTextes(lieu.nom, `https://sosmiam.fr/lieux/${lieu.id}`).filter((t) => miamSafe || !t.miamSafe);
  return (
    <Section fond="creme" className="!pt-10 md:!pt-14">
      <TitreLieuPro
        lieu={lieu}
        page={T.page}
        chapo={lierPonctuation(T.chapo)}
      />

      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-carte border-2 border-encre bg-jaune p-5 shadow-brut">
        <p className="flex-1 basis-60 font-semibold">{lierPonctuation(T.toutLeKit)}</p>
        <Bouton href={`/kit-media-lieux/${NOM_ZIP_KIT_MEDIA_LIEUX}`} variante="blanc">
          {T.toutTelecharger(poidsZip ?? null)}
        </Bouton>
      </div>

      {!miamSafe && (
        <p role="note" className="mt-8 rounded-2xl border-2 border-dashed border-encre bg-white px-5 py-4 font-semibold">
          🛡 {lierPonctuation(K.miamSafe.pasSignee)}{" "}
          <Link to={`/lieu/${lieu.id}/miam-safe`} className={classeLien}>{T.voirCharte}</Link>
        </p>
      )}

      {groupesKitMediaLieux.map((groupe) => {
        const cartesGroupe = cartes.filter((carte) => {
          const visuels = carte.ids.map((id) => visuelsKitMediaLieux.find((v) => v.id === id));
          return visuels.every((v) => v && v.groupe === groupe.groupe && visible(v));
        });
        if (cartesGroupe.length === 0) return null;
        return (
          <SectionKit key={groupe.groupe} id={groupe.groupe} titre={K.groupes[groupe.groupe].titre} texte={K.groupes[groupe.groupe].texte}>
            <ul className="grid gap-5 md:grid-cols-2">
              {cartesGroupe.map((carte) => (
                <CarteFichiersKitLieux
                  key={carte.cle}
                  titre={T.cartes[carte.cle].titre}
                  texte={T.cartes[carte.cle].texte}
                  visuels={carte.ids.map((id) => traduireVisuel(visuelsKitMediaLieux.find((v) => v.id === id)!))}
                  fichiers={fichiersKitMediaLieux.filter((f) => f.visuel !== null && carte.ids.includes(f.visuel))}
                  poids={poids}
                  fondSombre={carte.fondSombre}
                />
              ))}
            </ul>
          </SectionKit>
        );
      })}

      <SectionKit id="a-ton-nom" titre={T.aTonNom.titre} texte={T.aTonNom.texte}>
        <ul className="grid gap-5 md:grid-cols-3">
          {PAGES_A_TON_NOM.map((lien) => ({ lien, ...T.aTonNom.pages[lien] })).map((page) => (
            <li key={page.lien} className="flex flex-col gap-3 rounded-carte border-2 border-encre bg-white p-5 shadow-brut">
              <h3 className="text-lg leading-tight font-extrabold">{lierPonctuation(page.titre)}</h3>
              <p className="text-gris">{lierPonctuation(page.texte)}</p>
              <Link to={`/lieu/${lieu.id}/${page.lien}`} className={`mt-auto ${classeLien}`}>
                {T.aTonNom.ouvrir}<span className="sr-only">{T.avantTitre}{page.titre}</span>
              </Link>
            </li>
          ))}
        </ul>
      </SectionKit>

      {/* Les maquettes validées : affiches pour ta vitrine et ta salle (A4, A3, 40 × 60 cm), stickers */}
      <SectionsMaquettesKit kit="lieux" miamSafe={miamSafe} prefixe="/kit-media-lieux" poids={poids} />

      <SectionKit id="textes" titre={T.textes.titre} texte={T.textes.texte}>
        <ul className="grid gap-5 lg:grid-cols-2">
          {textes.map((t) => <TexteAPoster key={t.titre} titre={t.titre} texte={t.texte} />)}
        </ul>
      </SectionKit>

      <SectionKit id="regles" titre={T.regles.titre} texte={T.regles.texte}>
        <ReglesKit regles={{ peux: [...K.regles.peux], peuxPas: [...K.regles.peuxPas] }} />
      </SectionKit>
    </Section>
  );
}
